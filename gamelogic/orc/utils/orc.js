import { userSettings } from '../../setup.js';
import { SpeechBubble } from '../../dialogUI/speechbubble.js';
import { SpriteGenerator } from '../../sprites/spriteGenerator.js';
import { LaserGun } from '../../weapons/laser-gun.js';
import { WeaponFactory } from '../../weapons/weapon-factory.js';

export class Orc extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, team, behaviour = 'rusher') {
    // Create the sprite with the team-specific body texture
    const bodySprite = team === 'blue' ? 'orc-body-blue' : 'orc-body-red';
    super(scene, x, y, bodySprite);
    this.scene = scene;
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spriteGen = new SpriteGenerator(scene);

    // Set up physics with more accurate hitbox
    this.setCollideWorldBounds(true);

    // Use rectangular hitbox that better matches orc body shape
    this.body.setSize(24, 32); // width, height
    this.body.setOffset(4, 0); // Center the hitbox on the sprite

    this.setMass(1);
    this.setDrag(100);
    this.setBounce(0.2); // Bounce when hitting terrain

    // Create head sprite
    const headTypes = ['ponytail', 'mohawk', 'bald-horned'];
    const randomHead = headTypes[Math.floor(Math.random() * headTypes.length)];
    this.head = scene.add.sprite(x, y, `orc-head-${randomHead}`);
    this.head.setDepth(1);

    // Basic properties

    this.team = team;
    this.originalbehaviour = behaviour;
    this.behaviour = behaviour;
    this.health = 2;
    this.lastFireTime = 0;
    this.fireRate = 800 + Math.random() * 400;

    // AI properties
    this.target = null;
    this.aiState = 'patrol';
    this.patrolTarget = { x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 200 };
    this.lastEvasionTime = 0;
    this.evasionCooldown = 2000;
    this.coverTarget = null;
    this.advanceWaypoint = null;

    // Line of sight seeking (for terrain destruction)
    this.seekingLineOfSightStartTime = null;
    this.terrainPatience = this.generateTerrainPatience(); // Individual patience for terrain destruction

    // Movement properties
    this.stuck = false;
    this.lastPosition = { x, y };
    this.stuckTime = 0;
    this.combatStrip = scene.getCombatStrip(x);

    // Rotation properties
    this.bodyRotation = 0;
    this.headRotation = 0;
    this.headTurnSpeed = 3.0;
    this.bodyTurnSpeed = 2.0;

    // Unit info display
    this.showUnitInfo = userSettings.showUnitInfo;
    this.unitInfoLabel = null;

    if (this.showUnitInfo) {
      this.createUnitInfoLabel(scene);
    }

    // Create speech bubble
    this.dialog = new SpeechBubble(scene, this);

    // Set behaviour-specific stats
    this.setbehaviourStats(behaviour);

    // Generate individual aim variance for this orc
    this.generateAimVariance();

    // EQUIP APPROPRIATE WEAPON
    if (behaviour === 'cover_firer') {
      // Temporarily disable warp cannons - too complex for simple peon brain
      // const isWarperCandidate = Math.random() < 0.3; // Roughly 30% chance for warper
      // if (isWarperCandidate) {
      //   this.equip(WeaponFactory.createWarperLaser(scene));
      // } else {
        this.equip(WeaponFactory.createHeavyLaser(scene));
      // }
    } else {
      this.equip(WeaponFactory.createStandardLaser(scene));
    }

