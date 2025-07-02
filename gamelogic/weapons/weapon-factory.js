import { LaserGun } from './laser-gun.js';
import { WarpCannon } from './warp-cannon.js';

/**
 * Weapon factory functions
 */
export class WeaponFactory {
  /**
   * Create a standard laser weapon for regular orcs and rushers
   * @param {Phaser.Scene} scene - The game scene
   * @returns {LaserGun} Configured standard laser weapon
   */
  static createStandardLaser(scene) {
    return LaserGun.createStandardLaser(scene);
  }
  
  /**
   * Create a heavy laser weapon for cover firers  
   * @param {Phaser.Scene} scene - The game scene
   * @returns {LaserGun} Configured heavy laser weapon
   */
  static createHeavyLaser(scene) {
    return LaserGun.createHeavyLaser(scene);
  }
  
  /**
   * Create a warp cannon weapon that fires spiraling projectiles
   * @param {Phaser.Scene} scene - The game scene
   * @returns {WarpCannon} Configured warp cannon weapon  
   */
  static createWarperLaser(scene) {
    return new WarpCannon(scene);
  }
}
