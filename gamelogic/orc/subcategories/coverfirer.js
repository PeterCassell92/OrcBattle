export function applyCoverFirerFeatures(OrcClass) {
  OrcClass.prototype.setCoverFirerAdvanceWaypoint = function (targetStrip) {
    const targetX = (targetStrip + 5) * this.combatStripWidth + this.combatStripWidth / 2;

    let bestTerrain = null;
    let bestDistance = Infinity;

    this.scene.terrain.forEach((terrain) => {
      const distance = Math.abs(terrain.x - targetX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTerrain = terrain;
      }
    });

    if (bestTerrain) {
      // Found terrain - use cover position
      const isBlueTeam = this.team === 'blue';
      const offset = isBlueTeam ? -60 : 60;

      this.advanceWaypoint = {
        x: bestTerrain.x + offset,
        y: bestTerrain.y + (Math.random() - 0.5) * 40,
        terrain: bestTerrain,
      };
    } else {
      this.advanceWaypoint = {
        x: Math.max(100, Math.min(700, targetX + (Math.random() - 0.5) * 60)),
        y: Math.max(100, Math.min(500, this.y + (Math.random() - 0.5) * 80)),
        terrain: null,
      };
    }

    this.aiState = 'advancing';
    this.coverTarget = null;
  };
}
