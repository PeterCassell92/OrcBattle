export class Rock {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.terrainType = 'terrain-rock';
        this.chunks = [];
        this.destroyed = false;

        // Create 4-7 rock chunks in a clustered formation (increased from 3-5)
        const numChunks = 4 + Math.floor(Math.random() * 4); // 4-7 chunks
        this.createRockChunks(numChunks);

        // Add this rock to the scene's terrain array
        scene.terrain.push(this);
    }

    createRockChunks(numChunks) {
        // Define possible chunk positions relative to center (expanded for larger rocks)
        const chunkPositions = [
            { x: 0, y: 0 }, // center
            { x: -25, y: -20 }, // top-left (increased distances)
            { x: 25, y: -20 }, // top-right
            { x: -25, y: 20 }, // bottom-left
            { x: 25, y: 20 }, // bottom-right
            { x: 0, y: -25 }, // top
            { x: 0, y: 25 }, // bottom
            { x: -30, y: 0 }, // left (expanded)
            { x: 30, y: 0 }, // right
            { x: -15, y: -15 }, // intermediate positions
            { x: 15, y: -15 },
            { x: -15, y: 15 },
            { x: 15, y: 15 },
        ];

        // Always include center chunk
        this.createChunk(this.x, this.y, 0);

        // Add random additional chunks
        const shuffled = chunkPositions.slice(1).sort(() => Math.random() - 0.5);
        for (let i = 0; i < numChunks - 1; i++) {
            const pos = shuffled[i];
            this.createChunk(this.x + pos.x, this.y + pos.y, i + 1);
        }
    }

    createChunk(x, y, index) {
        const chunk = this.scene.physics.add.staticSprite(x, y, 'terrain-rock-chunk');
        chunk.setImmovable(true);
        chunk.body.setSize(22, 22); // Increased from 18x18 to 22x22
        chunk.rockParent = this;
        chunk.chunkIndex = index;
        chunk.terrainType = 'terrain-rock-chunk';

        // Random scale for variety (slightly larger range)
        const scale = 0.8 + Math.random() * 0.5; // Increased from 0.4 to 0.5
        chunk.setScale(scale);

        this.chunks.push(chunk);

        // Add to terrain group if it exists, otherwise it will be added later
        if (this.scene.terrainGroup) {
            this.scene.terrainGroup.add(chunk);
        }
    }

    destroyChunk(targetChunk) {
        // Create destruction effect
        const particles = [];
        for (let i = 0; i < 3; i++) {
            const particle = this.scene.add.circle(
                targetChunk.x + (Math.random() - 0.5) * 20,
                targetChunk.y + (Math.random() - 0.5) * 20,
                2 + Math.random() * 3,
                0x888888
            );
            particles.push(particle);

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 60,
                y: particle.y + (Math.random() - 0.5) * 60,
                alpha: 0,
                duration: 800,
                onComplete: () => particle.destroy(),
            });
        }

        // Remove chunk from physics group
        if (this.scene.terrainGroup) {
            this.scene.terrainGroup.remove(targetChunk);
        }

        // Remove chunk from arrays
        this.chunks = this.chunks.filter(c => c !== targetChunk);

        // Destroy the chunk sprite
        targetChunk.destroy();

        // Check if rock is completely destroyed
        if (this.chunks.length === 0) {
            this.destroy();
        }
    }

    // Method to get bounds for line of sight calculations
    getBounds() {
        if (this.chunks.length === 0) return null;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        this.chunks.forEach(chunk => {
            const bounds = chunk.getBounds();
            minX = Math.min(minX, bounds.x);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            minY = Math.min(minY, bounds.y);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });

        return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    destroy() {
        console.log('Rock completely destroyed');
        this.destroyed = true;

        // Remove from scene's terrain array
        this.scene.terrain = this.scene.terrain.filter(t => t !== this);

        // Clean up any remaining chunks
        this.chunks.forEach(chunk => {
            if (this.scene.terrainGroup) {
                this.scene.terrainGroup.remove(chunk);
            }
            chunk.destroy();
        });
        this.chunks = [];
    }
}
