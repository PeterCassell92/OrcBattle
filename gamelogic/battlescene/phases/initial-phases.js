/**
 * @description PHASE 1 There is an initial pause where no orc may fire until the firingDelayTime has been passed
 * @param {*} SceneClass
 */
export function applyInitialCeaseFirePhaseMethods(SceneClass) {
  SceneClass.prototype.checkFiringDelay = function () {
    if (this.firingAllowed) return;

    const gameTime = Date.now() - this.gameStartTime;
    if (gameTime >= this.firingDelayTime) {
      this.firingAllowed = true;
      console.log('Firing delay ended - orcs can now shoot!');

      // Add visual notification
      const readyText = this.add
        .text(400, 150, 'BATTLE BEGINS!', {
          fontSize: '24px',
          fill: '#FFD700',
          fontWeight: 'bold',
          stroke: '#000',
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: readyText,
        scale: 1.3,
        alpha: 0,
        duration: 1500,
        ease: 'Power2.out',
        onComplete: () => readyText.destroy(),
      });
    }
  };
}

/**
 * @description PHASE 2 In the beginning of combat, cover_firers may hold back but are forced to advance
 *              until after gametime reaches 12 and they become rushers.
 * @param {*} SceneClass
 * @returns
 */
export function applyCoverFirersAdvancePhaseMethods(SceneClass) {
  SceneClass.prototype.checkCoverFirerAdvancement = function () {
    this.checkTeamCoverFirerAdvancement(this.blueOrcs, 'blue');
    this.checkTeamCoverFirerAdvancement(this.redOrcs, 'red');
  };

  //TODO: review this logic
  SceneClass.prototype.checkTeamCoverFirerAdvancement = function (teamOrcs, teamName) {
    const activeOrcs = teamOrcs.filter((orc) => orc.active);
    const rushers = activeOrcs.filter((orc) => orc.behaviour === 'rusher');
    const coverFirers = activeOrcs.filter((orc) => orc.behaviour === 'cover_firer');

    if (rushers.length === 0 && coverFirers.length === 0) return;

    const gameTime = (Date.now() - this.gameStartTime) / 1000;
    let stripThreshold;

    if (gameTime >= 12) {
      if (coverFirers.length) {
        console.log('Aggression reached - All Units Rushers');
      }

      coverFirers.forEach((coverFirer) => {
        if (coverFirer.behaviour === 'cover_firer') {
          coverFirer.convertToRusher();
        }
      });
      return;
    } else if (gameTime >= 6) {
      stripThreshold = 1;
    } else if (gameTime >= 2) {
      stripThreshold = 2;
    } else {
      stripThreshold = 3;
    }

    if (coverFirers.length === 0) return;

    const rusherStrips = rushers.map((orc) => orc.combatStrip);
    const avgRusherStrip = rushers.length > 0 ? rusherStrips.reduce((sum, strip) => sum + strip, 0) / rusherStrips.length : 0;

    coverFirers.forEach((coverFirer) => {
      if (coverFirer.behaviour !== 'cover_firer') return;

      const stripDifference = Math.abs(avgRusherStrip - coverFirer.combatStrip);

      if (stripDifference > stripThreshold) {
        if (teamName === 'blue' && avgRusherStrip > coverFirer.combatStrip + stripThreshold) {
          coverFirer.setCoverFirerAdvanceWaypoint(avgRusherStrip - 1);
        } else if (teamName === 'red' && avgRusherStrip < coverFirer.combatStrip - stripThreshold) {
          coverFirer.setCoverFirerAdvanceWaypoint(avgRusherStrip + 1);
        }
      }
    });
  };
}
