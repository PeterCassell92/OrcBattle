export class Fireball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, color = 0xff4500) {
    // Create a simple circle geometry first, then call super
    super(scene, x, y, null);

    // Store scene reference immediately
    this.scene = scene;
    this.color = color;

    // Create the fireball visual as a circle
    this.setDisplaySize(16, 16);
    this.setTint(color);

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.setDepth(5);
    this.body.setSize(16, 16);
    this.setCircle(8); // Make it circular for physics

    // Create fire trail effect
    this.trail = scene.add.graphics();
    this.trail.setDepth(4);

    // Create a circle texture for the fireball
    this.createFireballTexture();
  }

  createFireballTexture() {
    // Safety check for scene
    if (!this.scene || !this.scene.add) {
      console.error('Cannot create fireball texture - scene is not ready!');
      // Fallback: use a simple colored circle without texture
      this.setDisplaySize(16, 16);
      this.setTint(this.color);
      return;
    }

    try {
      // Create a simple circle graphic for the fireball
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(this.color);
      graphics.fillCircle(8, 8, 8);

      // Add inner glow effect
      graphics.fillStyle(0xffff00, 0.6); // Yellow inner glow
      graphics.fillCircle(8, 8, 4);

      // Generate unique texture name to avoid conflicts
      const textureName = `fireball-texture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate texture and apply it
      graphics.generateTexture(textureName, 16, 16);
      this.setTexture(textureName);

      // Clean up the graphics object
      graphics.destroy();
    } catch (error) {
      console.error('Error creating fireball texture:', error);
      // Fallback: use simple tint
      this.setDisplaySize(16, 16);
      this.setTint(this.color);
    }
  }

  fireAt(targetX, targetY) {
    // Safety check for scene
    if (!this.scene || !this.scene.tweens) {
      console.error('Fireball scene is undefined or invalid!');
      this.destroy();
      return;
    }

    console.log(`Fireball fired toward (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);

    // Calculate flight parameters
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const flightTime = Math.min(2000, distance * 3); // 2 second max flight time

    // Calculate arc height based on distance (higher arc for longer distances)
    const arcHeight = Math.min(100, distance * 0.3); // Max 100 pixels high

    // Store initial position
    const startX = this.x;
    const startY = this.y;

    // Create smooth parabolic arc using onUpdate callback
    this.scene.tweens.add({
      targets: { progress: 0 }, // Dummy target to drive the animation
      progress: 1,
      duration: flightTime,
      ease: 'Power2.out',
      onUpdate: (tween) => {
        const { progress } = tween.targets[0]; // 0 to 1

        // Linear interpolation for X
        const currentX = startX + (targetX - startX) * progress;

        // Parabolic interpolation for Y (creates smooth arc)
        const linearY = startY + (targetY - startY) * progress;
        const arcOffset = -arcHeight * 4 * progress * (1 - progress);
        const currentY = linearY + arcOffset;

        // Update fireball position
        this.setPosition(currentX, currentY);
      },
      onComplete: () => {
        this.impact(targetX, targetY);
      },
    });

    // Add spinning effect during flight
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 4, // Two full rotations
      duration: flightTime,
      ease: 'Linear',
    });

    // Add pulsing glow effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      repeat: Math.floor(flightTime / 400), // Pulse throughout flight
      ease: 'Sine.easeInOut',
    });
  }

  impact(targetX, targetY) {
    // Create fireball impact effect
    this.createFireballImpact(targetX, targetY);

    // Clean up
    this.destroy();
  }

  createFireballImpact(x, y) {
    // Safety check for scene
    if (!this.scene || !this.scene.add || !this.scene.tweens) {
      console.error('Fireball scene is undefined during impact!');
      return;
    }

    // Large fire explosion effect
    const explosion = this.scene.add.circle(x, y, 30, 0xff4500, 0.8);

    this.scene.tweens.add({
      targets: explosion,
      radius: 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2.out',
      onComplete: () => explosion.destroy(),
    });

    // Check for nearby shrubs to burn
    this.burnNearbyShrubs(x, y);

    // Fire particles spreading outward
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 3, 0xff6600);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        duration: 600,
        ease: 'Power2.out',
        onComplete: () => particle.destroy(),
      });
    }

    //console.log(`Fireball impact at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }

  burnNearbyShrubs(impactX, impactY) {
    // Safety check for scene
    if (!this.scene || !this.scene.backgroundDecorations) {
      console.error('Fireball scene or backgroundDecorations is undefined!');
      return;
    }

    // Check for shrubs within burning radius (50 pixels)
    const burnRadius = 75;

    this.scene.backgroundDecorations.forEach((decoration) => {
      if (decoration.decorationType === 'shrub' && !decoration.burnt) {
        const distance = Phaser.Math.Distance.Between(impactX, impactY, decoration.x, decoration.y);

        if (distance <= burnRadius) {
          this.burnShrub(decoration);
        }
      }
    });
  }

  burnShrub(shrub) {
    // Safety check for scene
    if (!this.scene || !this.scene.add || !this.scene.tweens) {
      console.error('Fireball scene is undefined during shrub burning!');
      return;
    }

    console.log(`Shrub at (${shrub.x.toFixed(0)}, ${shrub.y.toFixed(0)}) caught fire!`);

    // Mark as burnt
    shrub.burnt = true;

    // Create burning effect
    const burnEffect = this.scene.add.circle(shrub.x, shrub.y - 5, 8, 0xff4500, 0.8);

    this.scene.tweens.add({
      targets: burnEffect,
      radius: 12,
      alpha: 0,
      duration: 600,
      ease: 'Power2.out',
      onComplete: () => burnEffect.destroy(),
    });

    // Enhanced burning particles - create more particles over a longer duration
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        if (shrub.active) {
          this.createFireParticle(
            shrub.x + (Math.random() - 0.5) * 15, // Wider spread
            shrub.y - 3 + (Math.random() - 0.5) * 10,
          );
        }
      }, i * 150); // Every 150ms for 1.8 seconds total
    }

    // Add some delayed particles for extended burning effect
    for (let i = 0; i < 8; i++) {
      setTimeout(
        () => {
          if (shrub.active && shrub.burnt) {
            this.createFireParticle(
              shrub.x + (Math.random() - 0.5) * 12,
              shrub.y - 2 + (Math.random() - 0.5) * 8,
            );
          }
        },
        2000 + i * 200,
      ); // Start after 2 seconds, every 200ms
    }

    // Change shrub texture to burnt version after short delay
    setTimeout(() => {
      if (shrub.active) {
        shrub.setTexture('shrub-burnt');
        console.log('Shrub burned to ash');
      }
    }, 500);
  }

  createFireParticle(x, y) {
    // Safety check for scene
    if (!this.scene || !this.scene.add || !this.scene.tweens) {
      console.error('Fireball scene is undefined during fire particle creation!');
      return;
    }

    // Create a small fire particle with more variety
    const size = 3 + Math.random() * 4; // 3-7 pixel radius
    const colors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00]; // Orange to yellow gradient
    const color = colors[Math.floor(Math.random() * colors.length)];

    const particle = this.scene.add.circle(x, y, size, color);
    particle.setDepth(10); // Make sure particles appear above other objects
    particle.setAlpha(0.8 + Math.random() * 0.2); // 80-100% alpha

    // Add slight glow effect
    particle.setBlendMode(Phaser.BlendModes.ADD);

    // Animate the particle
    this.scene.tweens.add({
      targets: particle,
      y: y - 20 - Math.random() * 15, // Rise 20-35 pixels
      x: x + (Math.random() - 0.5) * 15, // Drift left/right up to 7.5 pixels
      alpha: 0,
      scale: 0.2,
      duration: 600 + Math.random() * 400, // 600-1000ms lifetime
      ease: 'Power2.out',
      onUpdate: (tween) => {
        // Add subtle flickering effect
        if (Math.random() < 0.1) {
          particle.setAlpha(particle.alpha * 0.7);
        }
      },
      onComplete: () => particle.destroy(),
    });

    // Add slight side-to-side motion for more natural movement
    this.scene.tweens.add({
      targets: particle,
      x: x + (Math.random() - 0.5) * 20,
      duration: 300 + Math.random() * 200,
      ease: 'Sine.easeInOut',
      yoyo: true,
    });
  }

  destroy() {
    // Clean up trail graphics
    if (this.trail) {
      this.trail.destroy();
    }

    // Call parent destroy
    super.destroy();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Update fire trail effect
    if (this.trail && this.active) {
      this.updateTrail();
    }
  }

  updateTrail() {
    // Safety check for scene
    if (!this.scene || !this.scene.add || !this.scene.tweens) {
      return; // Silently fail for trail updates
    }

    // Simple trail effect - add a fading circle at current position
    const trailCircle = this.scene.add.circle(this.x, this.y, 4, this.color);
    trailCircle.setDepth(3);
    trailCircle.setAlpha(0.6);

    // Fade out the trail circle
    this.scene.tweens.add({
      targets: trailCircle,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      ease: 'Power2.out',
      onComplete: () => trailCircle.destroy(),
    });
  }
}
