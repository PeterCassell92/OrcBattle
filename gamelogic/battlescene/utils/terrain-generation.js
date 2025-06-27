import { Bloodstain } from '../../sprites/bloodstain.js';
import { Rock } from '../../sprites/rock.js';
import { Block } from '../../sprites/block.js';
import { SpriteGenerator } from '../../sprites/spriteGenerator.js';
import { userSettings } from '../../setup.js';

export function applyTerrainGenerationMethods(SceneClass) {
  SceneClass.prototype.createKingSprites = function () {
    SpriteGenerator.createAllKingSprites(this);
  };

  SceneClass.prototype.createFlagSprites = function () {
    SpriteGenerator.createAllFlagSprites(this);
  };

  SceneClass.prototype.createLaserSprite = function () {
    // Create standard laser (green) for rushers
    const laserGraphics = this.add.graphics();
    laserGraphics.fillStyle(0xff6600); // Orange laser
    laserGraphics.fillRect(0, 0, 8, 2);
    laserGraphics.generateTexture('laser', 8, 2);
    laserGraphics.destroy();

    // Create cover firer laser (lighter green/yellow) for faster shots
    const coverLaserGraphics = this.add.graphics();
    coverLaserGraphics.fillStyle(0x80ff00); // Lighter green/yellow laser
    coverLaserGraphics.fillRect(0, 0, 8, 2);
    coverLaserGraphics.generateTexture('cover-laser', 8, 2);
    coverLaserGraphics.destroy();

    // Create axe sprite for terrain destruction effects
    this.createAxeSprite();
  };

  SceneClass.prototype.createAxeSprite = function () {
    const axeGraphics = this.add.graphics();
    // Brown handle
    axeGraphics.fillStyle(0x8b4513);
    axeGraphics.fillRect(12, 0, 8, 30);
    // Silver axe head
    axeGraphics.fillStyle(0xc0c0c0);
    axeGraphics.fillEllipse(16, 8, 20, 12);
    axeGraphics.generateTexture('axe', 32, 32);
    axeGraphics.destroy();
  };

  SceneClass.prototype.createTerrainSprites = function () {
    // Create background decoration sprites
    SpriteGenerator.createAllDecorationSprites(this);

    // Create other terrain sprites
    SpriteGenerator.createAllTerrainSprites(this);
  };

  SceneClass.prototype.createRockChunkSprite = function () {
    const chunkGraphics = this.add.graphics();
    chunkGraphics.fillStyle(0x6b6b6b); // Dark gray

    // Create irregular chunk shape
    chunkGraphics.fillEllipse(9, 9, 16, 14);

    // Add some texture with darker patches
    chunkGraphics.fillStyle(0x555555);
    chunkGraphics.fillEllipse(6, 6, 6, 5);
    chunkGraphics.fillEllipse(12, 11, 5, 4);

    // Add highlights
    chunkGraphics.fillStyle(0x808080);
    chunkGraphics.fillEllipse(5, 5, 3, 2);
    chunkGraphics.fillEllipse(13, 8, 2, 2);

    chunkGraphics.generateTexture('terrain-rock-chunk', 18, 18);
    chunkGraphics.destroy();
  };

  SceneClass.prototype.createBlockChunkSprite = function () {
    const chunkGraphics = this.add.graphics();
    chunkGraphics.fillStyle(0x7f8c8d); // Gray block color

    // Create square chunk
    chunkGraphics.fillRect(0, 0, 24, 24);

    // Add darker border
    chunkGraphics.lineStyle(2, 0x5a6c6d);
    chunkGraphics.strokeRect(1, 1, 22, 22);

    // Add highlight
    chunkGraphics.fillStyle(0x95a5a6);
    chunkGraphics.fillRect(2, 2, 6, 6);
    chunkGraphics.fillRect(16, 16, 6, 6);

    chunkGraphics.generateTexture('terrain-block-chunk', 24, 24);
    chunkGraphics.destroy();
  };

  SceneClass.prototype.createGrassTuftSprite = function () {
    const grassGraphics = this.add.graphics();

    // Create small grass tuft with multiple blades pointing upwards
    const grassColors = [0x4a7c4a, 0x5a8c5a, 0x3a6c3a]; // Various green shades

    // Draw several grass blades all pointing upward
    for (let i = 0; i < 5; i++) {
      const color = grassColors[Math.floor(Math.random() * grassColors.length)];
      grassGraphics.fillStyle(color);

      const x = 2 + i * 1.5 + (Math.random() - 0.5) * 1; // Slightly spread out
      const height = 6 + Math.random() * 4;
      const width = 0.8 + Math.random() * 0.4;

      // Draw grass blade pointing straight up (no curve)
      grassGraphics.fillRect(x, 12 - height, width, height);
    }

    // Add small dirt base
    grassGraphics.fillStyle(0x8b7355);
    grassGraphics.fillEllipse(6, 11, 8, 3);

    grassGraphics.generateTexture('grass-tuft', 12, 12);
    grassGraphics.destroy();
  };

  SceneClass.prototype.createShrubSprite = function () {
    const shrubGraphics = this.add.graphics();

    // Create leafy shrub (slightly larger)
    shrubGraphics.fillStyle(0x2d5016); // Dark green
    shrubGraphics.fillCircle(10, 8, 8); // Main bush body (increased from 6 to 8)

    // Add lighter green highlights
    shrubGraphics.fillStyle(0x4a7c4a);
    shrubGraphics.fillCircle(7, 6, 4); // Increased from 3 to 4
    shrubGraphics.fillCircle(13, 9, 3.5); // Increased from 2.5 to 3.5

    // Add small brown stem/base
    shrubGraphics.fillStyle(0x8b4513);
    shrubGraphics.fillRect(9, 14, 2, 4); // Adjusted position

    // Add dirt around base
    shrubGraphics.fillStyle(0x8b7355);
    shrubGraphics.fillEllipse(10, 17, 8, 2); // Adjusted position

    shrubGraphics.generateTexture('shrub', 20, 18); // Increased size from 16x14 to 20x18
    shrubGraphics.destroy();

    // Create burnt shrub version
    const burntGraphics = this.add.graphics();

    // Burnt black/grey shrub
    burntGraphics.fillStyle(0x2a2a2a); // Dark grey
    burntGraphics.fillCircle(10, 8, 7); // Smaller burnt body (increased from 5 to 7)

    // Add some ash highlights
    burntGraphics.fillStyle(0x404040);
    burntGraphics.fillCircle(7, 6, 3); // Increased from 2 to 3
    burntGraphics.fillCircle(12, 9, 2.5); // Increased from 1.5 to 2.5

    // Black burnt stem
    burntGraphics.fillStyle(0x1a1a1a);
    burntGraphics.fillRect(9, 14, 2, 4);

    // Ash around base
    burntGraphics.fillStyle(0x5a5a5a);
    burntGraphics.fillEllipse(10, 17, 8, 2);

    burntGraphics.generateTexture('shrub-burnt', 20, 18); // Increased size from 16x14 to 20x18
    burntGraphics.destroy();
  };

  SceneClass.prototype.createKingsAndAlcoves = function () {
    // Create blue alcove (left side)
    const blueAlcove = this.add.rectangle(30, 300, 60, 200, 0x2c3e50);
    blueAlcove.setStrokeStyle(2, 0x3498db);

    // Create physics-enabled blue alcove walls for laser collision
    this.blueAlcoveWalls = this.physics.add.staticGroup();
    const blueWallLeft = this.physics.add.staticSprite(0, 300, null);
    blueWallLeft.body.setSize(4, 200);
    blueWallLeft.setVisible(false);
    blueWallLeft.alcoveTeam = 'blue';
    this.blueAlcoveWalls.add(blueWallLeft);

    const blueWallRight = this.physics.add.staticSprite(60, 300, null);
    blueWallRight.body.setSize(4, 200);
    blueWallRight.setVisible(false);
    blueWallRight.alcoveTeam = 'blue';
    this.blueAlcoveWalls.add(blueWallRight);

    const blueWallTop = this.physics.add.staticSprite(30, 200, null);
    blueWallTop.body.setSize(60, 4);
    blueWallTop.setVisible(false);
    blueWallTop.alcoveTeam = 'blue';
    this.blueAlcoveWalls.add(blueWallTop);

    const blueWallBottom = this.physics.add.staticSprite(30, 400, null);
    blueWallBottom.body.setSize(60, 4);
    blueWallBottom.setVisible(false);
    blueWallBottom.alcoveTeam = 'blue';
    this.blueAlcoveWalls.add(blueWallBottom);

    // Create blue king using King class
    this.blueKing = this.createKing(30, 280, 'blue');

    // Create blue flag with team number (moved to top of alcove)
    this.blueFlag = this.add.sprite(30, 210, 'flag-blue');
    this.blueFlag.team = 'blue';

    // Add team number to flag (perfectly centered within flag banner)
    this.blueNumberText = this.add
      .text(35.5, 210.5, userSettings.blueTeamNumber.toString(), {
        fontSize: '16px',
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5);

    // Create red alcove (right side)
    const redAlcove = this.add.rectangle(770, 300, 60, 200, 0x2c3e50);
    redAlcove.setStrokeStyle(2, 0xe74c3c);

    // Create physics-enabled red alcove walls for laser collision
    this.redAlcoveWalls = this.physics.add.staticGroup();
    const redWallLeft = this.physics.add.staticSprite(740, 300, null);
    redWallLeft.body.setSize(4, 200);
    redWallLeft.setVisible(false);
    redWallLeft.alcoveTeam = 'red';
    this.redAlcoveWalls.add(redWallLeft);

    const redWallRight = this.physics.add.staticSprite(800, 300, null);
    redWallRight.body.setSize(4, 200);
    redWallRight.setVisible(false);
    redWallRight.alcoveTeam = 'red';
    this.redAlcoveWalls.add(redWallRight);

    const redWallTop = this.physics.add.staticSprite(770, 200, null);
    redWallTop.body.setSize(60, 4);
    redWallTop.setVisible(false);
    redWallTop.alcoveTeam = 'red';
    this.redAlcoveWalls.add(redWallTop);

    const redWallBottom = this.physics.add.staticSprite(770, 400, null);
    redWallBottom.body.setSize(60, 4);
    redWallBottom.setVisible(false);
    redWallBottom.alcoveTeam = 'red';
    this.redAlcoveWalls.add(redWallBottom);

    // Create red king using King class
    this.redKing = this.createKing(770, 280, 'red');

    // Create red flag with team number (moved to top of alcove)
    this.redFlag = this.add.sprite(770, 210, 'flag-red');
    this.redFlag.team = 'red';

    // Add team number to flag (perfectly centered within flag banner)
    this.redNumberText = this.add
      .text(764.5, 210.5, userSettings.redTeamNumber.toString(), {
        fontSize: '16px',
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5);
  };

  SceneClass.prototype.createTerrain = function () {
    this.terrain = [];

    // Generate random terrain layout
    this.generateRandomTerrain();
  };

  SceneClass.prototype.generateRandomTerrain = function () {
    // Define safe zones (avoid spawning terrain here)
    const safeZones = [
      { x: 30, y: 300, radius: 80 }, // Blue king alcove
      { x: 770, y: 300, radius: 80 }, // Red king alcove
      { x: 150, y: 300, radius: 60 }, // Blue spawn area
      { x: 650, y: 300, radius: 60 }, // Red spawn area
    ];

    // Generate 10-15 random terrain pieces (increased by ~20% from 8-12)
    const terrainCount = 10 + Math.floor(Math.random() * 6);
    const attempts = terrainCount * 3; // Try multiple times to place each piece

    for (let i = 0; i < attempts && this.terrain.length < terrainCount; i++) {
      // Random position in playable area
      const x = 120 + Math.random() * 560; // Stay away from edges
      const y = 80 + Math.random() * 440;

      // Check if position is in a safe zone
      let inSafeZone = false;
      for (const zone of safeZones) {
        const distance = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
        if (distance < zone.radius) {
          inSafeZone = true;
          break;
        }
      }

      // Check if too close to existing terrain
      let tooClose = false;
      for (const terrain of this.terrain) {
        const distance = Math.sqrt((x - terrain.x) ** 2 + (y - terrain.y) ** 2);
        if (distance < 80) {
          // Minimum distance between terrain pieces
          tooClose = true;
          break;
        }
      }

      if (!inSafeZone && !tooClose) {
        this.createTerrainPiece(x, y);
      }
    }

    console.log(`Generated ${this.terrain.length} terrain pieces`);
  };

  SceneClass.prototype.createBackgroundDecorations = function () {
    // Clear any existing decorations
    this.backgroundDecorations = [];

    // Define safe zones (avoid spawning decorations here)
    const safeZones = [
      { x: 30, y: 300, radius: 100 }, // Blue king alcove (larger)
      { x: 770, y: 300, radius: 100 }, // Red king alcove (larger)
      { x: 150, y: 300, radius: 80 }, // Blue spawn area
      { x: 650, y: 300, radius: 80 }, // Red spawn area
    ];

    // Generate grass tufts (decorative only)
    this.generateGrassTufts(safeZones);

    // Generate shrubs (can be burned by fireballs)
    this.generateShrubs(safeZones);

    // Add strategic shrubs near king alcoves
    SpriteGenerator.createStrategicAlcoveShrubs(this);

    console.log(`Generated ${this.backgroundDecorations.length} background decorations`);
  };

  SceneClass.prototype.generateGrassTufts = function (safeZones) {
    // Generate 40-60 grass tufts scattered across the battlefield (increased from 25-35)
    const grassCount = 40 + Math.floor(Math.random() * 21);

    for (let i = 0; i < grassCount; i++) {
      // Random position across battlefield
      const x = 60 + Math.random() * 680;
      const y = 60 + Math.random() * 480;

      // Check if position is in a safe zone
      let inSafeZone = false;
      for (const zone of safeZones) {
        const distance = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
        if (distance < zone.radius) {
          inSafeZone = true;
          break;
        }
      }

      // Check if too close to terrain
      let tooCloseToTerrain = false;
      for (const terrain of this.terrain) {
        const distance = Math.sqrt((x - terrain.x) ** 2 + (y - terrain.y) ** 2);
        if (distance < 30) {
          tooCloseToTerrain = true;
          break;
        }
      }

      if (!inSafeZone && !tooCloseToTerrain) {
        // Create grass tuft
        const grassTuft = this.add.sprite(x, y, 'grass-tuft');
        grassTuft.setDepth(-1); // Behind everything
        grassTuft.decorationType = 'grass';
        grassTuft.setScale(0.8 + Math.random() * 0.4); // Vary size
        // No rotation - grass points upward for visual clarity

        this.backgroundDecorations.push(grassTuft);
      }
    }
  };

  SceneClass.prototype.generateShrubs = function (safeZones) {
    // Generate 15-25 shrubs that can be burned (increased from 8-12)
    const shrubCount = 15 + Math.floor(Math.random() * 11);

    for (let i = 0; i < shrubCount; i++) {
      // Random position across battlefield
      const x = 80 + Math.random() * 640;
      const y = 80 + Math.random() * 440;

      // Check if position is in a safe zone
      let inSafeZone = false;
      for (const zone of safeZones) {
        const distance = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
        if (distance < zone.radius) {
          inSafeZone = true;
          break;
        }
      }

      // Check if too close to terrain or other shrubs
      let tooClose = false;
      for (const terrain of this.terrain) {
        const distance = Math.sqrt((x - terrain.x) ** 2 + (y - terrain.y) ** 2);
        if (distance < 50) {
          tooClose = true;
          break;
        }
      }

      // Check distance to existing shrubs
      for (const decoration of this.backgroundDecorations) {
        if (decoration.decorationType === 'shrub') {
          const distance = Math.sqrt((x - decoration.x) ** 2 + (y - decoration.y) ** 2);
          if (distance < 60) {
            tooClose = true;
            break;
          }
        }
      }

      if (!inSafeZone && !tooClose) {
        // Create shrub
        const shrub = this.add.sprite(x, y, 'shrub');
        shrub.setDepth(-0.5); // Behind units but in front of grass
        shrub.decorationType = 'shrub';
        shrub.burnt = false;
        shrub.setScale(0.9 + Math.random() * 0.2); // Slight size variation

        this.backgroundDecorations.push(shrub);
      }
    }
  };

  SceneClass.prototype.createTerrainPiece = function (x, y) {
    // Randomly choose terrain type - favor blocks heavily
    const terrainTypes = [
      { type: 'rock', weight: 2 }, // Reduced from 4
      { type: 'tree', weight: 3 }, // Same
      { type: 'block', weight: 8 }, // Increased from 2 to 8
    ];

    // Weighted random selection
    const totalWeight = terrainTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedType = terrainTypes[0];
    for (const type of terrainTypes) {
      random -= type.weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }

    if (selectedType.type === 'rock') {
      // Create multi-chunk rock
      new Rock(this, x, y);
    } else if (selectedType.type === 'tree') {
      // Create tree (simple single sprite)
      const terrain = this.physics.add.staticSprite(x, y, 'terrain-tree');
      terrain.body.setSize(8, 8);
      terrain.body.setOffset(14, 52); // Offset to trunk position
      terrain.setImmovable(true);
      terrain.terrainType = 'terrain-tree';
      this.terrain.push(terrain);
    } else {
      // Create multi-chunk block
      new Block(this, x, y);

      // 60% chance to create a paired block nearby
      if (Math.random() < 0.6) {
        this.tryCreateBlockPair(x, y);
      }
    }
  };

  SceneClass.prototype.createBloodStain = function (x, y) {
    // Create persistent blood stain at death location with dynamic decay system
    const bloodStain = new Bloodstain(this, x, y);

    // Add to blood stains array for tracking
    this.bloodStains.push(bloodStain);
  };

  SceneClass.prototype.tryCreateBlockPair = function (originalX, originalY) {
    // Try to place a second block near the first one
    const pairDistances = [60, 80, 100]; // Possible distances
    const pairAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // Cardinal directions

    // Shuffle angles for random direction preference
    const shuffledAngles = pairAngles.sort(() => Math.random() - 0.5);

    for (const angle of shuffledAngles) {
      for (const distance of pairDistances) {
        const pairX = originalX + Math.cos(angle) * distance;
        const pairY = originalY + Math.sin(angle) * distance;

        // Check bounds
        if (pairX < 120 || pairX > 680 || pairY < 80 || pairY > 520) continue;

        // Check if position is valid (not in safe zones, not too close to existing terrain)
        if (this.isValidTerrainPosition(pairX, pairY)) {
          console.log(`Creating block pair at (${pairX}, ${pairY})`);
          new Block(this, pairX, pairY);
          return; // Only create one pair
        }
      }
    }

    console.log('Could not find valid position for block pair');
  };
}
