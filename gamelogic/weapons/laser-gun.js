/**
 * LaserGun Class - Weapon system for Orc combat units
 * Handles all laser firing mechanics in an Object-Oriented fashion
 */
export class LaserGun {
  /**
   * Create a laser weapon
   * @param {Object} config - Weapon configuration object
   * @param {number} [config.fireRate=1000] - Time between shots in milliseconds (lower = faster)
   * @param {string} [config.laserTexture='laser'] - Phaser texture key for laser projectile sprite
   * @param {number} [config.laserSpeed=350] - Velocity of laser projectiles in pixels per second
   * @param {number} [config.laserRange=3000] - Maximum travel time for lasers in milliseconds
   * @param {number} [config.muzzleFlashColor=0xffff00] - Hex color for muzzle flash effect (yellow by default)
   * @param {number} [config.muzzleFlashSize=8] - Radius of muzzle flash circle in pixels
   * @param {number} [config.barrelOffset=20] - Distance from orc center to weapon barrel in pixels
   * @param {string} [config.weaponType='Standard Laser'] - Display name for weapon type (for debugging/UI)
   */
  constructor(config = {}) {
    // Base weapon properties - no owner reference needed
    this.fireRate = config.fireRate || 1000;
    this.baseFireRate = this.fireRate; // Store original fire rate for overclocking
    
    // Laser projectile properties
    this.laserTexture = config.laserTexture || 'laser';
    this.laserSpeed = config.laserSpeed || 350;
    this.baseLaserSpeed = this.laserSpeed; // Store original speed for overclocking
    this.laserRange = config.laserRange || 3000; // Max travel time in ms
    
    // Muzzle flash properties
    this.muzzleFlashColor = config.muzzleFlashColor || 0xffff00;
    this.baseMuzzleFlashColor = this.muzzleFlashColor; // Store original color
    this.muzzleFlashSize = config.muzzleFlashSize || 8;
    
    // Weapon positioning
    this.barrelOffset = config.barrelOffset || 20;
    
    // Weapon type identifier for debugging
    this.weaponType = config.weaponType || 'Standard Laser';
    
    // Overclocking state
    this.isOverclocked = false;
  }
  
  /**
   * Fire a laser projectile
   * @param {IOrc} shooter - The orc firing the weapon
   * @param {number} targetAngle - Optional override for firing angle
   * @returns {Phaser.Physics.Arcade.Sprite|null} The created laser sprite or null if failed
   */
  fire(shooter, targetAngle = null) {
    if (!shooter || !shooter.active || !shooter.scene) return null;
    
    // Calculate firing position
    const firingAngle = targetAngle !== null ? targetAngle : shooter.rotation;
    const spawnX = shooter.x + Math.cos(firingAngle) * this.barrelOffset;
    const spawnY = shooter.y + Math.sin(firingAngle) * this.barrelOffset;
    
    // Apply aim variance from the orc, not the weapon
    const aimVariance = shooter.aimVariance || 0;
    const aimAngle = firingAngle + (Math.random() - 0.5) * aimVariance * 3;
    
    // Create laser projectile
    const laser = this.createLaserProjectile(shooter, spawnX, spawnY, aimAngle);
    
    // Create muzzle flash effect
    this.createMuzzleFlash(shooter.scene, spawnX, spawnY);
    
    return laser;
  }
  
  /**
   * Create the actual laser projectile sprite
   * @param {IOrc} shooter - The orc firing the weapon  
   * @param {number} x - Spawn X coordinate
   * @param {number} y - Spawn Y coordinate
   * @param {number} angle - Firing angle in radians
   * @returns {Phaser.Physics.Arcade.Sprite} The created laser sprite
   */
  createLaserProjectile(shooter, x, y, angle) {
    const laser = shooter.scene.physics.add.sprite(x, y, this.laserTexture);
    laser.setRotation(angle);
    
    // Set laser properties
    laser.shooter = shooter;
    laser.team = shooter.team;
    laser.weapon = this; // Reference back to weapon
    
    // Physics setup
    laser.setCollideWorldBounds(false);
    laser.body.setSize(6, 2);
    
    // Calculate velocity using current (possibly overclocked) speed
    const velocityX = Math.cos(angle) * this.laserSpeed;
    const velocityY = Math.sin(angle) * this.laserSpeed;
    laser.setVelocity(velocityX, velocityY);
    
    // Add to scene arrays
    shooter.scene.lasers.push(laser);
    shooter.scene.laserGroup.add(laser);
    
    // Set up laser lifetime
    shooter.scene.tweens.add({
      targets: laser,
      x: laser.x + velocityX * 3,
      y: laser.y + velocityY * 3,
      duration: this.laserRange,
      ease: 'Linear',
      onComplete: () => {
        if (laser.active) {
          this.destroyLaser(laser, shooter.scene);
        }
      }
    });
    
    return laser;
  }
  
