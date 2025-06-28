/**
 * @description VICTORY PHASE - Victory ceremony and king sacrifice logic
 * @typedef {import('../index.d.ts').IBattleScene} IBattleScene
 * @param {*} SceneClass
 */
export function applyVictoryPhaseMethods(SceneClass) {
  SceneClass.prototype.checkWinCondition = function () {
    /** @type {IBattleScene} */
    const scene = this;

    const blueAlive = scene.blueOrcs.filter((orc) => orc.active).length;
    const redAlive = scene.redOrcs.filter((orc) => orc.active).length;

    if ((blueAlive === 0 || redAlive === 0) && !scene.gameOver) {
      scene.gameOver = true;
      scene.gameEndTime = Date.now();

      if (blueAlive === 0) {
        scene.winner = 'red';
        scene.sacrificeKing('blue');
        scene.startVictoryCeremony('red');
      } else {
        scene.winner = 'blue';
        scene.sacrificeKing('red');
        scene.startVictoryCeremony('blue');
      }
    }
  };

  SceneClass.prototype.sacrificeKing = function (team) {
    /** @type {IBattleScene} */
    const scene = this;

    const king = team === 'blue' ? scene.blueKing : scene.redKing;

    // Sacrifice animation for both body and head
    const targets = [king];
    if (king.head) {
      targets.push(king.head);
    }

    scene.tweens.add({
      targets,
      alpha: 0,
      scale: 0,
      rotation: Math.PI * 2,
      duration: 1000,
      ease: 'Power2.inOut',
    });

    // Mark king as dead
    king.alive = false;
  };

  SceneClass.prototype.startVictoryCeremony = function (winningTeam) {
    /** @type {IBattleScene} */
    const scene = this;

    const winningKing = winningTeam === 'blue' ? scene.blueKing : scene.redKing;
    const winningFlag = winningTeam === 'blue' ? scene.blueFlag : scene.redFlag;
    const winningNumberText = winningTeam === 'blue' ? scene.blueNumberText : scene.redNumberText;
    const winningOrcs = winningTeam === 'blue'
      ? scene.blueOrcs.filter((orc) => orc.active)
      : scene.redOrcs.filter((orc) => orc.active);

    // Start burning the losing team's flag
    const losingTeam = winningTeam === 'blue' ? 'red' : 'blue';
    scene.burnLosingFlag(losingTeam);

    // Begin royal cleansing of the battlefield - fade bloodstains during ceremony
    scene.cleanseBloodstainsDuringVictory();

    scene.marchingKing = winningKing;
    scene.celebratingOrcs = winningOrcs;
    scene.victoryPhase = 'king_marching'; // Track ceremony phase

    // Show victory message
    const winnerText = `${
      winningTeam === 'blue' ? 'Blue' : 'Red'
    } Kingdom Conquers!`;
    const color = winningTeam === 'blue' ? '#3498db' : '#e74c3c';

    const gameOverText = scene.add
      .text(400, 100, winnerText, {
        fontSize: '36px',
        fill: color,
        fontWeight: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    scene.tweens.add({
      targets: gameOverText,
      scale: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Trigger mobile button expansion after victory (2 second delay)
    if (window.triggerVictoryButtonExpansion) {
      window.triggerVictoryButtonExpansion();
    }

    // Majestic march to center
    scene.tweens.add({
      targets: winningKing,
      x: 400,
      y: 300,
      duration: 3000,
      ease: 'Power2.inOut',
      onStart: () => {
        // Set king to victory march mode
        winningKing.victoryMarching = true;

        // Calculate initial direction toward center
        const angleToCenter = Phaser.Math.Angle.Between(
          winningKing.x,
          winningKing.y,
          400,
          300,
        );
        winningKing.bodyRotation = angleToCenter;
        winningKing.setRotation(angleToCenter);

        // Initialize head movement for victory march
        winningKing.updateMarchingHeadMovement(Date.now(), angleToCenter);

        console.log(`${winningKing.team} king begins victory march to center!`);
      },
      onUpdate: (tween) => {
        // Update king's facing direction during march
        const { progress } = tween;
        const currentX = winningKing.x;
        const currentY = winningKing.y;

        // Calculate direction to remaining target
        const remainingTargetX = 400;
        const remainingTargetY = 300;
        const angleToTarget = Phaser.Math.Angle.Between(
          currentX,
          currentY,
          remainingTargetX,
          remainingTargetY,
        );

        // Update body rotation to face movement direction
        winningKing.bodyRotation = angleToTarget;
        winningKing.setRotation(angleToTarget);

        // Update head with side-to-side motion facing same direction
        winningKing.updateMarchingHeadMovement(Date.now(), angleToTarget);

        // Ensure head follows during animation
        winningKing.syncSprites();
      },
      onComplete: () => {
        // King has reached center - end victory march mode
        winningKing.victoryMarching = false;

        // Face forward (default direction) at center
        const defaultRotation = winningKing.team === 'blue' ? 0 : Math.PI;
        winningKing.bodyRotation = defaultRotation;
        winningKing.headRotation = defaultRotation;
        winningKing.setRotation(defaultRotation);
        winningKing.syncSprites();

        console.log(
          `${winningKing.team} king has reached the center and claims victory!`,
        );

        // King has reached center - start orc celebration
        scene.startOrcCelebration(winningTeam);

        // Plant flag in center
        scene.tweens.add({
          targets: winningFlag,
          x: 400,
          y: 340,
          duration: 1000,
          ease: 'Power2.inOut',
        });

        scene.tweens.add({
          targets: winningNumberText,
          x: 400,
          y: 332,
          duration: 1000,
          ease: 'Power2.inOut',
        });
      },
    });
  };

  SceneClass.prototype.updateVictoryCeremony = function (time, delta) {
    /** @type {IBattleScene} */
    const scene = this;

    // Handle the king's march to center during victory
    if (scene.winner && scene.marchingKing && scene.marchingKing.victoryMarching) {
      // Victory march head movement is handled in the tween onUpdate callback
      // This method can be used for additional victory ceremony logic if needed
    }
  };

  SceneClass.prototype.startOrcCelebration = function (winningTeam) {
    /** @type {IBattleScene} */
    const scene = this;

    scene.victoryPhase = 'orc_celebrating';

    // Get team number for final message
    const teamNumber = winningTeam === 'blue'
      ? scene.blueNumberText.text
      : scene.redNumberText.text;

    // Filter out any null, inactive, or destroyed orcs before starting celebration
    const validCelebratingOrcs = scene.celebratingOrcs.filter(
      (orc) => orc && orc.active && orc.body,
    );

    if (validCelebratingOrcs.length === 0) {
      console.log('No valid orcs available for victory celebration');
      return;
    }

    console.log(
      `Starting victory celebration with ${validCelebratingOrcs.length} valid orcs`,
    );

    // Update the celebrating orcs list to only include valid ones
    scene.celebratingOrcs = validCelebratingOrcs;

    // Limit the number of orcs that speak based on survivors
    const maxSpeakingOrcs = Math.min(scene.celebratingOrcs.length, 3); // Max 3 orcs speak
    const speakingOrcs = scene.celebratingOrcs.slice(0, maxSpeakingOrcs); // Take first N orcs

    // Arrange orcs in two vertical lines flanking the king
    scene.celebratingOrcs.forEach((orc, index) => {
      // Determine which line this orc goes to (left or right of king)
      const isLeftLine = index % 2 === 0;
      const linePosition = Math.floor(index / 2); // Position within the line (0, 1, 2...)

      // Calculate position in formation
      const kingX = 400; // King is at center
      const kingY = 300;
      const lineSpacing = 100; // Distance from king to each line
      const orcSpacing = 60; // Vertical spacing between orcs in line
      const startY = kingY - (scene.celebratingOrcs.length / 2) * (orcSpacing / 2); // Center the line vertically

      let targetX;
      let targetY;

      if (isLeftLine) {
        // Left line (west of king)
        targetX = kingX - lineSpacing;
        targetY = startY + linePosition * orcSpacing;
      } else {
        // Right line (east of king)
        targetX = kingX + lineSpacing;
        targetY = startY + (linePosition - 0.5) * orcSpacing; // Slight offset for visual variety
      }

      // Ensure orcs don't go off-screen
      targetY = Math.max(100, Math.min(500, targetY));

      // Move orc to formation position
      scene.tweens.add({
        targets: orc,
        x: targetX,
        y: targetY,
        duration: 2000 + Math.random() * 500, // Slight variation in arrival time
        ease: 'Power2.inOut',
        onComplete: () => {
          // Check if orc still exists and is active before performing actions
          if (!orc || !orc.active || !orc.body) {
            console.log('Skipping victory formation - orc no longer exists');
            return;
          }

          // Face the king after reaching position
          const angleToKing = Phaser.Math.Angle.Between(
            orc.x,
            orc.y,
            kingX,
            kingY,
          );
          orc.setRotation(angleToKing);
          orc.bodyRotation = angleToKing;
          if (orc.head && orc.head.active) {
            orc.headRotation = angleToKing;
            orc.head.setRotation(angleToKing);
          }

          // Stop all movement - orcs are now in formation
          if (orc.body) {
            orc.setVelocity(0, 0);
          }

          // Only start speech for selected orcs
          if (speakingOrcs.includes(orc)) {
            const speakingIndex = speakingOrcs.indexOf(orc);
            scene.startOrcSpeech(orc, teamNumber, speakingIndex);
          }
        },
      });
    });
  };

  SceneClass.prototype.startOrcSpeech = function (orc, teamNumber, orcIndex) {
    // Prevent orcs from speaking multiple times
    if (orc.hasSpokenInVictory) {
      console.log(`${orc.team} orc already spoke in victory - skipping`);
      return;
    }

    // Check if orc still exists before marking as spoken
    if (!orc || !orc.active) {
      console.log('Cannot start speech - orc no longer exists');
      return;
    }

    // Mark this orc as having spoken
    orc.hasSpokenInVictory = true;

    // Stagger the speech so orcs don't all talk at once
    const delay = orcIndex * 500;

    setTimeout(() => {
      // Only speak if orc is still active/alive
      if (!orc || !orc.active || !orc.dialog) {
        console.log('Skipping speech for dead/inactive orc');
        return;
      }

      // First message: "Long live the King"
      orc.dialog.addMessage('Long live the King!');

      // Second message: "${number} is victorious" (after 3.5 seconds)
      setTimeout(() => {
        // Check again if orc is still alive before second message
        if (!orc || !orc.active || !orc.dialog) {
          console.log('Skipping second speech for dead/inactive orc');
          return;
        }
        orc.dialog.addMessage(`${teamNumber} is victorious!`);
      }, 3500);
    }, delay);
  };

  SceneClass.prototype.burnLosingFlag = function (losingTeam) {
    /** @type {IBattleScene} */
    const scene = this;

    const losingFlag = losingTeam === 'blue' ? scene.blueFlag : scene.redFlag;
    const losingNumberText = losingTeam === 'blue' ? scene.blueNumberText : scene.redNumberText;

    // Start with the flag catching fire
    console.log(`${losingTeam} flag begins to burn!`);

    // Create fire particles around the flag
    scene.createFireAnimation(losingFlag, losingNumberText);

    // Make the flag start turning black/charred over time
    scene.tweens.add({
      targets: losingFlag,
      tint: 0x222222, // Dark gray/black for charred look
      duration: 3000,
      ease: 'Power2.in',
    });

    // Fade out the team number text as it burns
    scene.tweens.add({
      targets: losingNumberText,
      alpha: 0,
      duration: 2000,
      delay: 1000, // Start fading after 1 second
      ease: 'Power2.in',
    });

    // Eventually make the flag partially disappear (burn away)
    scene.tweens.add({
      targets: losingFlag,
      scaleY: 0.3, // Flag burns down from top
      alpha: 0.7,
      duration: 4000,
      delay: 2000, // Start burning away after 2 seconds
      ease: 'Power2.in',
    });
  };

  SceneClass.prototype.createFireAnimation = function (flag, numberText) {
    const fireParticles = [];
    const fireColors = [0xff4500, 0xff6347, 0xffd700, 0xff8c00]; // Orange, red-orange, gold, dark orange

    // Create continuous fire effect
    const createFireParticle = () => {
      // Enhanced safety checks
      if (
        !this
        || !this.gameOver
        || !this.add
        || !flag
        || this.disableFireParticles
      ) {
        return; // Exit if scene or flag is invalid, or fire particles are disabled
      }

      try {
        // Validate flag position
        if (
          typeof flag.x !== 'number'
          || typeof flag.y !== 'number'
          || isNaN(flag.x)
          || isNaN(flag.y)
        ) {
          console.warn('Invalid flag position for fire particles');
          return;
        }

        // Random position around the flag with bounds checking
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40;

        const particleX = flag.x + offsetX;
        const particleY = flag.y + offsetY;

        // Ensure particle position is within reasonable bounds
        if (
          particleX < -100
          || particleX > 900
          || particleY < -100
          || particleY > 700
        ) {
          return; // Skip particles that would be off-screen
        }

        // Validate fire colors array
        if (!fireColors || fireColors.length === 0) {
          console.warn('Fire colors array is invalid');
          return;
        }

        // Generate valid particle properties
        const radius = Math.max(1, Math.min(8, 2 + Math.random() * 4)); // Clamp radius between 1-8
        const colorIndex = Math.floor(Math.random() * fireColors.length);
        const color = fireColors[colorIndex];

        // Validate color value
        if (typeof color !== 'number' || isNaN(color)) {
          console.warn('Invalid fire color:', color);
          return;
        }

        // Create the particle with error handling
        const particle = this.add.circle(particleX, particleY, radius, color);

        // Verify particle was created successfully
        if (!particle) {
          console.warn('Failed to create fire particle');
          return;
        }

        fireParticles.push(particle);

        // Animate the fire particle upward with flickering
        this.tweens.add({
          targets: particle,
          y: particle.y - 30 - Math.random() * 20, // Rise upward
          x: particle.x + (Math.random() - 0.5) * 20, // Slight horizontal drift
          alpha: 0,
          scale: 0.1,
          duration: 800 + Math.random() * 400, // 800-1200ms
          ease: 'Power2.out',
          onComplete: () => {
            particle.destroy();
            const index = fireParticles.indexOf(particle);
            if (index > -1) fireParticles.splice(index, 1);
          },
        });

        // Create flickering effect
        this.tweens.add({
          targets: particle,
          scale: 1.5,
          duration: 100,
          yoyo: true,
          repeat: Math.floor(Math.random() * 3),
        });

        // Add any additional particle behavior here
        // (existing particle animation code can go here)
      } catch (error) {
        console.error('Error creating fire particle:', error);
        // Optionally disable fire particles on repeated errors
        if (!this.fireParticleErrors) this.fireParticleErrors = 0;
        this.fireParticleErrors++;

        if (this.fireParticleErrors > 10) {
          console.warn('Too many fire particle errors, disabling fire effects');
          this.disableFireParticles = true;
        }

        // Try simpler fallback particle creation
        try {
          const fallbackParticle = this.add.rectangle(
            flag.x + (Math.random() - 0.5) * 40,
            flag.y + (Math.random() - 0.5) * 30,
            3,
            3,
            0xff4500, // Simple orange rectangle
          );
          if (fallbackParticle) {
            fireParticles.push(fallbackParticle);
            this.tweens.add({
              targets: fallbackParticle,
              y: fallbackParticle.y - 20,
              alpha: 0,
              duration: 800,
              onComplete: () => {
                if (fallbackParticle.active) {
                  fallbackParticle.destroy();
                }
              },
            });
          }
        } catch (fallbackError) {
          console.error('Fallback particle creation failed:', fallbackError);
          this.disableFireParticles = true;
        }
      }
    };

    // Create fire particles every 100ms
    const fireInterval = setInterval(() => {
      if (this.gameOver) {
        createFireParticle();

        // Occasionally create a bigger flame burst
        if (Math.random() < 0.3) {
          setTimeout(createFireParticle, 50);
          setTimeout(createFireParticle, 100);
        }
      } else {
        clearInterval(fireInterval);
      }
    }, 100);

    // Create smoke particles as well
    const createSmokeParticle = () => {
      if (this.gameOver) {
        const particle = this.add.circle(
          flag.x + (Math.random() - 0.5) * 40,
          flag.y - 10,
          3 + Math.random() * 2, // Smoke particles are larger
          0x555555, // Dark gray smoke
        );

        this.tweens.add({
          targets: particle,
          y: particle.y - 50 - Math.random() * 30,
          x: particle.x + (Math.random() - 0.5) * 30,
          alpha: 0,
          scale: 2,
          duration: 1500 + Math.random() * 500,
          ease: 'Power1.out',
          onComplete: () => particle.destroy(),
        });
      }
    };

    // Create smoke particles every 200ms
    const smokeInterval = setInterval(() => {
      if (this.gameOver) {
        createSmokeParticle();
      } else {
        clearInterval(smokeInterval);
      }
    }, 200);

    // Store intervals for cleanup if needed
    this.fireInterval = fireInterval;
    this.smokeInterval = smokeInterval;
  };

  SceneClass.prototype.cleanseBloodstainsDuringVictory = function () {
    /** @type {IBattleScene} */
    const scene = this;

    // Royal cleansing: rapidly advance all bloodstains through decay stages during victory ceremony
    if (!scene.bloodStains || scene.bloodStains.length === 0) {
      console.log(
        'No blood stains to cleanse - battlefield already pristine for royal celebration',
      );
      return;
    }

    const bloodStainCount = scene.bloodStains.length;
    console.log(
      `Royal cleansing begins: rapidly advancing ${bloodStainCount} blood stains for hygienic victory celebration`,
    );

    // Create a royal cleansing effect with golden particles
    scene.createRoyalCleansingEffect();

    // Rapidly advance each bloodstain through stages during royal cleansing
    scene.bloodStains.forEach(async (bloodStain, index) => {
      if (!bloodStain || !bloodStain.active) {
        return; // Skip invalid bloodstains
      }

      // Stagger the cleansing for visual effect
      const cleansingDelay = index * 10; // 100ms between each bloodstain starting to cleanse

      setTimeout(() => {
        if (!bloodStain || !bloodStain.active) return;

        // Determine what stage to start royal cleansing from
        if (bloodStain.stage === 'fresh') {
          // Fresh blood: go through both stages rapidly
          bloodStain.transitionToStage1('royal');
        } else if (bloodStain.stage === 'faint') {
          // Faint blood: skip to dried stage
          bloodStain.transitionToStage2('royal');
        } else if (bloodStain.stage === 'dried') {
          // Already dried: fade out immediately
          bloodStain.fadeOut();
        }
      }, cleansingDelay);
    });

    // Clear the blood stains array after a delay to allow animations to complete
    setTimeout(() => {
      // Filter out any destroyed bloodstains and update the array
      scene.bloodStains = scene.bloodStains.filter(
        (stain) => stain && stain.active,
      );

      if (scene.bloodStains.length === 0) {
        console.log(
          'Royal cleansing complete: battlefield is now pristine for the victory celebration!',
        );
      } else {
        console.log(
          `Royal cleansing in progress: ${scene.bloodStains.length} bloodstains still fading`,
        );
      }
    }, 3000); // 3 second delay to allow most animations to complete
  };

  SceneClass.prototype.createRoyalCleansingEffect = function () {
    /** @type {IBattleScene} */
    const scene = this;

    // Create golden sparkles across the battlefield to represent royal cleansing magic
    console.log('Creating royal cleansing effect with golden sparkles');

    // Safety check: ensure scene is valid
    if (!scene || !scene.add || !scene.tweens || scene.sys?.isDestroyed?.()) {
      console.warn('Cannot create royal cleansing effect - scene is invalid');
      return;
    }

    // Create 20-30 golden particles across the battlefield
    const particleCount = 20 + Math.floor(Math.random() * 11); // 20-30 particles

    // Store timeout IDs for cleanup
    scene.cleansingTimeouts = scene.cleansingTimeouts || [];

    for (let i = 0; i < particleCount; i++) {
      // Random position across battlefield
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;

      // Stagger particle creation with scene validation
      const timeoutId = setTimeout(() => {
        // Double-check scene is still valid before creating sparkle
        if (scene && scene.add && !scene.sys?.isDestroyed?.()) {
          scene.createCleansingSparkle(x, y);
        }
      }, i * 100); // 100ms between each sparkle

      // Store timeout ID for potential cleanup
      scene.cleansingTimeouts.push(timeoutId);
    }
  };

  SceneClass.prototype.createCleansingSparkle = function (x, y) {
    /** @type {IBattleScene} */
    const scene = this;

    // Enhanced safety checks to prevent errors when scene is destroyed
    if (!scene || !scene.add || !scene.tweens || scene.sys?.isDestroyed?.()) {
      console.warn(
        'Cannot create cleansing sparkle - scene is invalid or destroyed',
      );
      return;
    }

    try {
      // Create a golden sparkle that represents royal cleansing magic
      const sparkle = scene.add.star(x, y, 4, 3, 6, 0xffd700); // Golden 4-pointed star

      // Validate sparkle was created successfully
      if (!sparkle) {
        console.warn('Failed to create cleansing sparkle');
        return;
      }

      sparkle.setAlpha(0.8);
      sparkle.setScale(0.1);

      // Animate the sparkle: appear, shine, then fade
      scene.tweens.add({
        targets: sparkle,
        scale: 0.8,
        alpha: 1,
        rotation: Math.PI * 2, // Full rotation
        duration: 800,
        ease: 'Power2.out',
        onComplete: () => {
          // Safety check before creating fade tween
          if (
            sparkle
            && sparkle.active
            && scene
            && scene.tweens
            && !scene.sys?.isDestroyed?.()
          ) {
            // Fade out the sparkle
            scene.tweens.add({
              targets: sparkle,
              alpha: 0,
              scale: 0.3,
              duration: 600,
              ease: 'Power2.in',
              onComplete: () => {
                // Final safety check before destroying
                if (sparkle && sparkle.active && sparkle.destroy) {
                  sparkle.destroy();
                }
              },
            });
          } else if (sparkle && sparkle.destroy) {
            // Destroy immediately if scene is invalid
            sparkle.destroy();
          }
        },
      });

      // Add a pulsing glow effect with safety checks
      if (scene && scene.tweens && !scene.sys?.isDestroyed?.()) {
        scene.tweens.add({
          targets: sparkle,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 400,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        });
      }
    } catch (error) {
      console.error('Error creating cleansing sparkle:', error);
    }
  };
}
