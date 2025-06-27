// gamelogic/sprites.js - Sprite generation class

export class SpriteGenerator {
    // Remove orc sprite generation - now using external images
    // Keep only terrain generation methods

    static createAllKingSprites(scene) {
        const generator = new SpriteGenerator(scene);
        generator.createKingSprites();
    }

    static createAllFlagSprites(scene) {
        const generator = new SpriteGenerator(scene);
        generator.createFlagSprites();
    }

    static createAllTerrainSprites(scene) {
        const generator = new SpriteGenerator(scene);
        generator.createTerrainSprites();
    }

    static createAllDecorationSprites(scene) {
        const generator = new SpriteGenerator(scene);
        generator.createDecorationSprites();
    }

    constructor(scene) {
        this.scene = scene;
    }

    createFlagSprites() {
        // Create blue flag (larger flag dimensions)
        const blueFlagGraphics = this.scene.add.graphics();
        blueFlagGraphics.fillStyle(0x654321); // Brown pole
        blueFlagGraphics.fillRect(12, 0, 6, 50); // Slightly thicker and taller pole
        blueFlagGraphics.fillStyle(0x3498db); // Blue flag
        blueFlagGraphics.fillRect(18, 8, 35, 25); // Larger flag: 35x25 instead of 20x15
        blueFlagGraphics.generateTexture('flag-blue', 53, 50); // Larger total dimensions
        blueFlagGraphics.destroy();

        // Create red flag (larger flag dimensions)
        const redFlagGraphics = this.scene.add.graphics();
        redFlagGraphics.fillStyle(0x654321); // Brown pole
        redFlagGraphics.fillRect(12, 0, 6, 50); // Slightly thicker and taller pole
        redFlagGraphics.fillStyle(0xe74c3c); // Red flag
        redFlagGraphics.fillRect(18, 8, 35, 25); // Larger flag: 35x25 instead of 20x15
        redFlagGraphics.generateTexture('flag-red', 53, 50); // Larger total dimensions
        redFlagGraphics.destroy();
    }

    createTerrainSprites() {
        // Create rock (large cover)
        this.createRockSprite();

        // Create tree (thin cover)
        this.createTreeSprite();

        // Create old terrain block for compatibility
        this.createTerrainBlockSprite();
    }

    createRockSprite() {
        const rockGraphics = this.scene.add.graphics();
        rockGraphics.fillStyle(0x6b6b6b); // Dark gray

        // Main rock body (irregular shape)
        rockGraphics.fillEllipse(32, 32, 50, 40);

        // Add some texture with darker patches
        rockGraphics.fillStyle(0x555555);
        rockGraphics.fillEllipse(25, 25, 15, 12);
        rockGraphics.fillEllipse(40, 35, 12, 8);

        // Add highlights
        rockGraphics.fillStyle(0x808080);
        rockGraphics.fillEllipse(20, 20, 8, 6);
        rockGraphics.fillEllipse(45, 28, 6, 4);

        rockGraphics.generateTexture('terrain-rock', 64, 64);
        rockGraphics.destroy();
    }

    createTreeSprite() {
        const treeGraphics = this.scene.add.graphics();

        // Tree trunk (brown)
        treeGraphics.fillStyle(0x8b4513);
        treeGraphics.fillRect(14, 35, 8, 25);

        // Tree canopy (green, circular)
        treeGraphics.fillStyle(0x228b22);
        treeGraphics.fillCircle(18, 30, 16);

        // Add some darker green for depth
        treeGraphics.fillStyle(0x006400);
        treeGraphics.fillCircle(15, 28, 6);
        treeGraphics.fillCircle(22, 32, 5);

        // Add some lighter green highlights
        treeGraphics.fillStyle(0x32cd32);
        treeGraphics.fillCircle(20, 25, 4);
        treeGraphics.fillCircle(12, 30, 3);

        treeGraphics.generateTexture('terrain-tree', 36, 60);
        treeGraphics.destroy();
    }

    createDecorationSprites() {
        // Create grass tuft sprite
        this.createGrassTuftSprite();

        // Create shrub sprites (normal and burnt)
        this.createShrubSprite();

        // Create rock chunk sprite for Rock class
        this.createRockChunkSprite();

        // Create block chunk sprite for Block class
        this.createBlockChunkSprite();

        // Create blood stain sprite for orc deaths
        this.createBloodStainSprite();
    }

    // Method to place strategic shrubs near king alcoves
    static createStrategicAlcoveShrubs(scene) {
        const generator = new SpriteGenerator(scene);
        generator.placeAlcoveShrubs(scene);
    }

    placeAlcoveShrubs(scene) {
        // Place 8-10 shrubs in front of blue king alcove
        this.placeShrubsNearAlcove(scene, 'blue', 30, 300);

        // Place 8-10 shrubs in front of red king alcove
        this.placeShrubsNearAlcove(scene, 'red', 770, 300);
    }

