export function applyZoneMethods(SceneClass) {
  SceneClass.prototype.isLocationInEnemyAlcovesOrOOB = function (targetX, targetY, enemyTeam) {
    // Use actual scene dimensions
    const sceneWidth = this.scale.width;
    const sceneHeight = this.scale.height;
    
    // Check if target is off-screen (with proportional margins)
    const margin = Math.min(sceneWidth, sceneHeight) * 0.0625; // 50px at 800px width
    if (targetX < margin || targetX > sceneWidth - margin || targetY < margin || targetY > sceneHeight - margin) {
      return true;
    }

    // Define alcove boundaries (proportional to screen size)
    const alcoveWidth = sceneWidth * 0.075; // 60px at 800px width
    const alcoveHeight = sceneHeight * 0.333; // 200px at 600px height
    const alcoveY = (sceneHeight - alcoveHeight) / 2; // Center vertically
    
    const blueAlcoveBounds = {
      x: 0, y: alcoveY, width: alcoveWidth, height: alcoveHeight,
    };
    const redAlcoveBounds = {
      x: sceneWidth - alcoveWidth, y: alcoveY, width: alcoveWidth, height: alcoveHeight,
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
    // Use actual scene dimensions for alcove positioning
    const sceneWidth = this.scale.width;
    const sceneHeight = this.scale.height;
    
    // Get alcove position (proportional to screen size)
    const alcoveX = alcoveTeam === 'blue' ? sceneWidth * 0.0375 : sceneWidth * 0.9625; // 30px and 770px at 800px width
    const alcoveY = sceneHeight * 0.5; // Center vertically

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
    // Use actual scene dimensions
    const sceneWidth = this.scale.width;
    const sceneHeight = this.scale.height;
    
    // Define safe zones (avoid spawning terrain here) - proportional to screen size
    const safeZones = [
      { x: sceneWidth * 0.0375, y: sceneHeight * 0.5, radius: sceneWidth * 0.1 }, // Blue king alcove
      { x: sceneWidth * 0.9625, y: sceneHeight * 0.5, radius: sceneWidth * 0.1 }, // Red king alcove
      { x: sceneWidth * 0.1875, y: sceneHeight * 0.5, radius: sceneWidth * 0.075 }, // Blue spawn area
      { x: sceneWidth * 0.8125, y: sceneHeight * 0.5, radius: sceneWidth * 0.075 }, // Red spawn area
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
