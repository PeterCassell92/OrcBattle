export function applyBattlefieldStateMethods(SceneClass) {
  // Combat strip and advancement logic
  SceneClass.prototype.getCombatStrip = function (x) {
    const stripIndex = Math.floor(x / this.combatStripWidth);
    return Math.max(-5, Math.min(5, stripIndex - 5));
  };

  SceneClass.prototype.updateCombatStripPositions = function () {
    [...this.blueOrcs, ...this.redOrcs].forEach((orc) => {
      if (orc.active) {
        orc.combatStrip = this.getCombatStrip(orc.x);
      }
    });
  };

  SceneClass.prototype.cleanupBloodStains = function () {
    // Clean up any remaining blood stains from previous games
    // Note: Blood stains are normally cleansed during victory ceremony,
    // but this handles any edge cases or leftover stains
    if (!this.bloodStains) {
      this.bloodStains = [];
      console.log('Blood stains array initialized');
      return;
    }

    const bloodStainCount = this.bloodStains.length;

    if (bloodStainCount === 0) {
      console.log('No residual blood stains to clean up - battlefield already pristine');
      return;
    }

    console.log(`Cleaning up ${bloodStainCount} residual blood stains from previous game`);

    // Destroy all existing bloodstain sprites with error handling
    this.bloodStains.forEach((bloodStain, index) => {
      try {
        if (bloodStain && bloodStain.active && bloodStain.destroy) {
          bloodStain.destroy();
        } else if (bloodStain && bloodStain.setVisible) {
          // Fallback: hide the sprite if destroy fails
          bloodStain.setVisible(false);
          bloodStain.setActive(false);
        }
      } catch (error) {
        console.warn(`Error destroying residual blood stain ${index}:`, error);
      }
    });

    // Clear the bloodStains array
    this.bloodStains = [];

    console.log(
      `Residual blood stain cleanup complete - ${bloodStainCount} stains removed, battlefield ready for new game`,
    );
  };

  SceneClass.prototype.resetAllCollisionStates = function () {
    // Reset collision states from previous games if needed
    // This ensures orcs start with proper collision detection enabled
    console.log('Resetting collision states for new game');

    // Reset any global collision flags that might persist between games
    // Currently no specific collision states need resetting, but method exists for future use
  };

  SceneClass.prototype.updateUI = function () {
    document.getElementById('blue-count').textContent = `${this.blueOrcs.length} Warriors + King`;
    document.getElementById('red-count').textContent = `${this.redOrcs.length} Warriors + King`;
  };

  /**
     *
     * @param {number} delta the timedelta since last positional update
     */
  SceneClass.prototype.updateLaserPositions = function (delta) {
    this.lasers.forEach((laser, index) => {
      if (laser.active) {
        if (!laser.lastX) laser.lastX = laser.x;
        if (!laser.lastY) laser.lastY = laser.y;

        const distanceMoved = Phaser.Math.Distance.Between(laser.x, laser.y, laser.lastX, laser.lastY);

        if (distanceMoved < 1 && laser.body) {
          // Use different speed based on laser type
          const baseSpeed = 350; // Increased from 245 to match new laser speed
          const speed = laser.isCoverFirerLaser ? baseSpeed * 2.3 : baseSpeed; // Updated multiplier
          const deltaTime = delta / 1000;
          const moveX = Math.cos(laser.rotation) * speed * deltaTime;
          const moveY = Math.sin(laser.rotation) * speed * deltaTime;

          laser.x += moveX;
          laser.y += moveY;
        }

        laser.lastX = laser.x;
        laser.lastY = laser.y;

        if (laser.x < -100 || laser.x > 900 || laser.y < -100 || laser.y > 700) {
          laser.destroy();
          this.lasers.splice(index, 1);
        }
      }
    });

    this.lasers = this.lasers.filter((laser) => laser.active);
  };

  SceneClass.prototype.cleanupPendingTimeouts = function () {
    // Clean up royal cleansing timeouts
    if (this.cleansingTimeouts) {
      this.cleansingTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.cleansingTimeouts = [];
    }

    // Clean up fire effect intervals
    if (this.fireInterval) {
      clearInterval(this.fireInterval);
      this.fireInterval = null;
    }

    if (this.smokeInterval) {
      clearInterval(this.smokeInterval);
      this.smokeInterval = null;
    }
  };
}
