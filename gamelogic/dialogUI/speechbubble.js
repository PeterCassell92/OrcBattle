export class SpeechBubble {
    constructor(scene, speaker) {
        this.scene = scene;
        this.speaker = speaker; // The orc or king who owns this bubble
        this.messageQueue = [];
        this.currentMessage = null;
        this.isDisplaying = false;
        this.displayStartTime = 0;
        this.messageDuration = 3000; // 3 seconds per message

        // Visual components (created when needed)
        this.bubble = null;
        this.text = null;
        this.tail = null;
    }

    addMessage(message) {
        // Only accept short messages (max 30 characters)
        if (message.length > 30) {
            message = `${message.substring(0, 27)}...`;
        }

        this.messageQueue.push(message);

        // Start displaying if not already showing a message
        if (!this.isDisplaying) {
            this.showNextMessage();
        }
    }

    showNextMessage() {
        if (this.messageQueue.length === 0) {
            this.hide();
            return;
        }

        this.currentMessage = this.messageQueue.shift();
        this.displayStartTime = Date.now();
        this.isDisplaying = true;

        this.createBubble();
    }

    createBubble() {
        // Clean up existing bubble first
        this.destroyBubble();

        // Get speaker position (from head if available, otherwise body)
        const speakerX = this.speaker.head ? this.speaker.head.x : this.speaker.x;
        const speakerY = this.speaker.head ? this.speaker.head.y : this.speaker.y;

        // Create text first to measure dimensions
        this.text = this.scene.add
            .text(0, 0, this.currentMessage, {
                fontSize: '12px',
                fill: '#000000',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: 120 },
            })
            .setOrigin(0.5);

        // Calculate bubble dimensions based on text
        const textBounds = this.text.getBounds();
        const bubbleWidth = Math.max(60, textBounds.width + 16);
        const bubbleHeight = Math.max(30, textBounds.height + 12);

        // Get optimal bubble position using smart positioning
        const optimalPosition = this.getOptimalBubblePosition(speakerX, speakerY, bubbleWidth, bubbleHeight);
        const bubbleX = optimalPosition.x;
        const bubbleY = optimalPosition.y;
        const { tailDirection } = optimalPosition;

        // Create white speech bubble background
        this.bubble = this.scene.add.graphics();
        this.bubble.fillStyle(0xffffff);
        this.bubble.lineStyle(2, 0x000000);

        // Draw rounded rectangle bubble
        this.bubble.fillRoundedRect(
            bubbleX - bubbleWidth / 2,
            bubbleY - bubbleHeight / 2,
            bubbleWidth,
            bubbleHeight,
            8
        );
        this.bubble.strokeRoundedRect(
            bubbleX - bubbleWidth / 2,
            bubbleY - bubbleHeight / 2,
            bubbleWidth,
            bubbleHeight,
            8
        );

        // Create speech bubble tail pointing to speaker
        this.createBubbleTail(bubbleX, bubbleY, bubbleWidth, bubbleHeight, speakerX, speakerY, tailDirection);

        // Position text in center of bubble
        this.text.setPosition(bubbleX, bubbleY);

        // Set proper depth so bubble appears above everything
        this.bubble.setDepth(10);
        this.tail.setDepth(10);
        this.text.setDepth(11);
    }

    getOptimalBubblePosition(speakerX, speakerY, bubbleWidth, bubbleHeight) {
        // Screen boundaries (with padding)
        const screenPadding = 10;
        const screenLeft = screenPadding;
        const screenRight = 800 - screenPadding; // Game width - padding
        const screenTop = screenPadding;
        const screenBottom = 600 - screenPadding; // Game height - padding

        // Preferred position: above speaker
        let bubbleX = speakerX;
        let bubbleY = speakerY - 40 - bubbleHeight / 2;
        let tailDirection = 'down'; // Tail points down to speaker

        // Check if bubble would go off-screen and adjust

        // Horizontal adjustments
        if (bubbleX - bubbleWidth / 2 < screenLeft) {
            bubbleX = screenLeft + bubbleWidth / 2;
        } else if (bubbleX + bubbleWidth / 2 > screenRight) {
            bubbleX = screenRight - bubbleWidth / 2;
        }

        // Vertical adjustments
        if (bubbleY - bubbleHeight / 2 < screenTop) {
            // Can't fit above, try below
            bubbleY = speakerY + 40 + bubbleHeight / 2;
            tailDirection = 'up'; // Tail points up to speaker

            // If still doesn't fit below, force it on screen
            if (bubbleY + bubbleHeight / 2 > screenBottom) {
                bubbleY = screenBottom - bubbleHeight / 2;
                // Decide tail direction based on speaker position relative to bubble
                tailDirection = speakerY < bubbleY ? 'up' : 'down';
            }
        } else if (bubbleY + bubbleHeight / 2 > screenBottom) {
            // Try to move it up to fit
            bubbleY = screenBottom - bubbleHeight / 2;
            // Decide tail direction based on speaker position relative to bubble
            tailDirection = speakerY < bubbleY ? 'up' : 'down';
        }

        // If speaker is at screen edge, try side positioning
        if (speakerX < 100) {
            // Speaker is on left edge, try positioning bubble to the right
            bubbleX = speakerX + 60;
            bubbleY = speakerY;
            tailDirection = 'left';

            // Ensure it fits horizontally
            if (bubbleX + bubbleWidth / 2 > screenRight) {
                bubbleX = screenRight - bubbleWidth / 2;
            }
        } else if (speakerX > 700) {
            // Speaker is on right edge, try positioning bubble to the left
            bubbleX = speakerX - 60;
            bubbleY = speakerY;
            tailDirection = 'right';

            // Ensure it fits horizontally
            if (bubbleX - bubbleWidth / 2 < screenLeft) {
                bubbleX = screenLeft + bubbleWidth / 2;
            }
        }

        // Final vertical check for side positioning
        if (tailDirection === 'left' || tailDirection === 'right') {
            if (bubbleY - bubbleHeight / 2 < screenTop) {
                bubbleY = screenTop + bubbleHeight / 2;
            } else if (bubbleY + bubbleHeight / 2 > screenBottom) {
                bubbleY = screenBottom - bubbleHeight / 2;
            }
        }

        return {
            x: bubbleX,
            y: bubbleY,
            tailDirection,
        };
    }

    createBubbleTail(bubbleX, bubbleY, bubbleWidth, bubbleHeight, speakerX, speakerY, tailDirection) {
        this.tail = this.scene.add.graphics();
        this.tail.fillStyle(0xffffff);
        this.tail.lineStyle(2, 0x000000);

        const tailSize = 8;
        let tailX;
        let tailY;

        switch (tailDirection) {
            case 'down':
                // Tail points down from bottom of bubble
                tailX = Math.max(
                    bubbleX - bubbleWidth / 2 + tailSize,
                    Math.min(bubbleX + bubbleWidth / 2 - tailSize, speakerX)
                );
                tailY = bubbleY + bubbleHeight / 2;
                this.tail.beginPath();
                this.tail.moveTo(tailX - tailSize, tailY);
                this.tail.lineTo(tailX + tailSize, tailY);
                this.tail.lineTo(tailX, tailY + tailSize);
                this.tail.closePath();
                break;

            case 'up':
                // Tail points up from top of bubble
                tailX = Math.max(
                    bubbleX - bubbleWidth / 2 + tailSize,
                    Math.min(bubbleX + bubbleWidth / 2 - tailSize, speakerX)
                );
                tailY = bubbleY - bubbleHeight / 2;
                this.tail.beginPath();
                this.tail.moveTo(tailX - tailSize, tailY);
                this.tail.lineTo(tailX + tailSize, tailY);
                this.tail.lineTo(tailX, tailY - tailSize);
                this.tail.closePath();
                break;

            case 'left':
                // Tail points left from left side of bubble
                tailX = bubbleX - bubbleWidth / 2;
                tailY = Math.max(
                    bubbleY - bubbleHeight / 2 + tailSize,
                    Math.min(bubbleY + bubbleHeight / 2 - tailSize, speakerY)
                );
                this.tail.beginPath();
                this.tail.moveTo(tailX, tailY - tailSize);
                this.tail.lineTo(tailX, tailY + tailSize);
                this.tail.lineTo(tailX - tailSize, tailY);
                this.tail.closePath();
                break;

            case 'right':
                // Tail points right from right side of bubble
                tailX = bubbleX + bubbleWidth / 2;
                tailY = Math.max(
                    bubbleY - bubbleHeight / 2 + tailSize,
                    Math.min(bubbleY + bubbleHeight / 2 - tailSize, speakerY)
                );
                this.tail.beginPath();
                this.tail.moveTo(tailX, tailY - tailSize);
                this.tail.lineTo(tailX, tailY + tailSize);
                this.tail.lineTo(tailX + tailSize, tailY);
                this.tail.closePath();
                break;

            default:
                break;
        }

        this.tail.fillPath();
        this.tail.strokePath();
    }

    update() {
        if (!this.isDisplaying) return;

        // Check if current message should expire
        const elapsed = Date.now() - this.displayStartTime;
        if (elapsed >= this.messageDuration) {
            this.showNextMessage(); // This will show next message or hide if queue empty
        } else {
            // Update bubble position to follow speaker
            this.updatePosition();
        }
    }

    updatePosition() {
        if (!this.bubble || !this.speaker) return;

        // Get current speaker position
        const speakerX = this.speaker.head ? this.speaker.head.x : this.speaker.x;
        const speakerY = this.speaker.head ? this.speaker.head.y : this.speaker.y;

        // Get current bubble dimensions from text
        const textBounds = this.text.getBounds();
        const bubbleWidth = Math.max(60, textBounds.width + 16);
        const bubbleHeight = Math.max(30, textBounds.height + 12);

        // Calculate optimal position using smart positioning
        const optimalPosition = this.getOptimalBubblePosition(speakerX, speakerY, bubbleWidth, bubbleHeight);

        const newBubbleX = optimalPosition.x;
        const newBubbleY = optimalPosition.y;
        const { tailDirection } = optimalPosition;

        // Only update if position has changed significantly
        const deltaX = newBubbleX - this.text.x;
        const deltaY = newBubbleY - this.text.y;

        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            // Recreate the entire bubble with new position and tail direction
            // This is more reliable than trying to move individual graphics components
            this.createBubble();
        }
    }

    hide() {
        this.isDisplaying = false;
        this.currentMessage = null;
        this.destroyBubble();
    }

    destroyBubble() {
        if (this.bubble) {
            this.bubble.destroy();
            this.bubble = null;
        }
        if (this.tail) {
            this.tail.destroy();
            this.tail = null;
        }
        if (this.text) {
            this.text.destroy();
            this.text = null;
        }
    }

    destroy() {
        this.hide();
        this.messageQueue = [];
        this.speaker = null;
        this.scene = null;
    }
}
