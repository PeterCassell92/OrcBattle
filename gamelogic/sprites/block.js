export class Block {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.terrainType = 'terrain-block';
        this.chunks = [];
        this.destroyed = false;

        // Create 4-6 block chunks in a grid formation
        const numChunks = 4 + Math.floor(Math.random() * 3); // 4-6 chunks
        this.createBlockChunks(numChunks);

        // Random scale for the whole block
        this.scale = 0.8 + Math.random() * 0.4;

        // Add this block to the scene's terrain array
        scene.terrain.push(this);
    }

    createBlockChunks(numChunks) {
        // Define chunk positions in a tight grid pattern (no gaps)
        // Each chunk is 24x24, so positions are multiples of 12 to create seamless edges
        const chunkPositions = [
            { x: -12, y: -12 }, // top-left
            { x: 12, y: -12 }, // top-right
            { x: -12, y: 12 }, // bottom-left
            { x: 12, y: 12 }, // bottom-right
            { x: 0, y: -12 }, // top-center
            { x: 0, y: 12 }, // bottom-center
            { x: -12, y: 0 }, // left-center
            { x: 12, y: 0 }, // right-center
        ];

        // Always include the four corners for a solid 2x2 base
        this.createChunk(this.x - 12, this.y - 12, 0); // top-left
        this.createChunk(this.x + 12, this.y - 12, 1); // top-right
        this.createChunk(this.x - 12, this.y + 12, 2); // bottom-left
        this.createChunk(this.x + 12, this.y + 12, 3); // bottom-right

        // Add additional chunks if needed to expand the block
        const additionalPositions = chunkPositions.slice(4);
        const shuffled = additionalPositions.sort(() => Math.random() - 0.5);
        for (let i = 0; i < numChunks - 4 && i < shuffled.length; i++) {
            const pos = shuffled[i];
            this.createChunk(this.x + pos.x, this.y + pos.y, i + 4);
        }
    }

    createChunk(x, y, index) {
        const chunk = this.scene.physics.add.staticSprite(x, y, 'terrain-block-chunk');
        chunk.setImmovable(true);
        chunk.body.setSize(24, 24); // Full chunk collision
        chunk.blockParent = this;
        chunk.chunkIndex = index;
        chunk.terrainType = 'terrain-block-chunk';

        // Apply the block's scale to the chunk
        chunk.setScale(this.scale);

        this.chunks.push(chunk);

        // Add to terrain group if it exists, otherwise it will be added later
        if (this.scene.terrainGroup) {
            this.scene.terrainGroup.add(chunk);
        }
    }

    destroyChunk(targetChunk) {
        // Create destruction effect (concrete/stone particles)
        const particles = [];
        for (let i = 0; i < 4; i++) {
            const particle = this.scene.add.rectangle(
                targetChunk.x + (Math.random() - 0.5) * 20,
                targetChunk.y + (Math.random() - 0.5) * 20,
                3 + Math.random() * 3,
                3 + Math.random() * 3,
                0x7f8c8d
            );
            particles.push(particle);

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 80,
                y: particle.y + (Math.random() - 0.5) * 80,
                alpha: 0,
                rotation: Math.random() * Math.PI * 2,
                duration: 1000,
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

        // Check if block is completely destroyed
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
        console.log('Block completely destroyed');
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