  /**
   * Create muzzle flash effect with appropriate color based on overclock status
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} x - Flash X coordinate  
   * @param {number} y - Flash Y coordinate
   */
  createMuzzleFlash(scene, x, y) {
    const flash = scene.add.circle(x, y, this.muzzleFlashSize, this.muzzleFlashColor);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy()
    });
  }
  
  /**
   * Safely destroy a laser projectile
   * @param {Phaser.Physics.Arcade.Sprite} laser - The laser to destroy
   * @param {Phaser.Scene} scene - The game scene
   */
  destroyLaser(laser, scene) {
    if (!laser || !laser.active) return;
    
    // Remove from scene arrays
    scene.lasers = scene.lasers.filter(l => l !== laser);
    if (scene.laserGroup) {
      scene.laserGroup.remove(laser);
    }
    
    // Destroy the sprite
    laser.destroy();
  }
  
  /**
   * Overclock the weapon by reducing fire rate and optionally modifying projectile speed
   * @param {number} fireRateReduction - Amount to subtract from fire rate (e.g., 450 = 450ms faster)
   * @param {number} [minimumFireRate=100] - Minimum allowed fire rate in milliseconds
   * @param {number} [speedMultiplier=1.0] - Optional multiplier for laser projectile speed (e.g., 1.5 = 50% faster projectiles)
   */
  overclock(fireRateReduction, minimumFireRate = 100, speedMultiplier = 1.0) {
    const newFireRate = Math.max(minimumFireRate, this.fireRate - fireRateReduction);
    const actualReduction = this.fireRate - newFireRate;
    
    this.fireRate = newFireRate;
    this.isOverclocked = true;
    
    // Apply speed multiplier if provided
    if (speedMultiplier !== 1.0) {
      this.laserSpeed = this.baseLaserSpeed * speedMultiplier;
      console.log(`Weapon overclocked! Fire rate reduced by ${actualReduction}ms, projectile speed increased by ${((speedMultiplier - 1) * 100).toFixed(1)}%`);
    } else {
      console.log(`Weapon overclocked! Fire rate reduced by ${actualReduction}ms (${this.baseFireRate}ms -> ${this.fireRate}ms)`);
    }
    
    // Change muzzle flash to green when overclocked
    this.muzzleFlashColor = 0x00ff00; // Bright green
  }
  
  /**
   * Reset weapon to base fire rate and speed
   */
  resetOverclock() {
    this.fireRate = this.baseFireRate;
    this.laserSpeed = this.baseLaserSpeed;
    this.muzzleFlashColor = this.baseMuzzleFlashColor;
    this.isOverclocked = false;
    console.log(`Weapon overclock reset to base stats: ${this.fireRate}ms fire rate, ${this.laserSpeed} speed`);
  }
  
  /**
   * Get weapon info for debugging/UI
   * @returns {Object} Weapon statistics and status
   */
  getWeaponInfo() {
    return {
      type: this.weaponType,
      fireRate: Math.round(this.fireRate),
      baseFireRate: Math.round(this.baseFireRate),
      speed: Math.round(this.laserSpeed),
      baseSpeed: Math.round(this.baseLaserSpeed),
      isOverclocked: this.isOverclocked,
      muzzleFlashColor: `0x${this.muzzleFlashColor.toString(16).padStart(6, '0').toUpperCase()}`
    };
  }
  
  /**
   * Create a standard laser weapon for regular orcs and rushers
   * @returns {LaserGun} Configured standard laser weapon
   */
  static createStandardLaser() {
    return new LaserGun({
      fireRate: 800 + Math.random() * 400,
      laserTexture: 'laser',
      laserSpeed: 350, // 70 * 5.0
      muzzleFlashColor: 0xffff00, // Yellow
      weaponType: 'Standard Laser'
    });
  }
  
  /**
   * Create a heavy laser weapon for cover firers  
   * @returns {LaserGun} Configured heavy laser weapon
   */
  static createHeavyLaser() {
    return new LaserGun({
      fireRate: (800 + Math.random() * 400) * 0.9, // 10% faster base rate
      laserTexture: 'cover-laser',
      laserSpeed: 350 * 2.3, // Much faster projectiles
      muzzleFlashColor: 0xffff80, // Light yellow
      weaponType: 'Heavy Laser'
    });
  }
}
