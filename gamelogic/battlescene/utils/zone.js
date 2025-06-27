export function applyZoneMethods(SceneClass) {
  SceneClass.prototype.isLocationInEnemyAlcovesOrOOB = function (targetX, targetY, enemyTeam) {
    // Check if target is off-screen
    if (targetX < 50 || targetX > 750 || targetY < 50 || targetY > 550) {
      return true;
    }

    // Define alcove boundaries
    const blueAlcoveBounds = {
      x: 0, y: 200, width: 60, height: 200,
    };
    const redAlcoveBounds = {
      x: 740, y: 200, width: 60, height: 200,
    };

    // Check if target is inside enemy alcove
    if (enemyTeam === 'blue') {
      if (
        targetX >= blueAlcoveBounds.x
                && targetX <= blueAlcoveBounds.x + blueAlcoveBounds.width
                && targetY >= blueAlcoveBounds.y
                && targetY <= blueAlcoveBounds.y + blueAlcoveBounds.height
      ) {
        return true;
      }
    } else {
      if (
        targetX >= redAlcoveBounds.x
                && targetX <= redAlcoveBounds.x + redAlcoveBounds.width
                && targetY >= redAlcoveBounds.y
                && targetY <= redAlcoveBounds.y + redAlcoveBounds.height
      ) {
        return true;
      }
    }

    return false;
  };

  SceneClass.prototype.findNearestShrubToAlcove = function (alcoveTeam) {
    // Get alcove position
    const alcoveX = alcoveTeam === 'blue' ? 30 : 770;
    const alcoveY = 300;

    // Find all unburnt shrubs
    const availableShrubs = this.backgroundDecorations.filter(
      (decoration) => decoration.decorationType === 'shrub' && !decoration.burnt,
    );

    if (availableShrubs.length === 0) {
      return null;
    }

    // Find the shrub closest to the enemy alcove
    let nearestShrub = null;
    let nearestDistance = Infinity;

    availableShrubs.forEach((shrub) => {
      const distance = Phaser.Math.Distance.Between(alcoveX, alcoveY, shrub.x, shrub.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestShrub = shrub;
      }
    });

    console.log(`Found nearest shrub to ${alcoveTeam} alcove at distance ${nearestDistance.toFixed(0)}`);
    return nearestShrub;
  };

  SceneClass.prototype.isValidTerrainPosition = function (x, y) {
    // Define safe zones (avoid spawning terrain here)
    const safeZones = [
      { x: 30, y: 300, radius: 80 }, // Blue king alcove
      { x: 770, y: 300, radius: 80 }, // Red king alcove
      { x: 150, y: 300, radius: 60 }, // Blue spawn area
      { x: 650, y: 300, radius: 60 }, // Red spawn area
    ];

    // Check if position is in a safe zone
    for (const zone of safeZones) {
      const distance = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
      if (distance < zone.radius) {
        return false;
      }
    }

    // Check if too close to existing terrain
    for (const terrain of this.terrain) {
      const terrainX = terrain.x || terrain.x;
      const terrainY = terrain.y || terrain.y;
      const distance = Math.sqrt((x - terrainX) ** 2 + (y - terrainY) ** 2);
      if (distance < 70) {
        // Minimum distance between terrain pieces
        return false;
      }
    }

    return true;
  };
}
