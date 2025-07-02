import { LaserGun } from './laser-gun.js';

/**
 * WarpCannon Class - Specialized laser weapon that fires spiraling projectiles
 * Extends LaserGun with custom spiral firing mechanics
 */
export class WarpCannon extends LaserGun {
  /**
   * Create a warp cannon weapon
   * @param {Phaser.Scene} scene - The game scene this weapon belongs to
   * @param {Object} config - Weapon configuration object
   */
  constructor(scene, config = {}) {
    // Call parent constructor with warp cannon defaults
    const warpConfig = {
      fireRate: 150,
      laserTexture: 'laser',
      laserSpeed: 400,
      muzzleFlashColor: 0xff69b4, // Hot pink
      muzzleFlashSize: 12,
      weaponType: 'Warp Cannon',
      ...config // Allow overrides
    };
    
    super(scene, warpConfig);
    
    // Warp cannon specific properties
    this.spiralAngleStep = 0.3;
    this.spiralCurrentAngle = 0;
    this.spiralPhase = 0;
  }
  
  /**
   * Override fire method to implement spiral projectile mechanics
   * @param {IOrc} shooter - The orc firing the weapon
   * @param {number} targetAngle - Optional override for firing angle
   * @returns {Phaser.Physics.Arcade.Sprite|null} The created laser sprite or null if failed
   */
  fire(shooter, targetAngle = null) {
    if (!shooter || !shooter.active || !shooter.scene) return null;
    
    console.log(`WarpCannon firing for ${shooter.team} orc at position (${shooter.x}, ${shooter.y})`);
    
    // Calculate firing position
    const baseAngle = targetAngle !== null ? targetAngle : shooter.rotation;
    const spawnX = shooter.x + Math.cos(baseAngle) * this.barrelOffset;
    const spawnY = shooter.y + Math.sin(baseAngle) * this.barrelOffset;
    
    console.log(`WarpCannon spawn position: (${spawnX}, ${spawnY}), baseAngle: ${baseAngle}`);
    
    // Use spiral angle instead of orc facing
    const firingAngle = this.spiralCurrentAngle;
    
    // Advance spiral for next shot
    this.spiralCurrentAngle += this.spiralAngleStep;
    if (this.spiralCurrentAngle > Math.PI * 2) {
      this.spiralCurrentAngle -= Math.PI * 2;
    }
    
    // Progress spiral phase for color variations
    this.spiralPhase += 0.2;
    if (this.spiralPhase > Math.PI * 2) {
      this.spiralPhase -= Math.PI * 2;
    }
    
    // Create spiral laser projectile
    const laser = this.createSpiralLaser(shooter, spawnX, spawnY, firingAngle);
    
    if (laser) {
      // Create pink muzzle flash
      this.createMuzzleFlash(spawnX, spawnY);
      console.log(`WarpCannon successfully created spiral laser at angle ${firingAngle}`);
    } else {
      console.error('WarpCannon FAILED to create spiral laser!');
    }
    
    return laser;
  }
  
