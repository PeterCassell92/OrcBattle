import { Orc } from '../../orc/index.js';
import { King } from '../king/king.js';
import { config } from '../index.js';

export function applyUnitCreationMethods(SceneClass) {
  SceneClass.prototype.createTeams = function () {
    const orcsPerTeam = config.teamSize;
    this.blueOrcs = [];
    this.redOrcs = [];

    // Use actual scene dimensions instead of config dimensions
    const sceneWidth = this.scale.width;
    const sceneHeight = this.scale.height;

    console.log(`Creating teams with scene dimensions: ${sceneWidth}x${sceneHeight}`);
    const blueXMin = 0;
    const blueXMax = sceneWidth / 2 - 32;
    const redXMin = sceneWidth / 2 + 32;
    const redXMax = sceneWidth;

    const yMin = 10;
    const yMax = sceneHeight - 10;

    function getValidYPosition(position, yMin, yMax) {
      const range = yMax - yMin;
      const positionInRange = yMin + (position % range);
      return positionInRange;
    }
    // Number of Orcs
    // Create blue team (left side, avoiding alcove)
    for (let i = 0; i < orcsPerTeam; i++) {
      const behaviour = i < orcsPerTeam / 2.5 ? 'cover_firer' : 'rusher';
      const blueX = Phaser.Math.Between(blueXMin + 32, blueXMax - 32);
      const blueY = getValidYPosition(100 + i * 80 + Math.random() * 40, yMin, yMax);
      const blueOrc = this.createOrc(blueX, blueY, 'blue', behaviour);
      // Blue team faces right (toward red team)
      blueOrc.bodyRotation = 0; // 0 radians = facing right
      blueOrc.headRotation = 0;
      blueOrc.setRotation(0);
      this.blueOrcs.push(blueOrc);
    }

    // Create red team (right side, avoiding alcove)
    for (let i = 0; i < orcsPerTeam; i++) {
      const behaviour = i < orcsPerTeam / 2.5 ? 'cover_firer' : 'rusher';
      const redX = Phaser.Math.Between(redXMin + 32, redXMax - 32);
      const redY = getValidYPosition(100 + i * 80 + Math.random() * 40, yMin, yMax);

      const redOrc = this.createOrc(redX, redY, 'red', behaviour);
      // Red team faces left (toward blue team)
      redOrc.bodyRotation = Math.PI; // π radians = facing left
      redOrc.headRotation = Math.PI;
      redOrc.setRotation(Math.PI);
      this.redOrcs.push(redOrc);
    }
  };

  SceneClass.prototype.createOrc = function (x, y, team, behaviour = 'rusher') {
    return new Orc(this, x, y, team, behaviour);
  };

  SceneClass.prototype.createKing = function (x, y, team) {
    return new King(this, x, y, team);
  };
}
