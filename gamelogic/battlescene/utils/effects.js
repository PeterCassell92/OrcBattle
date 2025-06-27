export function applyEffectMethods(SceneClass) {
  /**
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     */
  SceneClass.prototype.createImmunityEffect = function (sprite) {
    // Golden shield effect
    sprite.immunityEffect = this.add.circle(sprite.x, sprite.y, 25, 0xffd700, 0.3);
    sprite.immunityEffect.setStrokeStyle(2, 0xffd700);

    // Pulsing animation
    this.tweens.add({
      targets: sprite.immunityEffect,
      scale: 1.2,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  };

  /**
     *
     * @param {Phaser.Physics.Arcade.Sprite|Array<Phaser.Physics.Arcade.Sprite>} sprites
     */
  SceneClass.prototype.removeImmunityEffect = function (sprites) {
    if (!(sprites instanceof Array)) {
      sprites = [sprites];
    }

    const immunitySprites = sprites.filter((s) => s?.immunityEffect).map((s) => s.immunityEffect);

    this.tweens.killTweensOf(immunitySprites);
    immunitySprites.forEach((immunityEffect) => {
      immunityEffect.destroy();
      immunityEffect = null;
    });
  };

  /**
     *
     * @param {Phaser.Physics.Arcade.Sprite|Array<Phaser.Physics.Arcade.Sprite>} sprites
     */
  SceneClass.prototype.createInvisibilityEffect = function (sprites) {
    if (!(sprites instanceof Array)) {
      sprites = [sprites];
    }
    // Shimmering transparency effect
    this.tweens.add({
      targets: sprites,
      alpha: 0.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  };

  /**
     *
     * @param {Phaser.Physics.Arcade.Sprite|Array<Phaser.Physics.Arcade.Sprite>} sprites
     */
  SceneClass.prototype.removeInvisibilityEffect = function (sprites) {
    if (!(sprites instanceof Array)) {
      sprites = [sprites];
    }

    this.tweens.killTweensOf(sprites);

    sprites.forEach((sprite) => {
      // Always restore full alpha regardless of type
      // (since this might be called during type transition)
      sprite.setAlpha(1.0);
      // Clear any tints that might be lingering
      sprite.clearTint();
    });
  };

  SceneClass.prototype.syncEffectPositions = function (sprite) {
    // Sync immunity effect
    if (sprite.immunityEffect) {
      sprite.immunityEffect.x = sprite.x;
      sprite.immunityEffect.y = sprite.y;
    }
  };

  SceneClass.prototype.createImmunityDeflectionEffect = function (x, y) {
    // Golden shield deflection effect
    const shield = this.add.circle(x, y, 8, 0xffd700, 0.8);
    shield.setStrokeStyle(3, 0xffd700);

    this.tweens.add({
      targets: shield,
      scale: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2.out',
      onComplete: () => shield.destroy(),
    });

    // Add sparkle effects
    for (let i = 0; i < 5; i++) {
      const sparkle = this.add.circle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        2,
        0xffd700,
      );

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 30,
        alpha: 0,
        duration: 600 + Math.random() * 200,
        ease: 'Power1.out',
        onComplete: () => sparkle.destroy(),
      });
    }
  };

  SceneClass.prototype.createFireParticle = function (x, y) {
    const colors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const particle = this.add.circle(x, y, 2 + Math.random() * 2, color, 0.8);

    this.tweens.add({
      targets: particle,
      y: y - 20 - Math.random() * 20,
      x: x + (Math.random() - 0.5) * 10,
      alpha: 0,
      scale: 0,
      duration: 500 + Math.random() * 300,
      ease: 'Power1.out',
      onComplete: () => particle.destroy(),
    });
  };

  SceneClass.prototype.createLaserRippleEffect = function (x, y, alcoveTeam) {
    // Create small ripple effect with team color accent
    const teamColor = alcoveTeam === 'blue' ? 0x3498db : 0xe74c3c;

    // Main ripple (white center)
    const ripple1 = this.add.circle(x, y, 2, 0xffffff);
    ripple1.setAlpha(0.9);

    // Secondary ripple (team colored)
    const ripple2 = this.add.circle(x, y, 1, teamColor);
    ripple2.setAlpha(0.7);

    // Animate both ripples
    this.tweens.add({
      targets: ripple1,
      radius: 8,
      alpha: 0,
      duration: 300,
      ease: 'Power2.out',
      onComplete: () => ripple1.destroy(),
    });

    this.tweens.add({
      targets: ripple2,
      radius: 12,
      alpha: 0,
      duration: 400,
      ease: 'Power2.out',
      delay: 50, // Slight delay for layered effect
      onComplete: () => ripple2.destroy(),
    });

    // Add small sparks for extra detail
    for (let i = 0; i < 3; i++) {
      const spark = this.add.circle(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, 1, 0xffffff);

      this.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        duration: 150 + Math.random() * 100,
        delay: Math.random() * 100,
        onComplete: () => spark.destroy(),
      });
    }
  };

  SceneClass.prototype.createInvisibilityDeflectionEffect = function (x, y) {
    // Shadow-like deflection effect
    const shadow = this.add.circle(x, y, 6, 0x404040, 0.7); // Dark gray
    shadow.setStrokeStyle(2, 0x000000); // Black stroke

    this.tweens.add({
      targets: shadow,
      scale: 2.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2.out',
      onComplete: () => shadow.destroy(),
    });

    // Add shadowy wisps
    for (let i = 0; i < 4; i++) {
      const wisp = this.add.circle(
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 16,
        1.5,
        0x202020, // Very dark gray
      );

      this.tweens.add({
        targets: wisp,
        y: wisp.y - 20 - Math.random() * 15,
        x: wisp.x + (Math.random() - 0.5) * 20,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power1.out',
        onComplete: () => wisp.destroy(),
      });
    }
  };

  SceneClass.prototype.createBerserkerResistanceEffect = function (x, y, orc) {
    // Create resistance effect with alpha and color based on berserker's current resistance level
    const baseAlpha = orc.getBerserkerDeflectionAlpha(); // Get alpha based on resistance
    const resistanceRatio = orc.laserResistance / orc.maxLaserResistance;

    // Color interpolation from gold (high resistance) to black (low resistance)
    const effectColor = orc.getBerserkerDeflectionColor(resistanceRatio);
    orc.handleBerserkerDeflection();

    // Main deflection burst
    const burst = this.add.circle(x, y, 8, effectColor, baseAlpha);
    burst.setStrokeStyle(2, 0xffffff, baseAlpha * 0.8); // White stroke for visibility

    this.tweens.add({
      targets: burst,
      radius: 20,
      alpha: 0,
      duration: 400,
      ease: 'Power2.out',
      onComplete: () => burst.destroy(),
    });

    // Secondary ring effect
    const ring = this.add.circle(x, y, 12, effectColor, baseAlpha * 0.6);
    ring.setStrokeStyle(3, effectColor, baseAlpha * 0.8);
    ring.isFilled = false;

    this.tweens.add({
      targets: ring,
      radius: 25,
      alpha: 0,
      duration: 500,
      ease: 'Power2.out',
      delay: 100,
      onComplete: () => ring.destroy(),
    });

    // Resistance sparks with dynamic color and alpha
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sparkDistance = 15 + Math.random() * 10;
      const sparkX = x + Math.cos(angle) * sparkDistance;
      const sparkY = y + Math.sin(angle) * sparkDistance;

      const spark = this.add.circle(sparkX, sparkY, 2, effectColor, baseAlpha);

      this.tweens.add({
        targets: spark,
        x: sparkX + Math.cos(angle) * 20,
        y: sparkY + Math.sin(angle) * 20,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power2.out',
        onComplete: () => spark.destroy(),
      });
    }
  };
}
