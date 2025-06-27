/**
 * @typedef {import('../../orc/index.js').IOrc} IOrc
 */

export function applyCollisionMethods(SceneClass) {
  /**
     *
     * @param {*} laser
     * @param {IOrc} orc
     * @returns
     */
  SceneClass.prototype.laserHitOrc = function (laser, orc) {
    if (laser.team === orc.team) return;

    // Debug logging
    // console.log(`Laser hitting ${orc.team} orc - immuneToDamage: ${orc.immuneToDamage}, invulnerableWhileInvisible: ${orc.invulnerableWhileInvisible}, type: ${orc.type}`);

    // Check for berserker immunity (during immunity phase)
    if (orc.immuneToDamage === true) {
      // Show golden deflection effect
      this.createImmunityDeflectionEffect(laser.x, laser.y);
      console.log(`${orc.team} orc is immune to damage! Deflecting laser.`);

      this.lasers = this.lasers.filter((l) => l !== laser);
      laser.destroy();
      return;
    }

    // Check for invisibility invulnerability
    if (orc.invulnerableWhileInvisible === true) {
      // Show special invisibility deflection effect
      this.createInvisibilityDeflectionEffect(laser.x, laser.y);
      console.log(`${orc.team} berserker is invulnerable while invisible! Deflecting laser.`);

      this.lasers = this.lasers.filter((l) => l !== laser);
      laser.destroy();
      return;
    }

    // Check for berserker laser resistance (40% chance to resist)
    if (orc.type === 'berserker' && orc.laserResistance) {
      if (Math.random() < orc.laserResistance) {
        // Berserker resisted the laser
        this.createBerserkerResistanceEffect(laser.x, laser.y, orc);
        // console.log(`${orc.team} berserker resisted laser attack!`);

        this.lasers = this.lasers.filter((l) => l !== laser);
        laser.destroy();
        return;
      }
    }

    // Normal laser deflection chance (20%) for non-berserkers
    if (orc.type !== 'berserker') {
      const laserDeflected = Math.random() < 0.2;

      if (laserDeflected) {
        // Laser deflected/absorbed - no damage but show ripple effect
        this.createLaserRippleEffect(laser.x, laser.y, orc.team);
        // console.log(`${orc.team} orc deflected laser shot!`);

        this.lasers = this.lasers.filter((l) => l !== laser);
        laser.destroy();
        return;
      }
    }

    // Laser hits and causes damage
    // console.log(`${orc.team} orc taking damage - health before: ${orc.health}`);
    orc.health--;
    // console.log(`${orc.team} orc health after damage: ${orc.health}`);

    orc.setTint(0xff0000);
    this.tweens.add({
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

    this.lasers = this.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  // Collision handlers
  SceneClass.prototype.laserHitTerrain = function (laser, terrain) {
    const spark = this.add.circle(laser.x, laser.y, 4, 0xffffff);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => spark.destroy(),
    });

    this.lasers = this.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  SceneClass.prototype.laserHitAlcoveWall = function (laser, wall) {
    // console.log(`Laser hit ${wall.alcoveTeam} alcove wall`);

    // Create small laser ripple effect at point of contact
    this.createLaserRippleEffect(laser.x, laser.y, wall.alcoveTeam);

    // 1/20 chance for the king to speak when alcove wall is hit
    if (Math.random() < 0.05) {
      // 1/20 = 0.05
      // Get the appropriate king
      const king = wall.alcoveTeam === 'blue' ? this.blueKing : this.redKing;
      king.tauntOpposingArmy();
    }

    // Remove laser from array and destroy it
    this.lasers = this.lasers.filter((l) => l !== laser);
    laser.destroy();
  };

  SceneClass.prototype.kingHitTerrain = function (king, terrain) {
    console.log(`${king.team} king destroys terrain on contact!`);

    // Store terrain position for knockback
    const terrainX = terrain.x;
    const terrainY = terrain.y;

    // Create royal destruction effect
    const royalEffect = this.add.circle(terrain.x, terrain.y, 25, 0xffd700); // Gold effect
    this.tweens.add({
      targets: royalEffect,
      alpha: 0,
      scale: 3,
      duration: 500,
      onComplete: () => royalEffect.destroy(),
    });

    // Apply royal knockback (stronger than axe knockback)
    this.checkRoyalKnockback(terrainX, terrainY);

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
      this.terrain = this.terrain.filter((t) => t !== terrain);
      this.terrainGroup.remove(terrain);
    } else {
      // Legacy terrain
      terrain.destroy();
      this.terrain = this.terrain.filter((t) => t !== terrain);
      this.terrainGroup.remove(terrain);
    }
  };

  SceneClass.prototype.setupInitialColliders = function () {
    this.physics.add.collider(this.laserGroup, this.terrainGroup, this.laserHitTerrain, null, this);
    this.physics.add.overlap(this.laserGroup, this.blueOrcGroup, this.laserHitOrc, null, this);
    this.physics.add.overlap(this.laserGroup, this.redOrcGroup, this.laserHitOrc, null, this);

    // Laser collision with alcove walls
    this.physics.add.collider(this.laserGroup, this.blueAlcoveWalls, this.laserHitAlcoveWall, null, this);
    this.physics.add.collider(this.laserGroup, this.redAlcoveWalls, this.laserHitAlcoveWall, null, this);

    // Orc-terrain collisions (these should prevent orcs from moving through terrain)
    this.physics.add.collider(this.blueOrcGroup, this.terrainGroup);
    this.physics.add.collider(this.redOrcGroup, this.terrainGroup);

    this.physics.add.collider(this.blueOrcGroup, this.redOrcGroup);
    this.physics.add.collider(this.blueOrcGroup, this.blueOrcGroup);
    this.physics.add.collider(this.redOrcGroup, this.redOrcGroup);

    // King collision with terrain - kings destroy terrain on contact
    this.physics.add.overlap(this.blueKing, this.terrainGroup, this.kingHitTerrain, null, this);
    this.physics.add.overlap(this.redKing, this.terrainGroup, this.kingHitTerrain, null, this);
  };
}
