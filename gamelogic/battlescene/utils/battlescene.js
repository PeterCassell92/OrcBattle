// Main game scene and core logic
import { OrcBehaviour } from '../../orc/utils/orc-behaviour.js';
import { WarpCannon } from '../../weapons/warp-cannon.js';

/**
 * The BattleScene Contains the Main Game Creation and Game Loop logic.
 * All other actions are modularised
 * @implements {import('../index.d.ts').IBattleScene}
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.blueOrcs = [];
    this.redOrcs = [];
    this.lasers = [];
    this.terrain = [];
    this.backgroundDecorations = []; // Track grass and shrubs
    this.bloodStains = []; // Track persistent blood stains
    this.gameOver = false;
    this.winner = null;
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.blueKing = null;
    this.redKing = null;

    // Combat strip system - 11 strips from -5 to +5
    this.combatStripWidth = 800 / 11; // ~72.7 pixels per strip
    this.combatStrips = {
      '-5': -5,
      '-4': -4,
      '-3': -3,
      '-2': -2,
      '-1': -1,
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
    };

    // Berserker trio system
    this.berserkerTrioActive = false;
    this.berserkerTeam = null;
    this.berserkerOrcs = [];
    this.berserkerPhase = null; // 'immunity', 'invisibility', 'berserker'
    this.berserkerPhaseStartTime = null;
  }

  preload() {
    // Load external image assets
    this.loadExternalAssets();
  }

  loadExternalAssets() {
    // Load head images
    this.load.image('orc-head-ponytail', 'assets/heads/ponytail.png');
    this.load.image('orc-head-mohawk', 'assets/heads/mohawk.png');
    this.load.image('orc-head-bald-horned', 'assets/heads/bald-horned.png');
    this.load.image('king-head-red', 'assets/heads/redkinghead.png');
    this.load.image('king-head-blue', 'assets/heads/bluekinghead.png');

    // Load body images
    this.load.image('orc-body-blue', 'assets/bodies/orc-blue.png');
    this.load.image('orc-body-red', 'assets/bodies/orc-red.png');
    this.load.image('king-body-blue', 'assets/bodies/king-blue.png');
    this.load.image('king-body-red', 'assets/bodies/king-red.png');
  }

  // Initiation of game
  create() {
    /** @type {import('../index.d.ts').IBattleScene} */
    const scene = this;

    this.gameOver = false;
    this.winner = null;
    this.gameStartTime = null; // Will be set after all objects are loaded
    this.gameEndTime = null;

    // Clean up any existing blood stains from previous games
    scene.cleanupBloodStains();

    // Reset any berserker collision states from previous games
    //scene.resetAllCollisionStates();

    // Firing delay system - no one can fire for first 1 second
    this.firingAllowed = false;
    this.firingDelayTime = 1000; // 1 second delay

    // King release system
    this.kingsReleased = false;
    this.kingReleaseTime = 10000; // 11 seconds in milliseconds

    // Create all sprites first
    scene.createFlagSprites();
    scene.createLaserSprite();
    scene.createTerrainSprites();

    // Create alcoves and kings
    scene.createKingsAndAlcoves();

    // Create terrain obstacles
    scene.createTerrain();

    // Create background decorations
    scene.createBackgroundDecorations();

    // Create orc teams
    scene.createTeams();

    // Set up physics
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create physics groups
    this.blueOrcGroup = this.physics.add.group();
    this.redOrcGroup = this.physics.add.group();
    this.laserGroup = this.physics.add.group();
    this.terrainGroup = this.physics.add.staticGroup();

    // Add orcs to groups
    this.blueOrcs.forEach((orc) => this.blueOrcGroup.add(orc));
    this.redOrcs.forEach((orc) => this.redOrcGroup.add(orc));

    // Add terrain to group (including rock chunks)
    // console.log('Adding terrain to collision groups:');
    this.terrain.forEach((terrain) => {
      if (terrain.chunks) {
        // Rock or Block class - add all chunks
        // console.log(`Adding ${terrain.chunks.length} chunks from ${terrain.terrainType}`);
        terrain.chunks.forEach((chunk) => {
          this.terrainGroup.add(chunk);
          // console.log(`Added chunk at (${chunk.x}, ${chunk.y}) to terrain group`);
        });
      } else {
        // Regular terrain sprite
        // console.log(`Adding single terrain ${terrain.terrainType} at (${terrain.x}, ${terrain.y})`);
        this.terrainGroup.add(terrain);
      }
    });

    // console.log(`Total terrain group children: ${this.terrainGroup.children.size}`);

    // Set up collisions
    this.setupInitialColliders();
    // Update UI
    this.updateUI();

    // NOW start the game timer - all objects are fully loaded and initialized
    this.gameStartTime = Date.now();
    console.log('Game timer started - all objects loaded and ready!');
  }

  // The main game loop
  update(time, delta) {
    /** @type {import('../index.d.ts').IBattleScene} */
    const scene = this;
    // Always sync sprite positions, even during game over
    [...this.blueOrcs, ...this.redOrcs].forEach((orc) => {
      if (orc.active) {
        orc.syncSprites();
        // Sync berserker visual effects
        scene.syncEffectPositions(orc);
      }
    });

    // Sync king sprites and animate their heads
    if (this.blueKing && this.blueKing.alive) {
      // Safety check before syncing
      this.blueKing.syncSprites();
      this.blueKing.updateHeadAnimation(time);

      if (this.blueKing.released) {
        this.blueKing.updateKingMarch(time);
        // Enforce boundaries for marching king
        scene.enforceWorldBoundaries(this.blueKing);
        scene.validateOrcPosition(this.blueKing);
      }
    }
    if (this.redKing && this.redKing.alive) {
      // Safety check before syncing
      this.redKing.syncSprites();
      this.redKing.updateHeadAnimation(time);

      if (this.redKing.released) {
        this.redKing.updateKingMarch(time);
        // Enforce boundaries for marching king
        scene.enforceWorldBoundaries(this.redKing);
        scene.validateOrcPosition(this.redKing);
      }
    }

    if (this.gameOver) {
      // No need to perform the other subsequent checks. Only moving Kings and Orcs around.
      return;
    }

    // Don't run game logic until timer has started (all objects loaded)
    if (!this.gameStartTime) {
      return;
    }

    // Check if firing should be allowed (after 1 second delay) - A temporary ceasfire
    scene.checkFiringDelay();

    // Manage cover firer phase and movements
    scene.updateCombatStripPositions();
    scene.checkCoverFirerAdvancement();

    // Check if kings should be released
    scene.checkKingRelease();

    // Check the phase condition for Berserkers
    scene.checkBerserkerTrio();
    // Update the berserker subphases (if we're in berserker phase)
    scene.updateBerserkerPhase(time);

    [...this.blueOrcs, ...this.redOrcs].forEach((orc) => {
      if (orc.active) {
        // First validate and correct orc position if needed
        scene.validateOrcPosition(orc);

        // Run AI behavior
        OrcBehaviour.updateOrcAI(this, orc, time);

        // Enforce world boundaries after AI movement
        scene.enforceWorldBoundaries(orc);

        // Check if orc is stuck
        OrcBehaviour.checkIfOrcStuck(this, orc, time);
      }
    });

    // Update warp cannon corkscrew motion
    WarpCannon.updateWarpLasers(this, time, delta);

    scene.updateLaserPositions(delta);

    // Check if the game is won and start the Victory Phase if it is
    scene.checkWinCondition();
  }

  // The override for the Scene destory method to allow for cleaning up additional timeouts
  destroy() {
    /** @type {import('../index.d.ts').IBattleScene} */
    const scene = this;

    // Clean up any pending timeouts to prevent errors when restarting
    scene.cleanupPendingTimeouts();

    // Call parent destroy
    super.destroy();
  }
}
