export function applyPhysicsMethods(OrcClass) {
    OrcClass.prototype.disableCollisions = function () {
        // console.log(`Disabling collisions for ${orc.team}`);

        // Remove orc from collision groups temporarily
        if (this.team === 'blue') {
            this.scene.blueOrcGroup.remove(this);
        } else {
            this.scene.redOrcGroup.remove(this);
        }

        // Store original collision state for restoration
        this.collisionsDisabled = true;

        // Disable physics body collision with world bounds temporarily
        // But keep the body active for movement
        if (this.body) {
            this.body.checkCollision.none = true;
        }
    };

    OrcClass.prototype.enableCollisions = function () {
        // console.log(`Re-enabling collisions for visible ${orc.team} berserker`);

        // Re-add orc to appropriate collision group
        if (this.team === 'blue') {
            this.scene.blueOrcGroup.add(this);
        } else {
            this.scene.redOrcGroup.add(this);
        }

        // Restore collision state
        this.collisionsDisabled = false;

        // Re-enable physics body collisions
        if (this.body) {
            this.body.checkCollision.none = false;
            this.body.checkCollision.up = true;
            this.body.checkCollision.down = true;
            this.body.checkCollision.left = true;
            this.body.checkCollision.right = true;
        }
    };
}