    // Initialize collision state
    this.collisionsDisabled = false;
  }

  attemptDie() {
    // Safety check - prevent multiple death attempts
    if (this.isDying || !this.scene) {
      console.warn('Orc already dying or scene unavailable');
      return;
    }

    // Mark as dying to prevent multiple calls
    this.isDying = true;

    // Check if this orc is a berserker candidate with immunity
    if (this.berserkerCandidate && this.immuneToDamage) {
      // Reset dying flag since we're not actually dying
      this.isDying = false;

      // Heal to minimum viable health
      this.health = Math.max(1, this.health);

      // Cancel any death effects and restore appearance
      this.scene.tweens.killTweensOf(this);
      this.setAlpha(1);
      this.setScale(1);
      this.clearTint();

      if (this.head) {
        this.scene.tweens.killTweensOf(this.head);
        this.head.setAlpha(1);
        this.head.setScale(1);
        this.head.clearTint();
      }

      // Show immunity effect
      this.scene.createImmunityEffect(this);
      return;
    }

    // Create blood stain at orc's death location
    this.scene.createBloodStain(this.x, this.y);

    // Clean up sprites immediately to prevent visual glitches
    this.cleanupSprites();
    const orc = this;
    const { scene } = this;
    this.scene.tweens.add({
      targets: orc,
      alpha: 0,
      scale: 0,
      rotation: orc.rotation + Math.PI * 2,
      duration: 300,
      onComplete: () => {
        orc.destroy();
        scene.blueOrcs = scene.blueOrcs.filter((o) => o !== orc);
        scene.redOrcs = scene.redOrcs.filter((o) => o !== orc);

        // Remove from berserker list if applicable
        if (scene.berserkerOrcs.includes(orc)) {
          scene.berserkerOrcs = scene.berserkerOrcs.filter((o) => o !== orc);
          console.log(`Berserker killed. Remaining berserkers: ${scene.berserkerOrcs.length}`);
        }

        scene.updateUI();
      },
    });

    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        orc.x + (Math.random() - 0.5) * 20,
        orc.y + (Math.random() - 0.5) * 20,
        3,
        0xff4444,
      );
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 100,
        y: particle.y + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 1000,
        onComplete: () => particle.destroy(),
      });
    }
  }

  // WEAPON MANAGEMENT METHODS
  equip(weapon) {
    this.weapon = weapon;
    if (weapon) {
      console.log(`${this.team} orc equipped with ${weapon.getWeaponInfo().type}`);
    }
  }

  unequip() {
    if (this.weapon) {
      console.log(`${this.team} orc unequipped ${this.weapon.getWeaponInfo().type}`);
      this.weapon = null;
    }
  }

  hasWeapon() {
    return this.weapon !== null;
  }

  overclockEquippedWeapon(fireRateReduction, minimumFireRate = 100, speedMultiplier = 1.0) {
    if (this.hasWeapon()) {
      this.weapon.overclock(fireRateReduction, minimumFireRate, speedMultiplier);
      console.log(`${this.team} orc overclocked weapon by reducing fire rate by ${fireRateReduction}ms`);
    } else {
      console.log(`${this.team} orc has no weapon to overclock!`);
    }
  }

  generateAimVariance() {
    // Each orc gets a random aim variance between 0.05 and 0.15 radians
    // This represents individual marksmanship skill differences
    const minVariance = 0.05; // ~3 degrees
    const maxVariance = 0.15; // ~8.5 degrees
    this.aimVariance = minVariance + Math.random() * (maxVariance - minVariance);

    // Cover firers are generally more accurate (reduce variance by 30%)
    if (this.behaviour === 'cover_firer') {
      this.aimVariance *= 0.7;
    }

    // console.log(
    //   `${this.team} ${this.behaviour} orc aim variance: ${((this.aimVariance * 180) / Math.PI).toFixed(1)}°`,
    // );
  }

  setbehaviourStats(behaviour) {
    if (behaviour === 'rusher') {
      this.moveSpeed = 100; // Increased from 70 - rushers should be fast!
      this.bodyTurnSpeed = 2;
      this.preferredRange = 120;
    } else {
      // cover_firer
      this.moveSpeed = 55;
      this.bodyTurnSpeed = 1.5;
      this.preferredRange = 250;
    }
  }

  generateTerrainPatience() {
    // Generate random patience between 0.5 and 1.5 seconds
    // Berserkers have less patience than normal orcs
    if (this.type === 'berserker') {
      return 0.1 + Math.random() * 0.5;
    }
    return 1 + Math.random() * 1.0; // 0.5 to 1.5 seconds (normal)
  }

  // Terrain destruction method for axe attacks
  destroyTerrainChunk(terrain) {
    // console.log(`${orc.team} orc using axe to destroy terrain chunk`);

    // Store terrain position before destruction for knockback calculations
    const terrainX = terrain.x;
    const terrainY = terrain.y;

    // Create axe swing effect
    const axeSprite = this.scene.add.sprite(this.x, this.y, 'axe');
    const swingAngle = Phaser.Math.Angle.Between(this.x, this.y, terrain.x, terrain.y);
    axeSprite.setRotation(swingAngle);

    // Animate axe swing
    this.scene.tweens.add({
      targets: axeSprite,
      x: terrain.x,
      y: terrain.y,
      rotation: swingAngle + Math.PI / 4, // Quarter turn during swing
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // Impact effect if orc is alive
        if (this && this.scene) {
          const impact = this.scene.add.circle(terrain.x, terrain.y, 15, 0xff4444);
          this.scene.tweens.add({
            targets: impact,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => impact.destroy(),
          });

          // Check for orcs to knockback BEFORE destroying terrain
          this.scene.checkTerrainKnockback(terrainX, terrainY, this);
        }
        // Remove axe sprite
        axeSprite.destroy();
      },
    });

    // Handle terrain destruction based on type
    if (terrain.terrainType === 'terrain-tree') {
      // Trees are destroyed completely when chopped
      terrain.destroy();
      this.scene.terrain = this.scene.terrain.filter((t) => t !== terrain);
      this.scene.terrainGroup.remove(terrain);
    } else if (terrain.terrainType === 'terrain-rock-chunk') {
      // Rock chunks - destroy the specific chunk
      if (terrain.rockParent) {
        terrain.rockParent.destroyChunk(terrain);
      }
    } else if (terrain.terrainType === 'terrain-block-chunk') {
      // Block chunks - destroy the specific chunk
      if (terrain.blockParent) {
        terrain.blockParent.destroyChunk(terrain);
      }
    } else {
      // Legacy terrain - shouldn't happen anymore but kept for safety
      terrain.destroy();
      this.scene.terrain = this.terrain.filter((t) => t !== terrain);
      this.scene.terrainGroup.remove(terrain);
    }

    // Clear the orc's stuck seeking state and regenerate patience
    this.seekingLineOfSightStartTime = null;
    this.terrainPatience = this.generateTerrainPatience(); // Generate new patience after using axe
    this.aiState = 'patrol';
  }

  convertToRusher() {
    //console.log(`Converting ${this.team} orc from ${this.behaviour} to rusher`);
    this.behaviour = 'rusher';
    this.setbehaviourStats('rusher');
    this.aiState = 'patrol';
    this.coverTarget = null;
    this.advanceWaypoint = null;
    // bodyTurnSpeed now set by setbehaviourStats to 2.5

    // Regenerate aim variance as a rusher (removing cover firer accuracy bonus)
    this.generateAimVariance();

    // Re-equip appropriate weapon for new behavior
    this.equip(LaserGun.createStandardLaser(this.scene));

    // Update label if showing unit info
    if (this.unitInfoLabel) {
      const weaponInfo = this.hasWeapon() ? this.weapon.getWeaponInfo() : { fireRate: 'N/A' };
      this.unitInfoLabel.setText(`RUSHER\n${weaponInfo.fireRate}ms`);
    }
  }

  createUnitInfoLabel() {
    // Create multi-line text with behavior and fire rate
    const behaviorText = this.behaviour === 'rusher' ? 'RUSHER' : 'COVER';
    const weaponInfo = this.hasWeapon() ? this.weapon.getWeaponInfo() : { fireRate: 'N/A' };
    const labelText = `${behaviorText}\n${weaponInfo.fireRate}ms`;
    const teamColor = this.team === 'blue' ? '#4A90E2' : '#E74C3C';

    this.unitInfoLabel = this.scene.add
      .text(this.x, this.y - 25, labelText, {
        fontSize: '9px',
        fill: teamColor,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        padding: { x: 4, y: 2 },
        stroke: '#ffffff',
        strokeThickness: 1,
        align: 'center',
      })
      .setOrigin(0.5);
    this.unitInfoLabel.setDepth(2);
  }

  cleanupSprites() {
    // Destroy head sprite
    if (this.head && this.head.active) {
      this.head.destroy();
      this.head = null;
    }

    // Destroy unit info label
    if (this.unitInfoLabel && this.unitInfoLabel.active) {
      this.unitInfoLabel.destroy();
      this.unitInfoLabel = null;
    }

    // Destroy speech bubble
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }
    
    // Unequip weapon (cleanup reference)
    this.unequip();
    
    // Clean up berserker sprites if this is a berserker
    if (this.type === 'berserker') {
      if (this.healthBar) {
        this.healthBar.destroy();
        this.healthBar = null;
      }
      
      if (this.healthBarBg) {
        this.healthBarBg.destroy();
        this.healthBarBg = null;
      }
      
      if (this.invulnerabilityIndicator) {
        this.invulnerabilityIndicator.destroy();
        this.invulnerabilityIndicator = null;
      }
    }
  }

  move(x, y) {
    // Move the main body
    this.setPosition(x, y);
    // Sync all related sprites
    this.syncSprites();
  }

  fireLaser(targetAngle = null) {
    console.log(`${this.team} orc attempting to fire laser`);
    
    if (!this.hasWeapon()) {
      console.log(`${this.team} orc has no weapon equipped!`);
      return null;
    }
    
    // Check fire rate timing
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastFireTime < this.weapon.fireRate) {
      return null;
    }
    
    console.log(`${this.team} orc firing weapon: ${this.weapon.getWeaponInfo().type}`);
    
    // Fire the weapon with optional target angle for enhanced aiming
    const laser = this.weapon.fire(this, targetAngle);
    
    if (laser) {
      this.lastFireTime = currentTime;
      console.log(`${this.team} orc successfully fired ${this.weapon.getWeaponInfo().type}`);
    } else {
      console.log(`${this.team} orc weapon.fire() returned null!`);
    }
    
    return laser;
  }

  syncSprites() {
    // Sync head position and rotation (centered on body)
    if (this.head) {
      this.head.x = this.x;
      this.head.y = this.y;
      this.head.setRotation(this.headRotation);
    }

    // Sync unit info label (above the body center)
    if (this.unitInfoLabel) {
      this.unitInfoLabel.x = this.x;
      this.unitInfoLabel.y = this.y - 25;
    }

    // Update speech bubble
    if (this.dialog) {
      this.dialog.update();
    }
    
    // Sync berserker-specific sprites (health bar and invulnerability indicator)
    if (this.type === 'berserker' && this.syncBerserkerSprites) {
      this.syncBerserkerSprites();
    }
  }

  destroy() {
    // Clean up all related sprites first
    this.cleanupSprites();

    // Then destroy the main sprite
    super.destroy();
  }
}