  /**
   * Create a spiral laser projectile with special properties
   * @param {IOrc} shooter - The orc firing the weapon
   * @param {number} x - Spawn X coordinate
   * @param {number} y - Spawn Y coordinate
   * @param {number} angle - Firing angle in radians
   * @returns {Phaser.Physics.Arcade.Sprite} The created spiral laser
   */
  createSpiralLaser(shooter, x, y, angle) {
    console.log(`Creating spiral laser at (${x}, ${y}) with angle ${angle}`);
    
    // Verify scene and texture exist
    if (!this.scene) {
      console.error('WarpCannon: Scene is null!');
      return null;
    }
    
    if (!this.scene.textures.exists(this.laserTexture)) {
      console.error(`WarpCannon: Laser texture '${this.laserTexture}' does not exist!`);
      console.log('Available textures:', Object.keys(this.scene.textures.list));
      return null;
    }
    
    // Create basic laser sprite
    const laser = this.scene.physics.add.sprite(x, y, this.laserTexture);
    
    if (!laser) {
      console.error('WarpCannon: Failed to create physics sprite!');
      return null;
    }
    
    console.log(`WarpCannon: Successfully created sprite at (${laser.x}, ${laser.y})`);
    
    laser.setRotation(angle);
    
    // Set basic laser properties
    laser.shooter = shooter;
    laser.team = shooter.team;
    laser.weapon = this;
    laser.isWarpLaser = true;
    
    // Make it visible with gradient pink tint that changes over time
    const initialPink = 0xffb6c1; // Light pink
    laser.setTint(initialPink);
    laser.setScale(1.5, 2); // Make it visible but not too large
    
    console.log(`WarpCannon: Applied bright pink tint and larger scale`);
    
    // Physics setup
    laser.setCollideWorldBounds(false);
    if (laser.body) {
      laser.body.setSize(6, 2);
    }
    
    // Calculate and set velocity
    const velocityX = Math.cos(angle) * this.laserSpeed;
    const velocityY = Math.sin(angle) * this.laserSpeed;
    laser.setVelocity(velocityX, velocityY);
    
    console.log(`WarpCannon: Set velocity (${velocityX}, ${velocityY})`);
    
    // Verify scene arrays exist before adding
    if (!this.scene.lasers) {
      console.error('WarpCannon: scene.lasers array does not exist!');
      this.scene.lasers = [];
    }
    if (!this.scene.laserGroup) {
      console.error('WarpCannon: scene.laserGroup does not exist!');
      // Try to create it
      this.scene.laserGroup = this.scene.physics.add.group();
    }
    
    // Add to scene arrays
    this.scene.lasers.push(laser);
    this.scene.laserGroup.add(laser);
    
    console.log(`WarpCannon: Added to scene arrays. Total lasers: ${this.scene.lasers.length}`);
    
    // Set up corkscrew motion animation (laser continues until collision)
    laser.startTime = Date.now();
    laser.spiralRadius = 25; // Radius of the corkscrew
    laser.spiralSpeed = 8; // How fast it spirals (rotations per second)
    
    // Store the main direction of travel
    laser.mainDirectionX = Math.cos(angle);
    laser.mainDirectionY = Math.sin(angle);
    
    // Calculate perpendicular vectors for the spiral plane
    // For 2D, we use the perpendicular vector in the plane
    laser.perpX = -laser.mainDirectionY; // Perpendicular X
    laser.perpY = laser.mainDirectionX;  // Perpendicular Y
    
    // Set initial position offset
    laser.centerX = x;
    laser.centerY = y;
    
    this.scene.tweens.add({
      targets: laser,
      rotation: laser.rotation + Math.PI * 16, // Spin the laser sprite itself
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // Color transition tween - from light pink to mid pink
    this.scene.tweens.add({
      targets: laser,
      duration: 2000, // 2 second cycle
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        // Interpolate between light pink (0xffb6c1) and mid pink (0xff69b4)
        const progress = tween.getValue();
        const lightPink = { r: 255, g: 182, b: 193 };
        const midPink = { r: 255, g: 105, b: 180 };
        
        const r = Math.floor(lightPink.r + (midPink.r - lightPink.r) * progress);
        const g = Math.floor(lightPink.g + (midPink.g - lightPink.g) * progress);
        const b = Math.floor(lightPink.b + (midPink.b - lightPink.b) * progress);
        
        const color = (r << 16) | (g << 8) | b;
        laser.setTint(color);
      }
    });
    
    // Store corkscrew motion data for physics update
    laser.spiralTime = 0;
    laser.baseVelocityX = velocityX;
    laser.baseVelocityY = velocityY;
    
    console.log(`WarpCannon: Corkscrew laser setup complete, will spiral around travel direction`);
    
    return laser;
  }
  
  /**
   * Update all warp cannon lasers to apply corkscrew motion
   * This should be called from the scene's update loop
   * @param {number} time - Current game time
   * @param {number} delta - Time delta since last frame
   */
  static updateWarpLasers(scene, time, delta) {
    if (!scene.lasers) return;
    
    scene.lasers.forEach(laser => {
      if (laser.isWarpLaser && laser.active) {
        const elapsedTime = (time - laser.startTime) / 1000; // Convert to seconds
        
        // Calculate the spiral angle based on elapsed time
        const spiralAngle = elapsedTime * laser.spiralSpeed * Math.PI * 2;
        
        // Calculate the center position (where laser would be without spiral)
        const travelDistance = elapsedTime * Math.sqrt(laser.baseVelocityX * laser.baseVelocityX + laser.baseVelocityY * laser.baseVelocityY);
        const centerX = laser.centerX + laser.mainDirectionX * travelDistance;
        const centerY = laser.centerY + laser.mainDirectionY * travelDistance;
        
        // Calculate spiral offset in the perpendicular plane
        const spiralOffsetX = Math.cos(spiralAngle) * laser.spiralRadius * laser.perpX;
        const spiralOffsetY = Math.cos(spiralAngle) * laser.spiralRadius * laser.perpY;
        
        // Apply the corkscrew position
        laser.x = centerX + spiralOffsetX;
        laser.y = centerY + spiralOffsetY;
        
        // Update physics body position to match sprite
        if (laser.body) {
          laser.body.x = laser.x - laser.body.halfWidth;
          laser.body.y = laser.y - laser.body.halfHeight;
        }
      }
    });
  }
}
