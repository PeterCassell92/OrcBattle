/**
 * @description PHASE 4 Berserker Trio rises IF the losing team is significantly far behind
 *              Their units become berserkers which are fast and difficult to kill
 * @param {*} SceneClass
 */
export function applyBerserkerPhaseMethods(SceneClass) {
  SceneClass.prototype.updateBerserkerPhase = function (time) {
    if (!this.berserkerTrioActive) return;

    const phaseTime = Date.now() - this.berserkerPhaseStartTime;

    switch (this.berserkerPhase) {
      case 'immunity':
        // Immunity lasts 3 seconds
        if (phaseTime >= 3000) {
          this.transitionToInvisibility();
        }
        break;

      case 'invisibility':
        // Invisibility lasts 2 seconds
        if (phaseTime >= 2000) {
          this.transitionToBerserker();
        }
        break;

      case 'berserker':
        // Berserker phase is permanent until orcs die
        // No time limit
        break;
    }
  };

  SceneClass.prototype.transitionToInvisibility = function () {
    console.log(`${this.berserkerTeam} orcs transitioning to invisibility phase`);

    this.berserkerPhase = 'invisibility';
    this.berserkerPhaseStartTime = Date.now();

    this.berserkerOrcs.forEach((orc) => {
      if (orc.active) {
        // Remove immunity, add invisibility
        orc.immuneToDamage = false;
        orc.invisible = true;
        orc.invulnerableWhileInvisible = true; // New: invulnerable during invisibility
        orc.canAttack = false; // Cannot attack while invisible

        console.log(
          `${orc.team} berserker transitioning to invisibility - health: ${orc.health}, invulnerable: ${orc.invulnerableWhileInvisible}`,
        );

        // Make semi-transparent
        orc.setAlpha(0.3);
        if (orc.head) orc.head.setAlpha(0.3);

        // Remove invisibility effect, add invisibility effect
        this.removeImmunityEffect([orc, orc.head]);
        this.createInvisibilityEffect([orc, orc.head]);

        // Disable collisions for invisible berserkers
        orc.disableCollisions();
      }
    });

    // Show phase transition announcement
    const teamColor = this.berserkerTeam === 'blue' ? '#3498db' : '#e74c3c';
    const announceText = this.add
      .text(400, 180, 'Entering the Shadows...', {
        fontSize: '20px',
        fill: teamColor,
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: announceText,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.out',
      onComplete: () => announceText.destroy(),
    });
  };

  SceneClass.prototype.transitionToBerserker = function () {
    console.log(`${this.berserkerTeam} orcs becoming BERSERKERS!`);

    this.berserkerPhase = 'berserker';
    this.berserkerPhaseStartTime = Date.now();

    this.berserkerOrcs.forEach((orc) => {
      if (orc.active) {
        // Use the orc's own method to convert to berserker
        orc.convertToBerserker();

        // Re-enable collisions when berserker becomes visible
        orc.enableCollisions();
      }
    });

    const announceText = this.add
      .text(400, 200, 'BERSERKERS UNLEASHED!', {
        fontSize: '32px',
        fill: '#CC3333',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: announceText,
      scale: 1.5,
      alpha: 0,
      duration: 4000,
      ease: 'Power2.out',
      onComplete: () => announceText.destroy(),
    });

    // Filter out any dead orcs from berserker list
    this.berserkerOrcs = this.berserkerOrcs.filter((orc) => orc.active);

    // Restore normal orcs' ability to attack
    this.restoreNormalOrcAttacking();
  };

  SceneClass.prototype.activateBerserkerTrio = function (team, orcs, strengthBonus) {
    this.berserkerTrioActive = true;
    this.berserkerTeam = team;
    this.berserkerOrcs = orcs;
    this.berserkerPhase = 'immunity';
    this.berserkerPhaseStartTime = Date.now();

    // Mark orcs as berserker candidates
    orcs.forEach((orc) => {
      orc.berserkerCandidate = true;
      orc.immuneToDamage = true;
      orc.berserkerStrengthBonus = strengthBonus;

      console.log(`Making ${orc.team} orc immune - health: ${orc.health}`);

      // Add visual effect to show immunity
      this.createImmunityEffect(orc);
    });

    // Show announcement
    const teamColor = team === 'blue' ? '#3498db' : '#e74c3c';
    const announceText = this.add
      .text(400, 150, 'BERSERKER TRIO RISES!', {
        fontSize: '28px',
        fill: teamColor,
        fontWeight: 'bold',
        stroke: '#FFD700',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: announceText,
      scale: 1.3,
      alpha: 0,
      duration: 3000,
      ease: 'Power2.out',
      onComplete: () => announceText.destroy(),
    });

    console.log(`${team} orcs entering immunity phase`);
  };

  SceneClass.prototype.restoreNormalOrcAttacking = function () {
    // Restore attacking ability for all non-berserker orcs
    [...this.blueOrcs, ...this.redOrcs].forEach((orc) => {
      if (orc.active && orc.type !== 'berserker' && !orc.berserkerCandidate) {
        orc.canAttack = true;
      }
    });

    console.log('Normal orcs can now attack again after berserker phase transition');
  };

  // Berserker trio mechanics
  SceneClass.prototype.checkBerserkerTrio = function () {
    // Don't check if already active or if game is over
    if (this.berserkerTrioActive || this.gameOver) return;

    const blueActiveOrcs = this.blueOrcs.filter((orc) => orc.active);
    const redActiveOrcs = this.redOrcs.filter((orc) => orc.active);

    const blueCount = blueActiveOrcs.length;
    const redCount = redActiveOrcs.length;

    // Check if either team has exactly 3 and the other has 4+ more
    let berserkerTeam = null;
    let berserkerCandidates = [];
    let nonberserkerTeam = null;
    let nonberserkerCandidates = [];

    function checkBerserkerConditionForTeam(minorityTeam, majorityTeam) {
      const majorityUnitAdvantage = majorityTeam.length - minorityTeam.length;
      const normalBerserkerConditionDifferential = 5;
      const mediumBerserkerConditionDifferential = 9;
      const highBerserkerConditionDifferential = 15;
      if (majorityUnitAdvantage >= highBerserkerConditionDifferential) {
        return 3.5;
      }
      if (majorityUnitAdvantage >= mediumBerserkerConditionDifferential) {
        return 2;
      }
      if (majorityUnitAdvantage >= normalBerserkerConditionDifferential) {
        return 1;
      }
      return null;
    }

    const berserkerLastStandUnitNumbersTrigger = 3;
    let berserkerMode = null;
    if (blueCount === berserkerLastStandUnitNumbersTrigger && blueCount < redCount) {
      berserkerMode = checkBerserkerConditionForTeam(blueActiveOrcs, redActiveOrcs);
      berserkerCandidates = blueActiveOrcs;
      berserkerTeam = 'blue';
      nonberserkerTeam = 'red';
      nonberserkerCandidates = redActiveOrcs;
    } else if (redCount === berserkerLastStandUnitNumbersTrigger && redCount < blueCount) {
      berserkerMode = checkBerserkerConditionForTeam(redActiveOrcs, blueActiveOrcs);
      berserkerCandidates = redActiveOrcs;
      berserkerTeam = 'red';
      nonberserkerTeam = 'blue';
      nonberserkerCandidates = blueActiveOrcs;
    }

    if (berserkerMode && berserkerTeam && berserkerCandidates.length === 3) {
      console.log(
        `BERSERKER TRIO ACTIVATED! ${berserkerTeam} team with 3 orcs vs ${berserkerTeam === 'blue' ? redCount : blueCount} opponents`,
      );

      // IMMEDIATELY apply emergency immunity to prevent race condition deaths
      this.applyEmergencyImmunity(berserkerCandidates);

      // Then activate the full berserker trio system with strength modifier
      this.activateBerserkerTrio(berserkerTeam, berserkerCandidates, berserkerMode);

      // Give the nonbeserker team a fire rate increase
      nonberserkerCandidates.forEach((orc) => {
        orc.fireRate -= 450;
        orc.preferredRange += 160;
        orc.bodyTurnSpeed = 2.5;
        orc.headTurnSpeed = 3.5;
        orc.moveSpeed += 40;
      });
    }
  };

  SceneClass.prototype.applyEmergencyImmunity = function (orcs) {
    // Immediately apply immunity and heal any orcs that are about to die
    // This prevents race condition deaths when berserker trio activates

    console.log('Applying emergency immunity to prevent race condition deaths...');

    orcs.forEach((orc) => {
      if (orc.active) {
        // Immediately make immune
        orc.immuneToDamage = true;
        orc.berserkerCandidate = true;

        // Emergency healing: if orc has critical health, boost it to survive
        if (orc.health <= 0) {
          orc.health = 1; // Emergency heal to 1 HP
          console.log(`Emergency heal applied to ${orc.team} orc - restored to 1 HP`);

          // Cancel any ongoing death animations/tweens
          this.tweens.killTweensOf(orc);

          // Restore appearance if death animation started
          orc.setAlpha(1);
          orc.setScale(1);
          orc.clearTint();

          // Make sure head is also restored
          if (orc.head) {
            this.tweens.killTweensOf(orc.head);
            orc.head.setAlpha(1);
            orc.head.setScale(1);
            orc.head.clearTint();
          }
        }

        console.log(`Emergency immunity applied to ${orc.team} orc - health: ${orc.health}`);
      }
    });
  };
}