    placeShrubsNearAlcove(scene, team, alcoveX, alcoveY) {
        const shrubCount = 8 + Math.floor(Math.random() * 3); // 3-5 shrubs
        const isBlueTeam = team === 'blue';

        console.log(`Placing ${shrubCount} strategic shrubs near ${team} alcove`);

        for (let i = 0; i < shrubCount; i++) {
            // Position shrubs in front of alcove (towards battlefield center)
            const offsetX = isBlueTeam
                ? 120 + Math.random() * 80 // Blue: 120-200 pixels right of alcove
                : -200 + Math.random() * 80; // Red: 120-200 pixels left of alcove

            const offsetY = (Math.random() - 0.5) * 120; // Spread vertically

            const shrubX = alcoveX + offsetX;
            const shrubY = alcoveY + offsetY;

            // Ensure shrub is within battlefield bounds
            const finalX = Math.max(100, Math.min(700, shrubX));
            const finalY = Math.max(100, Math.min(500, shrubY));

            // Check if position conflicts with existing decorations
            let tooClose = false;
            for (const decoration of scene.backgroundDecorations) {
                if (decoration.decorationType === 'shrub') {
                    const distance = Phaser.Math.Distance.Between(finalX, finalY, decoration.x, decoration.y);
                    if (distance < 40) {
                        // Reduced distance for alcove shrubs
                        tooClose = true;
                        break;
                    }
                }
            }

            if (!tooClose) {
                // Create strategic alcove shrub
                const shrub = scene.add.sprite(finalX, finalY, 'shrub');
                shrub.setDepth(-0.5); // Behind units but in front of grass
                shrub.decorationType = 'shrub';
                shrub.burnt = false;
                shrub.strategicPlacement = true; // Mark as strategically placed
                shrub.setScale(1.0 + Math.random() * 0.3); // Slightly larger and more varied

                scene.backgroundDecorations.push(shrub);
                console.log(
                    `Strategic shrub placed at (${finalX.toFixed(0)}, ${finalY.toFixed(0)}) for ${team} alcove`
                );
            }
        }
    }

    createGrassTuftSprite() {
        const grassGraphics = this.scene.add.graphics();

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
    }

    createShrubSprite() {
        const shrubGraphics = this.scene.add.graphics();

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

        // Create burnt shrub version (also larger)
        const burntGraphics = this.scene.add.graphics();

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
    }

    createRockChunkSprite() {
        const chunkGraphics = this.scene.add.graphics();
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
    }

    createBlockChunkSprite() {
        const chunkGraphics = this.scene.add.graphics();
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
    }

    createBloodStainSprite() {
        const bloodGraphics = this.scene.add.graphics();

        // Create dark red blood stain with irregular splatter pattern
        const bloodColors = [
            0x8b0000, // Dark red
            0x660000, // Darker red
            0x4b0000, // Very dark red
        ];

        // Main blood pool (irregular shape)
        bloodGraphics.fillStyle(bloodColors[0]); // Dark red
        bloodGraphics.fillEllipse(12, 12, 16, 12); // Main pool

        // Add darker center
        bloodGraphics.fillStyle(bloodColors[1]);
        bloodGraphics.fillEllipse(11, 13, 8, 6);

        // Add very dark core
        bloodGraphics.fillStyle(bloodColors[2]);
        bloodGraphics.fillEllipse(10, 14, 4, 3);

        // Add splatter drops around the main pool
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 8 + Math.random() * 6;
            const dropX = 12 + Math.cos(angle) * distance;
            const dropY = 12 + Math.sin(angle) * distance;
            const dropSize = 1 + Math.random() * 2;

            // Use random blood color for variety
            const colorIndex = Math.floor(Math.random() * bloodColors.length);
            bloodGraphics.fillStyle(bloodColors[colorIndex]);
            bloodGraphics.fillCircle(dropX, dropY, dropSize);
        }

        // Add small spray pattern
        for (let i = 0; i < 12; i++) {
            const sprayX = 6 + Math.random() * 12;
            const sprayY = 6 + Math.random() * 12;
            const spraySize = 0.5 + Math.random() * 1;

            bloodGraphics.fillStyle(bloodColors[Math.floor(Math.random() * bloodColors.length)]);
            bloodGraphics.fillCircle(sprayX, sprayY, spraySize);
        }

        bloodGraphics.generateTexture('blood-stain', 24, 24);
        bloodGraphics.destroy();
    }

    createTerrainBlockSprite() {
        const terrainGraphics = this.scene.add.graphics();
        terrainGraphics.fillStyle(0x7f8c8d); // Gray terrain
        terrainGraphics.fillRect(0, 0, 64, 64);
        terrainGraphics.generateTexture('terrain-block', 64, 64);
        terrainGraphics.destroy();
    }

    createSwordSlashEffect(x, y, angle) {
        // Create arc-shaped slash effect
        const slash = this.scene.add.graphics();
        slash.lineStyle(3, 0xffffff, 0.8);

        // Draw arc for slash
        const startAngle = angle - Math.PI / 4;
        const endAngle = angle + Math.PI / 4;
        const radius = 25;

        slash.arc(x, y, radius, startAngle, endAngle);
        slash.strokePath();

        // Animate slash appearance and fade
        slash.setAlpha(0);
        this.scene.tweens.add({
            targets: slash,
            alpha: 1,
            duration: 50,
            yoyo: true,
            onComplete: () => slash.destroy(),
        });
    }
}
