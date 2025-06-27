/**
 * @description PHASE 3 Kings are released and being their march forward
 *              They may throw fireballs at the other king for visual effect
 * @param {*} SceneClass
 */
export function applyKingPhaseMethods(SceneClass) {
  SceneClass.prototype.prepareKingForMarch = function (king) {
    console.log(`Preparing ${king.team} king for march - fixing physics setup`);

    // Ensure king is properly set up for movement
    king.setImmovable(false);

    // Reset physics body to ensure proper collision detection
    if (king.body) {
      // Ensure the body is active and properly configured
      king.body.enable = true;
      king.body.checkCollision.up = true;
      king.body.checkCollision.down = true;
      king.body.checkCollision.left = true;
      king.body.checkCollision.right = true;

      // Set up movement properties
      king.body.setMaxVelocity(50, 50); // Reasonable max velocity
      king.body.setDrag(200); // Some drag to prevent sliding
      king.body.setBounce(0); // No bouncing

      // Ensure collision bounds are set properly
      king.setCollideWorldBounds(true);

      console.log(
        `${king.team} king physics body prepared: size(${king.body.width}, ${king.body.height}) at (${king.x}, ${king.y})`,
      );
    } else {
      console.error(`${king.team} king has no physics body!`);
    }

    // Ensure king sprite is visible and active
    king.setVisible(true);
    king.setActive(true);

    // Sync head sprite to ensure it follows
    if (king.head) {
      king.head.setVisible(true);
      king.head.setActive(true);
    }

    console.log(`${king.team} king prepared for march at position (${king.x}, ${king.y})`);
  };

  SceneClass.prototype.releaseKings = function () {
    console.log('Kings released! Royal march begins!');

    // Enable king movement and setup march
    if (this.blueKing && this.blueKing.alive) {
      // Fix physics setup for marching
      this.prepareKingForMarch(this.blueKing);
      this.blueKing.released = true;
      this.blueKing.marching = true;
      this.blueKing.setMarchWaypoints();
      console.log('Blue King begins march!');
    }

    if (this.redKing && this.redKing.alive) {
      // Fix physics setup for marching
      this.prepareKingForMarch(this.redKing);
      this.redKing.released = true;
      this.redKing.marching = true;
      this.redKing.setMarchWaypoints();
      console.log('Red King begins march!');
    }

    // Add dramatic release announcement
    const releaseText = this.add
      .text(400, 200, 'ROYAL MARCH BEGINS!', {
        fontSize: '32px',
        fill: '#FFD700',
        fontWeight: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: releaseText,
      scale: 1.5,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.out',
      onComplete: () => releaseText.destroy(),
    });

    this.kingsReleased = true;
  };

  SceneClass.prototype.checkKingRelease = function () {
    //If Kings already released then no need to check. One time action.
    if (this.kingsReleased) return;

    const gameTime = Date.now() - this.gameStartTime;
    if (gameTime >= this.kingReleaseTime) {
      console.log('Kings released! Royal charge begins!');
      this.releaseKings();
      this.kingsReleased = true;
    }
  };
}
