export function applyKnockbackMethods(SceneClass) {
  SceneClass.prototype.checkTerrainKnockback = function (terrainX, terrainY, destroyingOrc) {
    // Check all active orcs for knockback
    const allOrcs = [...this.blueOrcs, ...this.redOrcs].filter((orc) => orc.active);
    const knockbackRange = 80; // Distance within which orcs get knocked back

    allOrcs.forEach((targetOrc) => {
      // Don't knockback the orc doing the destroying
      if (targetOrc === destroyingOrc) return;

      const distance = Phaser.Math.Distance.Between(targetOrc.x, targetOrc.y, terrainX, terrainY);

      if (distance <= knockbackRange) {
        console.log(`Knocking back ${targetOrc.team} orc from terrain destruction`);
        this.applyOrcKnockback(targetOrc, terrainX, terrainY, distance);
      }
    });
  };

  SceneClass.prototype.applyOrcKnockback = function (orc, explosionX, explosionY, distance) {
    // Calculate knockback direction (away from explosion)
    const knockbackAngle = Phaser.Math.Angle.Between(explosionX, explosionY, orc.x, orc.y);

    // Calculate knockback force based on distance (closer = stronger knockback)
    const maxKnockback = 150;
    const minKnockback = 60;
    const distanceRatio = 1 - distance / 80; // Closer to 1 means closer to explosion
    const knockbackForce = minKnockback + (maxKnockback - minKnockback) * distanceRatio;

    // Calculate knockback velocity
    const knockbackX = Math.cos(knockbackAngle) * knockbackForce;
    const knockbackY = Math.sin(knockbackAngle) * knockbackForce;

    // Apply immediate velocity
    orc.setVelocity(knockbackX, knockbackY);

    // Add visual effect - brief flash
    orc.setTint(0xffff00); // Yellow flash
    this.tweens.add({
      targets: orc,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        orc.clearTint();
        orc.setAlpha(1);
      },
    });

    // Reset AI state briefly to allow knockback to take effect
    orc.aiState = 'stunned';
    setTimeout(() => {
      if (orc.active) {
        orc.aiState = 'patrol';
      }
    }, 300); // 300ms stun
  };

  SceneClass.prototype.checkRoyalKnockback = function (terrainX, terrainY) {
    // Royal knockback is stronger and has longer range
    const allOrcs = [...this.blueOrcs, ...this.redOrcs].filter((orc) => orc.active);
    const knockbackRange = 120; // Larger range for royal destruction

    allOrcs.forEach((targetOrc) => {
      const distance = Phaser.Math.Distance.Between(targetOrc.x, targetOrc.y, terrainX, terrainY);

      if (distance <= knockbackRange) {
        console.log(`Royal knockback affects ${targetOrc.team} orc`);
        this.applyRoyalKnockback(targetOrc, terrainX, terrainY, distance);
      }
    });
  };

  SceneClass.prototype.applyRoyalKnockback = function (orc, explosionX, explosionY, distance) {
    // Calculate knockback direction (away from explosion)
    const knockbackAngle = Phaser.Math.Angle.Between(explosionX, explosionY, orc.x, orc.y);

    // Royal knockback is stronger than axe knockback
    const maxKnockback = 220;
    const minKnockback = 100;
    const distanceRatio = 1 - distance / 120; // Closer to 1 means closer to explosion
    const knockbackForce = minKnockback + (maxKnockback - minKnockback) * distanceRatio;

    // Calculate knockback velocity
    const knockbackX = Math.cos(knockbackAngle) * knockbackForce;
    const knockbackY = Math.sin(knockbackAngle) * knockbackForce;

    // Apply immediate velocity
    orc.setVelocity(knockbackX, knockbackY);

    // Royal knockback has golden flash effect
    orc.setTint(0xffd700); // Gold flash for royal knockback
    this.tweens.add({
      targets: orc,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        orc.clearTint();
        orc.setAlpha(1);
      },
    });

    // Longer stun for royal knockback
    orc.aiState = 'stunned';
    setTimeout(() => {
      if (orc.active) {
        orc.aiState = 'patrol';
      }
    }, 500); // 500ms stun for royal power
  };
}
