export function applyBerserkerFeatures(OrcClass) {
  OrcClass.prototype.convertToBerserker = function () {
    console.log(`Converting ${this.team} orc to BERSERKER!`);

    // Log the berserker strength bonus
    console.log(`${this.team} berserker strength bonus: ${this.berserkerStrengthBonus || 0}`);

    // Safety check: ensure berserker isn't inside terrain before materializing
    this.ensureSafeMaterialization(this.advanceWaypointscene);

    // FIRST: Set the type to berserker (MOVED UP before invisibility cleanup)
    this.type = 'berserker';

    this.berserkerCandidate = false;
    // THEN: Remove invisibility effects and restore visibility
    this.invisible = false;
    this.invulnerableWhileInvisible = false; // Remove invisibility invulnerability
    this.canAttack = true;

    // Force-stop any ongoing transparency tweens before setting final alpha
    if (this.scene.tweens) {
      this.scene.tweens.killTweensOf([this]);
      if (this.head) {
        this.scene.tweens.killTweensOf([this.head]);
      }
    }

    // Remove invisibility effect AFTER setting type (so the cleanup works properly)
    this.scene.removeInvisibilityEffect(this);

    // Force full visibility immediately after cleanup
    this.setAlpha(1.0);
    if (this.head) this.head.setAlpha(1.0);

    // Clear any tint to ensure normal visibility
    this.clearTint();
    if (this.head) this.head.clearTint();

    // Set berserker stats
    this.health = 4.5 + (this.berserkerStrengthBonus / 3 || 0);
    this.maxHealth = this.health; // Store maximum health for health bar calculations

    this.maxLaserResistance = 0.95;
    this.minLaserResistance = 0.25;
    this.laserResistance = 0.6 + 0.1 * (this.berserkerStrengthBonus || 0); // 50% chance to resist + 10% per bonus
    this.deflectionsCount = 0; // Track total deflections
    this.deflectionsThisDecay = 0; // Track deflections since last decay
    this.resistanceDecayRate = 2.5 + 3 * this.berserkerStrengthBonus; //shots deflected to lose the decay amount
    this.resistanceDecayAmount = 0.175 - ((2 * this.berserkerStrengthBonus) / 100); //Lose resistance in chunks
    this.canUseLaser = false; // Cannot use laser attacks
    this.hasSwordAttack = true; // Must use sword attacks
    this.hasAxeAttack = true; // Can destroy terrain with axe

    // Log the calculated stats
    console.log(
      `${this.team} berserker final stats - Health: ${this.health}, Laser Resistance: ${(this.laserResistance * 100).toFixed(1)}%`,
    );

    // Regenerate terrain patience as a berserker (more aggressive)
    this.terrainPatience = this.generateTerrainPatience();

    // Update behavior for berserker
    this.moveSpeed = 125; // Much faster movement (was 90)
    this.preferredRange = 40; // Close combat range for sword
    this.fireRate = 300; // Much faster attack rate for berserkers (was 400)
    this.bodyTurnSpeed = 3.5; // Faster turning for berserkers
    this.headTurnSpeed = 4.0; // Even faster head turning

    // Clear invisibility waypoint
    this.invisibilityWaypoint = null;

    // Update unit info label if showing
    if (this.unitInfoLabel) {
      this.updateBerserkerUnitInfo();
    }

    // Create berserker health bar
    this.createBerserkerHealthBar();

    // Create invulnerability indicator (initially hidden)
    this.createInvulnerabilityIndicator();
  };

  OrcClass.prototype.handleBerserkerDeflection = function () {
    // Called when berserker successfully deflects a laser
    if (this.type !== 'berserker') return;

    this.deflectionsCount++;
    this.deflectionsThisDecay++;

    // console.log(
    //   `${this.team} berserker deflection #${this.deflectionsCount} (${this.deflectionsThisDecay}/${this.resistanceDecayRate} until resistance decay)`,
    // );

    // Check if it's time to decay resistance
    if (this.deflectionsThisDecay >= this.resistanceDecayRate) {
      this.decayLaserResistance();
      this.deflectionsThisDecay = 0; // Reset counter
    }
  };

  OrcClass.prototype.decayLaserResistance = function () {
    // Reduce laser resistance but never below 0.4 (40%)
    this.laserResistance = Math.max(this.minLaserResistance, this.laserResistance - this.resistanceDecayAmount);

    const resistancePercent = (this.laserResistance * 100).toFixed(1);
    const lostPercent = (this.resistanceDecayAmount * 100).toFixed(1);

    // console.log(
    //   `${this.team} berserker resistance degraded! Lost ${lostPercent}% resistance. Now at ${resistancePercent}%`,
    // );

    // Visual feedback for resistance loss
    this.showResistanceLossEffect();

    // Update unit info if showing resistance info
    if (this.unitInfoLabel && this.showUnitInfo) {
      this.updateBerserkerUnitInfo();
    }
  };

  OrcClass.prototype.showResistanceLossEffect = function () {
    // Visual effect when berserker loses resistance - use dynamic color system
    const resistanceRatio = this.laserResistance / this.maxLaserResistance;
    const warningColor = this.laserResistance <= 0.45 ? 0xff0000 : 0xffaa00; // Red if near minimum, orange otherwise

    // Flash the berserker briefly
    this.setTint(warningColor);
    if (this.head) this.head.setTint(warningColor);

    this.scene.tweens.add({
      targets: [this, this.head].filter((sprite) => sprite), // Filter out null head
      alpha: 0.7,
      duration: 200,
      yoyo: true,
      onComplete() {
        for (const t of this.targets) {
          t.clearTint();
        }
      },
    });

    // Show resistance percentage above berserker with color indicating level
    const resistanceText = `${(this.laserResistance * 100).toFixed(0)}%`;
    const textColor = this.laserResistance <= 0.45 ? '#ff0000' : '#ffaa00';

    const floatingText = this.scene.add
      .text(this.x, this.y - 40, resistanceText, {
        fontSize: '12px',
        fill: textColor,
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Animate floating text
    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.out',
      onComplete: () => floatingText.destroy(),
    });

    // Show a small deflection effect preview with new color
    const previewColor = this.getBerserkerDeflectionColor(resistanceRatio);
    const previewEffect = this.scene.add.circle(this.x + 20, this.y - 20, 4, previewColor, 0.8);

    this.scene.tweens.add({
      targets: previewEffect,
      radius: 8,
      alpha: 0,
      duration: 800,
      ease: 'Power2.out',
      onComplete: () => previewEffect.destroy(),
    });
  };

  OrcClass.prototype.getBerserkerDeflectionAlpha = function () {
    // Return the alpha value for deflection effects based on current resistance
    // Higher resistance = more opaque deflection effects
    // Lower resistance = more transparent deflection effects

    if (this.type !== 'berserker' || !this.maxLaserResistance) {
      return 1.0; // Default full opacity for non-berserkers
    }

    // Calculate alpha based on remaining resistance ratio
    const resistanceRange = this.maxLaserResistance - this.minLaserResistance;
    const currentRange = this.laserResistance - this.minLaserResistance;
    const resistanceRatio = resistanceRange > 0 ? currentRange / resistanceRange : 0;

    // Map resistance ratio to alpha range (0.3 to 1.0)
    // At minimum resistance (40%), effects show at 30% alpha
    // At maximum resistance, effects show at 100% alpha
    const minAlpha = 0.3;
    const maxAlpha = 1.0;

    const alpha = minAlpha + resistanceRatio * (maxAlpha - minAlpha);

    return Math.max(minAlpha, Math.min(maxAlpha, alpha));
  };

  OrcClass.prototype.getBerserkerDeflectionColor = function (resistanceRatio) {
    // Interpolate color from gold (high resistance) to black (low resistance)
    // Gold: 0xFFD700 (R=255, G=215, B=0)
    // Black: 0x000000 (R=0, G=0, B=0)

    // Since minimum resistance is 0.5, map the range 0.4-1.0 to 0.0-1.0 for color interpolation
    const minResistance = 0.5;
    const maxLaserResistance = 0.9;
    const colorRatio = Math.max(0, (resistanceRatio - minResistance) / (maxLaserResistance - minResistance));

    // Gold color components
    const goldR = 255;
    const goldG = 215;
    const goldB = 0;

    // Black color components
    const blackR = 0;
    const blackG = 0;
    const blackB = 0;

    // Interpolate between gold and black
    const r = Math.round(blackR + (goldR - blackR) * colorRatio);
    const g = Math.round(blackG + (goldG - blackG) * colorRatio);
    const b = Math.round(blackB + (goldB - blackB) * colorRatio);

    // Convert to hex color
    const color = (r << 16) | (g << 8) | b;

    return color;
  };

  OrcClass.prototype.createBerserkerHealthBar = function () {
    if (this.type !== 'berserker') return;

    // Health bar dimensions
    const barWidth = 24;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - 35; // Above the orc

    // Create background (dark gray)
    this.healthBarBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
    this.healthBarBg.setDepth(5);

    // Create health bar (initially full and green)
    this.healthBar = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x00ff00);
    this.healthBar.setDepth(6);

    // Update health bar to current health
    this.updateBerserkerHealthBar();
  };

  OrcClass.prototype.updateBerserkerHealthBar = function () {
    if (this.type !== 'berserker' || !this.healthBar || !this.healthBarBg) return;

    // Calculate health percentage
    const healthPercent = Math.max(0, this.health / this.maxHealth);

    // Calculate bar width based on health
    const maxBarWidth = 24;
    const currentBarWidth = maxBarWidth * healthPercent;

    // Update bar width
    this.healthBar.setSize(currentBarWidth, 4);

    // Calculate health color (green to red gradient)
    let healthColor;
    if (healthPercent > 0.6) {
      // Green to yellow (high health)
      const greenToYellow = (1 - healthPercent) / 0.4; // 0 to 1 as health goes from 100% to 60%
      const red = Math.floor(255 * greenToYellow);
      healthColor = (red << 16) | (255 << 8) | 0; // RGB: red, 255, 0
    } else {
      // Yellow to red (low health)
      const yellowToRed = healthPercent / 0.6; // 0 to 1 as health goes from 0% to 60%
      const green = Math.floor(255 * yellowToRed);
      healthColor = (255 << 16) | (green << 8) | 0; // RGB: 255, green, 0
    }

    // Apply color
    this.healthBar.setFillStyle(healthColor);

    // Position the bar (left-aligned)
    const barX = this.x - maxBarWidth / 2 + currentBarWidth / 2;
    this.healthBar.setPosition(barX, this.y - 35);
    this.healthBarBg.setPosition(this.x, this.y - 35);
  };

  OrcClass.prototype.createInvulnerabilityIndicator = function () {
    // Create a small asterisk to indicate invulnerability
    this.invulnerabilityIndicator = this.scene.add.text(this.x + 15, this.y - 30, '*', {
      fontSize: '14px',
      fill: '#ffff00', // Bright yellow
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.invulnerabilityIndicator.setDepth(7);
    this.invulnerabilityIndicator.setVisible(false); // Initially hidden

    // Add pulsing animation
    this.scene.tweens.add({
      targets: this.invulnerabilityIndicator,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  };

  OrcClass.prototype.updateInvulnerabilityIndicator = function () {
    if (!this.invulnerabilityIndicator) return;

    // Show indicator if orc is invulnerable in any way
    const isInvulnerable = this.immuneToDamage || this.invulnerableWhileInvisible;
    this.invulnerabilityIndicator.setVisible(isInvulnerable);

    // Update position
    this.invulnerabilityIndicator.setPosition(this.x + 15, this.y - 30);
  };

  OrcClass.prototype.syncBerserkerSprites = function () {
    // Update health bar position
    this.updateBerserkerHealthBar();

    // Update invulnerability indicator
    this.updateInvulnerabilityIndicator();
  };

  OrcClass.prototype.updateBerserkerUnitInfo = function () {
    // Create multi-line text for berserker with strength bonus info and fire rate
    const strengthBonus = this.berserkerStrengthBonus || 0;
    const fireRateMs = Math.round(this.fireRate);
    let labelText = 'BERSERKER';

    if (strengthBonus > 0) {
      labelText += `\n+${strengthBonus} STR`;
    }

    // Add fire rate
    labelText += `\n${fireRateMs}ms`;

    // Determine team color
    const teamColor = this.team === 'blue' ? '#4A90E2' : '#E74C3C'; // Blue team gets blue, red team gets red

    // Update the label text with team-colored styling
    this.unitInfoLabel.setText(labelText);

    // Adjust styling for multi-line text with team colors
    this.unitInfoLabel.setStyle({
      fontSize: '9px',
      fill: teamColor, // ← Team color text instead of white
      backgroundColor: 'rgba(0, 0, 0, 0.15)', // Almost transparent black
      padding: { x: 4, y: 2 },
      align: 'center',
      stroke: '#ffffff', // White outline for visibility
      strokeThickness: 1,
    });

    // Re-center the label since it might be taller now
    this.unitInfoLabel.setOrigin(0.5);

    console.log(
      `Updated unit info for ${this.team} berserker with team color ${teamColor}: "${labelText.replace(/\n/g, ' ')}"`,
    );
  };

  OrcClass.prototype.applySwordDamage = function (target) {
    // Berserker must be alive for sword damage to be applied
    if (!this.active | !this.scene) {
      return;
    }
    // Sword attacks do 2 damage (more than lasers)
    // console.log(`${target.team} orc taking sword damage - health before: ${target.health}`);
    target.health -= 2;
    // console.log(`${target.team} orc health after sword damage: ${target.health}`);

    // Visual feedback
    target.setTint(0xff0000);
    this.scene.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      onComplete() {
        target.clearTint();

        // Update health bar if target is a berserker
        if (target.type === 'berserker' && target.updateBerserkerHealthBar) {
          target.updateBerserkerHealthBar();
        }

        if (target.health <= 0) {
          // console.log(`${target.team} orc died from sword damage - health: ${target.health}`);
          target.attemptDie();
        }
      },
    });

    // Knockback effect - only if target has a physics body
    if (target.body && target.active) {
      const knockbackAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      const knockbackForce = 50;
      const knockbackX = Math.cos(knockbackAngle) * knockbackForce;
      const knockbackY = Math.sin(knockbackAngle) * knockbackForce;

      target.setVelocity(knockbackX, knockbackY);
    }

    // Create blood splatter effect
    for (let i = 0; i < 3; i++) {
      const blood = this.scene.add.circle(
        target.x + (Math.random() - 0.5) * 10,
        target.y + (Math.random() - 0.5) * 10,
        2,
        0x8b0000, // Dark red
      );

      this.scene.tweens.add({
        targets: blood,
        x: blood.x + (Math.random() - 0.5) * 50,
        y: blood.y + (Math.random() - 0.5) * 50,
        alpha: 0,
        duration: 800,
        onComplete: () => blood.destroy(),
      });
    }
  };

  OrcClass.prototype.performSwordAttack = function (target) {
    // Create sword sprite for attack animation
    const sword = this.scene.add.rectangle(this.x, this.y, 4, 20, 0xc0c0c0); // Silver sword
    sword.setStrokeStyle(1, 0x808080);

    // Calculate attack angle
    const attackAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    sword.setRotation(attackAngle);

    // Animate sword thrust
    const thrustDistance = 40;
    const thrustX = this.x + Math.cos(attackAngle) * thrustDistance;
    const thrustY = this.y + Math.sin(attackAngle) * thrustDistance;

    const orc = this;

    this.scene.tweens.add({
      targets: sword,
      x: thrustX,
      y: thrustY,
      duration: 150,
      ease: 'Power2.out',
      yoyo: true,
      onComplete() {
        // Check if attack hits
        if (target && target.active) {
          const distance = Phaser.Math.Distance.Between(orc.x, orc.y, target.x, target.y);
          if (distance < 70) {
            // Successful hit (increased range from 60 to 70 to match attack range)
            orc.applySwordDamage(target);
            // console.log(`${orc.team} berserker sword hit ${target.team} orc!`);
          } else {
            // console.log(`${orc.team} berserker sword attack missed`);
          }
        }

        sword.destroy();
      },
    });

    // Create slash effect
    this.spriteGen.createSwordSlashEffect(this.x, this.y, attackAngle);
  };

  OrcClass.prototype.ensureSafeMaterialization = function () {
    // Check if current position is safe for materialization
    const isSafe = this.isPositionSafeForMaterialization();

    if (!isSafe) {
      console.log(`${this.team} berserker at unsafe position (${this.x}, ${this.y}), finding safe spot`);

      // Find nearest safe position
      const safePosition = this.findNearestSafePosition();
      if (safePosition) {
        console.log(`Moving ${this.team} berserker to safe position (${safePosition.x}, ${safePosition.y})`);
        this.setPosition(safePosition.x, safePosition.y);
      } else {
        console.warn(`Could not find safe position for ${this.team} berserker!`);
      }
    }
  };

  OrcClass.prototype.isPositionSafeForMaterialization = function (testX = this.x, testY = this.y) {
    // Check if position would be inside terrain
    for (const terrain of this.scene.terrain) {
      if (terrain.chunks && terrain.chunks.length > 0) {
        // Multi-chunk terrain
        const bounds = terrain.getBounds();
        if (bounds) {
          const buffer = 35;
          if (
            testX > bounds.x - buffer
                        && testX < bounds.x + bounds.width + buffer
                        && testY > bounds.y - buffer
                        && testY < bounds.y + bounds.height + buffer
          ) {
            return false;
          }
        }
      } else {
        // Single terrain sprite
        const distance = Phaser.Math.Distance.Between(testX, testY, terrain.x, terrain.y);
        if (distance < 50) {
          return false;
        }
      }
    }

    // Check if position would overlap with other orcs
    const allOrcs = [...this.scene.blueOrcs, ...this.scene.redOrcs].filter((orc) => orc.active && orc !== this);
    for (const orc of allOrcs) {
      const distance = Phaser.Math.Distance.Between(testX, testY, orc.x, orc.y);
      if (distance < 40) {
        return false;
      }
    }

    return true;
  };

  OrcClass.prototype.findNearestSafePosition = function () {
    // Try positions in expanding circles around current position
    for (let radius = 40; radius <= 140; radius += 20) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const testX = this.x + Math.cos(angle) * radius;
        const testY = this.y + Math.sin(angle) * radius;

        // Check bounds
        if (testX < 50 || testX > 750 || testY < 50 || testY > 550) continue;

        if (this.isPositionSafeForMaterialization(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }

    return null; // No safe position found
  };

  OrcClass.prototype.cleanupBerserkerEffects = function () {
    // Clean up immunity effect
    this.scene.removeImmunityEffect(this);

    // Clean up invisibility effects
    this.scene.removeInvisibilityEffect(this);

    // Clean up berserker UI elements
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    if (this.healthBarBg) {
      this.healthBarBg.destroy();
      this.healthBarBg = null;
    }

    if (this.invulnerabilityIndicator) {
      this.invulnerabilityIndicator.destroy();
      this.invulnerabilityIndicator = null;
    }

    // Re-enable collisions if they were disabled
    if (this.collisionsDisabled) {
      this.enableCollisions();
    }

    // Note: Berserker aura cleanup removed - no longer using black aura

    // Clear berserker-related flags and waypoints
    this.berserkerCandidate = false;
    this.immuneToDamage = false;
    this.invisible = false;
    this.invulnerableWhileInvisible = false; // Clear invisibility invulnerability
    this.canAttack = true;
    this.canUseLaser = true;
    this.hasSwordAttack = false;
    this.hasAxeAttack = false; // Clear axe attack capability
    this.type = null;
    this.invisibilityWaypoint = null;
    this.collisionsDisabled = false; // Reset collision flag
    this.lineOfSightLostTime = null; // Clear line of sight timer
    this.seekingLineOfSightStartTime = null; // Clear terrain destruction timer

    console.log(`Cleaned up all berserker effects for ${this.team} orc`);
  };
}
