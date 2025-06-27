// Main game scene and core logic
import { OrcBehaviour } from '../../orc/utils/orc-behaviour.js';

// The BattleScene Contains the Main Game Creation and Game Loop logic.
// All other actions are modularised
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
        this.gameOver = false;
        this.winner = null;
        this.gameStartTime = null; // Will be set after all objects are loaded
        this.gameEndTime = null;

        // Clean up any existing blood stains from previous games
        this.cleanupBloodStains();

        // Reset any berserker collision states from previous games
        this.resetAllCollisionStates();

        // Firing delay system - no one can fire for first 1 second
        this.firingAllowed = false;
        this.firingDelayTime = 1000; // 1 second delay

        // King release system
        this.kingsReleased = false;
        this.kingReleaseTime = 14000; // 14 seconds in milliseconds

        // Create all sprites first
        this.createFlagSprites();
        this.createLaserSprite();
        this.createTerrainSprites();

        // Create alcoves and kings
        this.createKingsAndAlcoves();

        // Create terrain obstacles
        this.createTerrain();

        // Create background decorations
        this.createBackgroundDecorations();

        // Create orc teams
        this.createTeams();

        // Set up physics
        this.physics.world.setBounds(0, 0, 800, 600);

        // Create physics groups
        this.blueOrcGroup = this.physics.add.group();
        this.redOrcGroup = this.physics.add.group();
        this.laserGroup = this.physics.add.group();
        this.terrainGroup = this.physics.add.staticGroup();

        // Add orcs to groups
        this.blueOrcs.forEach(orc => this.blueOrcGroup.add(orc));
        this.redOrcs.forEach(orc => this.redOrcGroup.add(orc));

        // Add terrain to group (including rock chunks)
        // console.log('Adding terrain to collision groups:');
        this.terrain.forEach(terrain => {
            if (terrain.chunks) {
                // Rock or Block class - add all chunks
                // console.log(`Adding ${terrain.chunks.length} chunks from ${terrain.terrainType}`);
                terrain.chunks.forEach(chunk => {
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
        // Always sync sprite positions, even during game over
        [...this.blueOrcs, ...this.redOrcs].forEach(orc => {
            if (orc.active) {
                orc.syncSprites();
                // Sync berserker visual effects
                this.syncEffectPositions(orc);
            }
        });

        // Sync king sprites and animate their heads
        if (this.blueKing && this.blueKing.alive) {
            // Safety check before syncing
            this.blueKing.syncSprites();
            this.blueKing.updateHeadAnimation(time);

            if (this.blueKing.released) {
                this.blueKing.updateKingMarch(time);
            }
        }
        if (this.redKing && this.redKing.alive) {
            // Safety check before syncing
            this.redKing.syncSprites();
            this.redKing.updateHeadAnimation(time);

            if (this.redKing.released) {
                this.redKing.updateKingMarch(time);
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
        this.checkFiringDelay();

        // Manage cover firer phase and movements
        this.updateCombatStripPositions();
        this.checkCoverFirerAdvancement();

        // Check if kings should be released
        this.checkKingRelease();

        // Check the phase condition for Berserkers
        this.checkBerserkerTrio();
        // Update the berserker subphases (if we're in berserker phase)
        this.updateBerserkerPhase(time);

        [...this.blueOrcs, ...this.redOrcs].forEach(orc => {
            if (orc.active) {
                OrcBehaviour.updateOrcAI(this, orc, time);
                OrcBehaviour.checkIfOrcStuck(this, orc, time);
            }
        });

        this.updateLaserPositions(delta);

        // Check if the game is won and start the Victory Phase if it is
        this.checkWinCondition();
    }

    // The override for the Scene destory method to allow for cleaning up additional timeouts
    destroy() {
        // Clean up any pending timeouts to prevent errors when restarting
        this.cleanupPendingTimeouts();

        // Call parent destroy
        super.destroy();
    }
}
