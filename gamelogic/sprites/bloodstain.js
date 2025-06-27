// Bloodstain class for dynamic blood decay system

export class Bloodstain extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Call super constructor with the blood-stain texture
    super(scene, x, y, 'blood-stain');

    // Add to scene and enable physics
    scene.add.existing(this);
    // Uncomment if you need physics: scene.physics.add.existing(this);

    // Set depth behind everything except grass
    this.setDepth(-2); // Behind grass (-1), shrubs (-0.5), and all units

    // Add some variation to blood stains
    this.setScale(0.8 + Math.random() * 0.4); // Size variation
    this.setRotation(Math.random() * Math.PI * 2); // Random rotation
    this.setAlpha(0.8 + Math.random() * 0.2); // Slight alpha variation

    // Mark as blood stain for identification
    this.stainType = 'blood';
    this.persistent = true; // Mark as persistent
    this.stage = 'fresh'; // Track blood decay stage
    this.creationTime = Date.now(); // Track when created

    // Store scene reference for tweens
    this.gameScene = scene;

    // Determine blood decay type (3/5 chance normal decay, 1/5 chance fast decay, 1/5 chance no decay)
    const decayRoll = Math.random();
    if (decayRoll < 0.6) {
      // 3 in 5 chance: Normal decay (fresh -> faint -> dried)
      this.decayType = 'normal';
      this.scheduleBloodDecay('normal');
    } else if (decayRoll < 0.8) {
      // 1 in 5 chance: Fast decay (fresh -> dried, skipping faint stage)
      this.decayType = 'fast';
      this.scheduleBloodDecay('fast');
    } else {
      // 1 in 5 chance: No natural decay (stays fresh until victory cleansing)
      this.decayType = 'persistent';
    }
  }

  scheduleBloodDecay(decayType) {
    // Schedule natural blood decay based on type
    if (decayType === 'normal') {
      // Normal decay: Stage 1 after 5s, Stage 2 after 8s total (3s more)
      setTimeout(() => {
        if (this && this.active && !this.gameScene.gameOver) {
          this.transitionToStage1('natural');
        }
      }, 5000); // 5 seconds

      setTimeout(() => {
        if (this && this.active && !this.gameScene.gameOver) {
          this.transitionToStage2('natural');
        }
      }, 8000); // 8 seconds total (5s + 3s)
    } else if (decayType === 'fast') {
      // Fast decay: Skip to Stage 2 after 4s
      setTimeout(() => {
        if (this && this.active && !this.gameScene.gameOver) {
          this.transitionToStage2('natural');
        }
      }, 4000); // 4 seconds
    }
    // Persistent type has no scheduled decay
  }

  transitionToStage1(transitionType) {
    // Transition blood to faint red stage
    if (!this || !this.active || this.stage !== 'fresh') {
      return; // Skip if bloodstain is gone or already transitioned
    }

    this.stage = 'faint';
    const isRoyalCleansing = transitionType === 'royal';
    const duration = isRoyalCleansing ? 800 : 1500; // Faster during royal cleansing

    //console.log(`Blood transitioning to faint stage (${transitionType} decay)`);

    this.gameScene.tweens.add({
      targets: this,
      alpha: 0.3, // Fade to 30% opacity
      tint: 0x8b0000, // Darker red tint
      scale: this.scaleX * 0.8, // Slightly shrink
      duration,
      ease: 'Power2.out',
      onComplete: () => {
        if (isRoyalCleansing) {
          // During royal cleansing, immediately proceed to stage 2
          this.transitionToStage2('royal');
        }
      },
    });
  }

  transitionToStage2(transitionType) {
    // Transition blood to dried brown stage (final stage)
    if (!this || !this.active) {
      return; // Skip if bloodstain is gone
    }

    this.stage = 'dried';
    const isRoyalCleansing = transitionType === 'royal';
    const duration = isRoyalCleansing ? 600 : 1000; // Faster during royal cleansing

    //console.log(`Blood transitioning to dried stage (${transitionType} decay)`);

    this.gameScene.tweens.add({
      targets: this,
      alpha: 0.5, // 50% opacity for dried blood
      tint: 0x8b4513, // Brown tint (dried blood color)
      scale: this.scaleX * 0.9, // Slightly more shrinkage
      duration,
      ease: 'Power2.in',
      onComplete: () => {
        if (isRoyalCleansing) {
          // During royal cleansing, fade out completely after reaching dried stage
          this.fadeOut();
        }
      },
    });
  }

  fadeOut() {
    // Final fade-out during royal cleansing
    if (!this || !this.active) {
      return;
    }

    //console.log('Blood stain fading out completely during royal cleansing');

    this.gameScene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 500,
      ease: 'Power2.in',
      onComplete: () => {
        if (this && this.active) {
          this.destroy();
        }
      },
    });
  }
}
