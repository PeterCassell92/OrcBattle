/**
 * @typedef {import('../../orc/index.js').IOrc} IOrc
 * @typedef {import('../index.d.ts').IBattleScene} IBattleScene
 */

export function applyCollisionMethods(SceneClass) {
  /**
   * Laser hits orc collision callback
   * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} laser
   * @param {IOrc} orc
   * @returns
   */
  SceneClass.prototype.laserHitOrc = function (laser, orc) {
    /** @type {IBattleScene} */
    const scene = this;
    if (laser.team === orc.team) return;

    // Debug logging
    // console.log(`Laser hitting ${orc.team} orc - immuneToDamage: ${orc.immuneToDamage}, invulnerableWhileInvisible: ${orc.invulnerableWhileInvisible}, type: ${orc.type}`);

    // Check for berserker immunity (during immunity phase)
    if (orc.immuneToDamage === true) {
      // Show golden deflection effect
      scene.createImmunityDeflectionEffect(laser.x, laser.y);
      console.log(`${orc.team} orc is immune to damage! Deflecting laser.`);

      scene.lasers = scene.lasers.filter((l) => l !== laser);
      laser.destroy();
      return;
    }

    // Check for invisibility invulnerability
    if (orc.invulnerableWhileInvisible === true) {
      // Show special invisibility deflection effect
      scene.createInvisibilityDeflectionEffect(laser.x, laser.y);
      console.log(`${orc.team} berserker is invulnerable while invisible! Deflecting laser.`);

      scene.lasers = scene.lasers.filter((l) => l !== laser);
      laser.destroy();
      return;
    }

    // Check for berserker laser resistance (40% chance to resist)
    if (orc.type === 'berserker' && orc.laserResistance) {
      if (Math.random() < orc.laserResistance) {
        // Berserker resisted the laser
        scene.createBerserkerResistanceEffect(laser.x, laser.y, orc);
        // console.log(`${orc.team} berserker resisted laser attack!`);

        scene.lasers = scene.lasers.filter((l) => l !== laser);
        laser.destroy();
        return;
      }
    }

    // Normal laser deflection chance (20%) for non-berserkers
    if (orc.type !== 'berserker') {
      const laserDeflected = Math.random() < 0.2;

      if (laserDeflected) {
        // Laser deflected/absorbed - no damage but show ripple effect
        scene.createLaserRippleEffect(laser.x, laser.y, orc.team);
        // console.log(`${orc.team} orc deflected laser shot!`);

        scene.lasers = scene.lasers.filter((l) => l !== laser);
        laser.destroy();
        return;
      }
    }

    // Laser hits and causes damage
    // console.log(`${orc.team} orc taking damage - health before: ${orc.health}`);
    orc.health--;
    // console.log(`${orc.team} orc health after damage: ${orc.health}`);

    orc.setTint(0xff0000);
    scene.tweens.add({
      targets: orc,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        orc.clearTint();
        if (orc.health <= 0) {
          // console.log(`${orc.team} orc died - health: ${orc.health}`);
          orc.attemptDie();
        }
      },
    });

    scene.lasers = scene.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  // Collision handlers
  /**
  * Laser hits terrain collision callback
  * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} laser
  * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} terrain
  */
  SceneClass.prototype.laserHitTerrain = function (laser, terrain) {
  /** @type {IBattleScene} */
    const scene = this;

    const spark = scene.add.circle(laser.x, laser.y, 4, 0xffffff);
    scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => spark.destroy(),
    });

    scene.lasers = scene.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  /**
  * Laser hits alcove wall collision callback
  * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} laser
   * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} wall
  */
  SceneClass.prototype.laserHitAlcoveWall = function (laser, wall) {
  /** @type {IBattleScene} */
    const scene = this;

    // console.log(`Laser hit ${wall.alcoveTeam} alcove wall`);

    // Create small laser ripple effect at point of contact
    scene.createLaserRippleEffect(laser.x, laser.y, wall.alcoveTeam);

    // 1/20 chance for the king to speak when alcove wall is hit
    if (Math.random() < 0.05) {
      // 1/20 = 0.05
      // Get the appropriate king
      const king = wall.alcoveTeam === 'blue' ? scene.blueKing : scene.redKing;
      king.tauntOpposingArmy();
    }

    // Remove laser from array and destroy it
    scene.lasers = scene.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  /**
   * King hits terrain collision callback
   * @param {import('../index.d.ts').IKing} king
   * @param {import('../../orc/index.js').TerrainObject} terrain
   */
  SceneClass.prototype.kingHitTerrain = function (king, terrain) {
    /** @type {IBattleScene} */
    const scene = this;
    console.log(`${king.team} king destroys terrain on contact!`);

    // Store terrain position for knockback
    const terrainX = terrain.x;
    const terrainY = terrain.y;

    // Create royal destruction effect
    const royalEffect = scene.add.circle(terrain.x, terrain.y, 25, 0xffd700); // Gold effect
    scene.tweens.add({
      targets: royalEffect,
      alpha: 0,
      scale: 3,
      duration: 500,
      onComplete: () => royalEffect.destroy(),
    });

    // Apply royal knockback (stronger than axe knockback)
    scene.checkRoyalKnockback(terrainX, terrainY);

    // For chunk-based terrain, destroy the entire structure
    if (terrain.terrainType === 'terrain-rock-chunk' && terrain.rockParent) {
      // Destroy entire rock, not just one chunk
      terrain.rockParent.destroy();
    } else if (terrain.terrainType === 'terrain-block-chunk' && terrain.blockParent) {
      // Destroy entire block, not just one chunk
      terrain.blockParent.destroy();
    } else if (terrain.terrainType === 'terrain-tree') {
      // Trees are destroyed completely
      terrain.destroy();
      scene.terrain = scene.terrain.filter((t) => t !== terrain);
      scene.terrainGroup.remove(terrain);
    } else {
      // Legacy terrain
      terrain.destroy();
      scene.terrain = scene.terrain.filter((t) => t !== terrain);
      scene.terrainGroup.remove(terrain);
    }
  };

  /**
  * Setup initial collision handlers
  */
  SceneClass.prototype.setupInitialColliders = function () {
  /** @type {IBattleScene} */
    const scene = this;

    scene.physics.add.collider(scene.laserGroup, scene.terrainGroup, scene.laserHitTerrain, null, scene);
    scene.physics.add.overlap(scene.laserGroup, scene.blueOrcGroup, scene.laserHitOrc, null, scene);
    scene.physics.add.overlap(scene.laserGroup, scene.redOrcGroup, scene.laserHitOrc, null, scene);

    // Laser collision with alcove walls
    scene.physics.add.collider(scene.laserGroup, scene.blueAlcoveWalls, scene.laserHitAlcoveWall, null, scene);
    scene.physics.add.collider(scene.laserGroup, scene.redAlcoveWalls, scene.laserHitAlcoveWall, null, scene);

    // Orc-terrain collisions (these should prevent orcs from moving through terrain)
    scene.physics.add.collider(scene.blueOrcGroup, scene.terrainGroup);
    scene.physics.add.collider(scene.redOrcGroup, scene.terrainGroup);

    scene.physics.add.collider(scene.blueOrcGroup, scene.redOrcGroup);
    scene.physics.add.collider(scene.blueOrcGroup, scene.blueOrcGroup);
    scene.physics.add.collider(scene.redOrcGroup, scene.redOrcGroup);

    // King collision with terrain - kings destroy terrain on contact
    scene.physics.add.overlap(scene.blueKing, scene.terrainGroup, scene.kingHitTerrain, null, scene);
    scene.physics.add.overlap(scene.redKing, scene.terrainGroup, scene.kingHitTerrain, null, scene);
  };
}
