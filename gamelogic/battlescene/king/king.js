import { SpeechBubble } from '../../dialogUI/speechbubble.js';
import { Fireball } from './fireball.js';

export class King extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, team) {
        // Create the sprite with the team-specific king body texture
        const bodySprite = team === 'blue' ? 'king-body-blue' : 'king-body-red';
        super(scene, x, y, bodySprite);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // Set up physics (kings are larger and don't move much)
        this.setCollideWorldBounds(true);
        this.body.setSize(36, 48); // Larger hitbox for 1.5x scale
        this.body.setOffset(-6, -12); // Center the larger hitbox
        this.setImmovable(true); // Kings don't get pushed around

        // Scale up kings to 1.5x size
        this.setScale(1.5);

        // Create head sprite
        const headSprite = team === 'blue' ? 'king-head-blue' : 'king-head-red';
        this.head = scene.add.sprite(x, y, headSprite);
        this.head.setDepth(1);
        this.head.setScale(1.8); // Increased from 1.5 to 1.8 for larger royal head

        // Basic properties
        this.team = team;
        this.alive = true;

        // Rotation and animation properties
        this.bodyRotation = 0;
        this.headRotation = 0;
        this.headTurnSpeed = 2.0; // Head turns to look at action
        this.currentTarget = null; // Who the king is looking at
        this.lastTargetScanTime = 0;
        this.targetScanInterval = 1000; // Scan for new targets every second

        // March properties
        this.marching = false; // Whether king is marching forward
        this.marchSpeed = 20; // Slow forward movement
        this.currentWaypoint = null; // Current target waypoint
        this.waypointIndex = 0; // Which waypoint we're heading to
        this.marchWaypoints = []; // Array of waypoints for zig-zag pattern

        // Fireball properties
        this.lastFireballTime = 0;
        this.fireballInterval = this.generateFireballInterval(); // Dynamic interval
        this.fireballCharging = false;
        this.fireballChargeStartTime = 0;
        this.fireballChargeDuration = this.generateChargeDuration(); // Dynamic charge time

        // Get reference to combat strip system
        this.combatStripWidth = scene.combatStripWidth || 800 / 11;

        // Dodging properties
        this.dodging = false;
        this.dodgeWaypoint = null;
        this.normalMarchSpeed = 20; // Store normal speed
        this.dodgeSpeed = 60; // Faster speed when dodging
        this.dodgeStartTime = 0;
        this.dodgeDuration = 2000; // Dodge for 2 seconds

        // Set initial facing direction
        if (team === 'blue') {
            // Blue king faces right (toward red team)
            this.bodyRotation = 0;
            this.headRotation = 0;
            this.setRotation(0);
        } else {
            // Red king faces left (toward blue team)
            this.bodyRotation = Math.PI;
            this.headRotation = Math.PI;
            this.setRotation(Math.PI);
        }

        // Create speech bubble
        this.dialog = new SpeechBubble(scene, this);

        // Pacing and command properties
        this.paceDirection = 1; // 1 for right/up, -1 for left/down
        this.paceSpeed = 15; // Slow pacing speed
        this.alcoveCenter = { x: x, y: y }; // Remember original position
        this.paceRange = 25; // How far to pace from center
        this.lastCommandTime = 0;
        this.commandInterval = 8000 + Math.random() * 4000; // 8-12 seconds between commands
        this.bodyTurnSpeed = 1.0; // Slow body turning for regal movement
        this.targetBodyRotation = this.bodyRotation; // Target rotation for smooth turning

        // Command arrays based on situation
        this.normalCommands = [
            'Attack!',
            'Advance!',
            'Hold the line!',
            'For victory!',
            'Charge them!',
            'Stand firm!',
            'Push forward!',
            'Show no mercy!',
        ];

        this.desperateCommands = [
            'Save us!',
            'Fight harder!',
            "Don't give up!",
            'We must not fall!',
            'Defend me!',
            'Rally to me!',
            'Turn the tide!',
            'All is not lost!',
        ];

        // Initial sync
        this.syncSprites();
    }

    generateFireballInterval() {
        // More varied timing: 0.5 to 4.5 seconds (was 3-5)
        return 500 + Math.random() * 4000;
    }

    generateChargeDuration() {
        // Varied charge times: 0.5 to 2 seconds (was fixed 2)
        return 500 + Math.random() * 1500;
    }

    move(x, y) {
        // Check flag area restrictions before moving
        const adjustedPos = this.checkFlagAreaRestrictions(x, y);

        // Move the main body
        this.setPosition(adjustedPos.x, adjustedPos.y);

        // Sync all related sprites
        this.syncSprites();
    }

    checkFlagAreaRestrictions(x, y) {
        // Define flag areas for both teams
        const blueAlcoveCenter = { x: 30, y: 300 };
        const redAlcoveCenter = { x: 770, y: 300 };
        const flagAreaHeight = 50; // Area around flags to avoid

        // Check if king is trying to enter flag area
        const inBlueFlagArea =
            x >= blueAlcoveCenter.x - 30 &&
            x <= blueAlcoveCenter.x + 30 &&
            y >= blueAlcoveCenter.y - 100 &&
            y <= blueAlcoveCenter.y - 50;
        const inRedFlagArea =
            x >= redAlcoveCenter.x - 30 &&
            x <= redAlcoveCenter.x + 30 &&
            y >= redAlcoveCenter.y - 100 &&
            y <= redAlcoveCenter.y - 50;

        // If king is trying to enter a flag area, adjust position
        if (inBlueFlagArea || inRedFlagArea) {
            // Push king away from flag area
            if (inBlueFlagArea) {
                y = Math.max(y, blueAlcoveCenter.y - 40); // Keep below flag area
            }
            if (inRedFlagArea) {
                y = Math.max(y, redAlcoveCenter.y - 40); // Keep below flag area
            }
        }

        return { x: x, y: y };
    }

    syncSprites() {
        // Sync head position and rotation (centered on body)
        if (this.head) {
            this.head.x = this.x;
            this.head.y = this.y;
            this.head.setRotation(this.headRotation);
        }

        // Update speech bubble
        if (this.dialog) {
            this.dialog.update();
        }
    }

    updateHeadAnimation(time) {
        // Only animate if king is alive
        if (!this.alive) return;

        // Handle pacing movement (unless king has been released)
        if (!this.released) {
            this.updatePacing();
        }

        // Handle command shouting
        if (!this.scene.gameOver) {
            this.updateCommandShouting(time);
        }

        // Don't do head tracking during game over
        if (this.scene.gameOver) return;

        // Scan for new targets periodically
        if (time - this.lastTargetScanTime > this.targetScanInterval) {
            this.findInterestingTarget();
            this.lastTargetScanTime = time;
        }

        // Update head rotation to look at current target
        if (this.currentTarget && this.currentTarget.active) {
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
            const headAngleDiff = Phaser.Math.Angle.Wrap(angleToTarget - this.headRotation);

            // Smoothly turn head toward target
            if (Math.abs(headAngleDiff) > 0.1) {
                this.headRotation += Math.sign(headAngleDiff) * this.headTurnSpeed * 0.016;
                this.headRotation = Phaser.Math.Angle.Wrap(this.headRotation);
            }
        } else {
            // No target, slowly return to default facing direction
            const defaultRotation = this.team === 'blue' ? 0 : Math.PI;
            const headAngleDiff = Phaser.Math.Angle.Wrap(defaultRotation - this.headRotation);

            if (Math.abs(headAngleDiff) > 0.1) {
                this.headRotation += Math.sign(headAngleDiff) * this.headTurnSpeed * 0.008; // Slower return
                this.headRotation = Phaser.Math.Angle.Wrap(this.headRotation);
            }
        }
    }

    updatePacing() {
        // Pace back and forth vertically in the alcove
        const currentDistance = Math.abs(this.y - this.alcoveCenter.y);

        // Change direction if we've reached the pace limit
        if (currentDistance >= this.paceRange) {
            this.paceDirection *= -1;

            // Set new target body rotation for the turn
            if (this.paceDirection > 0) {
                // Moving up - face up slightly
                this.targetBodyRotation = this.team === 'blue' ? -Math.PI / 6 : Math.PI + Math.PI / 6;
            } else {
                // Moving down - face down slightly
                this.targetBodyRotation = this.team === 'blue' ? Math.PI / 6 : Math.PI - Math.PI / 6;
            }
        }

        // Smoothly rotate body toward target rotation
        const bodyAngleDiff = Phaser.Math.Angle.Wrap(this.targetBodyRotation - this.bodyRotation);
        if (Math.abs(bodyAngleDiff) > 0.05) {
            this.bodyRotation += Math.sign(bodyAngleDiff) * this.bodyTurnSpeed * 0.016;
            this.bodyRotation = Phaser.Math.Angle.Wrap(this.bodyRotation);
            this.setRotation(this.bodyRotation);
        }

        // Move in the current pace direction (vertically)
        let newY = this.y + this.paceDirection * this.paceSpeed * 0.016; // 60fps delta

        // Keep within alcove bounds (roughly 200 pixels tall, centered at 300)
        const alcoveTop = this.alcoveCenter.y - 80;
        const alcoveBottom = this.alcoveCenter.y + 80;
        newY = Math.max(alcoveTop, Math.min(alcoveBottom, newY));

        // Prevent kings from wandering into flag area (top portion of alcove)
        const flagAreaTop = this.alcoveCenter.y - 90; // Flag area boundary
        newY = Math.max(flagAreaTop + 10, newY); // Keep king 10 pixels below flag area

        // Apply the movement
        this.setPosition(this.x, newY);
    }

    updateCommandShouting(time) {
        // Check if it's time to shout a command
        if (time - this.lastCommandTime < this.commandInterval) return;

        // Only shout commands if there are active orcs to command
        const myOrcs = this.team === 'blue' ? this.scene.blueOrcs : this.scene.redOrcs;
        const enemyOrcs = this.team === 'blue' ? this.scene.redOrcs : this.scene.blueOrcs;
        const activeMyOrcs = myOrcs.filter(orc => orc.active);
        const activeEnemyOrcs = enemyOrcs.filter(orc => orc.active);

        if (activeMyOrcs.length === 0) return; // No one to command

        // Determine if king is losing (fewer orcs than enemy)
        const isLosing = activeMyOrcs.length < activeEnemyOrcs.length;
        const orcRatio = activeEnemyOrcs.length > 0 ? activeMyOrcs.length / activeEnemyOrcs.length : 1;

        // Choose appropriate command based on situation
        let commandArray;
        if (isLosing && orcRatio < 0.7) {
            // Significantly outnumbered
            commandArray = this.desperateCommands;
        } else {
            commandArray = this.normalCommands;
        }

        // Randomly select and shout a command
        const command = commandArray[Math.floor(Math.random() * commandArray.length)];
        this.dialog.addMessage(command);

        // Set next command time (with some randomness)
        this.lastCommandTime = time;
        this.commandInterval = (isLosing ? 6000 : 10000) + Math.random() * 4000; // Desperate kings shout more often

        console.log(`${this.team} king shouts: "${command}" (${isLosing ? 'desperate' : 'confident'})`);
    }

    findInterestingTarget() {
        // Look for active orcs from both teams
        const allOrcs = [...this.scene.blueOrcs, ...this.scene.redOrcs].filter(orc => orc.active);

        if (allOrcs.length === 0) {
            this.currentTarget = null;
            return;
        }

        // Prioritize orcs that are currently firing or in combat
        let combatOrcs = allOrcs.filter(orc => {
            const timeSinceLastFire = Date.now() - orc.lastFireTime;
            return timeSinceLastFire < 2000; // Fired in last 2 seconds
        });

        // If no recent combat, look for closest orcs to the king
        if (combatOrcs.length === 0) {
            combatOrcs = allOrcs
                .sort((a, b) => {
                    const distA = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
                    const distB = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
                    return distA - distB;
                })
                .slice(0, 3); // Look at closest 3 orcs
        }

        // Randomly choose from interesting targets
        if (combatOrcs.length > 0) {
            this.currentTarget = combatOrcs[Math.floor(Math.random() * combatOrcs.length)];
        } else {
            this.currentTarget = null;
        }
    }

    tauntOpposingArmy() {
        // Only speak if king is alive and has dialog
        if (!this || !this.alive || !this.dialog) {
            console.log(`King cannot speak (dead or no dialog)`);
            return;
        }

        // Array of possible king taunts
        const kingTaunts = ['Nice try!', 'Better luck next time!', 'Such puny lasers!', 'Pathetic!'];

        // Select random taunt
        const randomTaunt = kingTaunts[Math.floor(Math.random() * kingTaunts.length)];

        // Make the king speak
        this.dialog.addMessage(randomTaunt);
    }

    findFireballTargetNearAlcove(alcoveTeam) {
        // Return a safe target position in front of the enemy alcove
        if (alcoveTeam === 'blue') {
            // Target area in front of blue alcove
            return {
                x: 150 + Math.random() * 100, // 150-250 pixels from left edge
                y: 250 + Math.random() * 100, // Spread around alcove area
            };
        } else {
            // Target area in front of red alcove
            return {
                x: 550 + Math.random() * 100, // 550-650 pixels from left edge
                y: 250 + Math.random() * 100, // Spread around alcove area
            };
        }
    }

    isFireballTargetInvalid(targetX, targetY, enemyTeam) {
        return this.scene.isLocationInEnemyAlcovesOrOOB(targetX, targetY, enemyTeam);
    }

    findNearestShrubToAlcove(alcoveTeam) {
        // Get alcove position
        const alcoveX = alcoveTeam === 'blue' ? 30 : 770;
        const alcoveY = 300;

        // Find all unburnt shrubs
        const availableShrubs = this.backgroundDecorations.filter(
            decoration => decoration.decorationType === 'shrub' && !decoration.burnt
        );

        if (availableShrubs.length === 0) {
            return null;
        }

        // Find the shrub closest to the enemy alcove
        let nearestShrub = null;
        let nearestDistance = Infinity;

        availableShrubs.forEach(shrub => {
            const distance = Phaser.Math.Distance.Between(alcoveX, alcoveY, shrub.x, shrub.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestShrub = shrub;
            }
        });

        console.log(`Found nearest shrub to ${alcoveTeam} alcove at distance ${nearestDistance.toFixed(0)}`);
        return nearestShrub;
    }

    launchFireball() {
        // Get enemy king
        const enemyKing = this.team === 'blue' ? this.scene.redKing : this.scene.blueKing;

        if (!enemyKing || !enemyKing.alive) {
            console.log(`${this.team} king has no target for fireball`);
            return;
        }

        // Calculate initial target position (always to the side of enemy king)
        const sideOffset = (Math.random() - 0.5) * 120; // Random side offset
        let targetX = enemyKing.x + sideOffset;
        let targetY = enemyKing.y + (Math.random() - 0.5) * 60;

        // Validate target position - check if it's in enemy alcove or off-screen
        if (this.isFireballTargetInvalid(targetX, targetY, enemyKing.team)) {
            console.log(`${this.team} king's fireball target is invalid, finding nearest shrub to enemy alcove`);

            // Find alternative target nearest shrub to enemy alcove
            const nearestShrub = this.scene.findNearestShrubToAlcove(enemyKing.team);

            if (nearestShrub) {
                // Target the nearest shrub with some randomness
                targetX = nearestShrub.x + (Math.random() - 0.5) * 30; // Small offset for variety
                targetY = nearestShrub.y + (Math.random() - 0.5) * 30;
                console.log(
                    `${this.team} king retargeting fireball to shrub at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`
                );
            } else {
                // Fallback: target area in front of enemy alcove
                const safeTarget = this.findFireballTargetNearAlcove(enemyKing.team);
                targetX = safeTarget.x;
                targetY = safeTarget.y;
                console.log(
                    `${this.team} king using fallback target at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`
                );
            }
        }

        function randomModifier() {
            const positivity = Math.random() > 0.5 ? 1 : -1;
            const scale = Math.random();
            return positivity * scale;
        }

        // Add random inaccurate element:
        targetX = targetX + 20 * randomModifier();
        targetY = targetY + 20 * randomModifier();

        // Notify enemy king about incoming fireball for dodging
        enemyKing.dodgeIncomingFireball(targetX, targetY);

        // Create fireball projectile
        const fireball = new Fireball(this.scene, this.x, this.y - 20);
        fireball.fireAt(targetX, targetY);

        console.log(`${this.team} king launches fireball toward ${enemyKing.team} king area!`);
    }

    //Kings know the target location of incoming fireball and get away
    dodgeIncomingFireball(fireballTargetX, fireballTargetY) {
        // Only dodge if king is marching and alive
        if (!this.marching || !this.alive || this.dodging) return;

        console.log(`${this.team} king detects incoming fireball and prepares to dodge!`);

        // Calculate dodge direction (away from fireball target)
        const dodgeAngle = Phaser.Math.Angle.Between(fireballTargetX, fireballTargetY, this.x, this.y);

        // Create dodge waypoint 80-120 pixels away from current position
        const dodgeDistance = 80 + Math.random() * 40;
        let dodgeX = this.x + Math.cos(dodgeAngle) * dodgeDistance;
        let dodgeY = this.y + Math.sin(dodgeAngle) * dodgeDistance;

        // Keep dodge waypoint within battlefield bounds
        dodgeX = Math.max(50, Math.min(750, dodgeX));
        dodgeY = Math.max(100, Math.min(500, dodgeY));

        // Ensure king doesn't dodge across center line (same boundary logic)
        const centerX = 5 * this.combatStripWidth;
        const safetyBuffer = 40;

        if (this.team === 'blue') {
            // Blue this can't dodge past center line
            dodgeX = Math.min(dodgeX, centerX - safetyBuffer);
        } else {
            // Red king can't dodge past center line
            dodgeX = Math.max(dodgeX, centerX + safetyBuffer);
        }

        // Set dodge properties
        this.dodging = true;
        this.dodgeWaypoint = { x: dodgeX, y: dodgeY };
        this.dodgeStartTime = Date.now();
        this.marchSpeed = this.dodgeSpeed; // Speed boost

        console.log(`${this.team} king dodging to (${dodgeX.toFixed(0)}, ${dodgeY.toFixed(0)}) with speed boost!`);
    }

    setMarchWaypoints() {
        // Create zig-zag waypoints for the king to march through
        this.marchWaypoints = [];

        const isBlueKing = this.team === 'blue';
        const startX = this.x;

        // Calculate the center line (combat strip 0) position
        const centerX = 5 * this.combatStripWidth; // Strip 0 is at index 5

        // Set safe boundaries - kings stop before reaching center line
        const safetyBuffer = 40; // Stay 40 pixels away from center
        const endX = isBlueKing
            ? Math.min(650, centerX - safetyBuffer) // Blue king stops before center
            : Math.max(150, centerX + safetyBuffer); // Red king stops before center

        console.log(`${this.team} king march boundaries: start=${startX}, end=${endX}, center=${centerX}`);

        // Create waypoints in alternating combat strips
        const totalDistance = Math.abs(endX - startX);
        const stepSize = 80; // Distance between waypoints
        const steps = Math.floor(totalDistance / stepSize);

        let currentX = startX;
        let zigzagUp = true; // Start by going up

        for (let i = 0; i < steps; i++) {
            // Move forward
            currentX += isBlueKing ? stepSize : -stepSize;

            // Ensure we don't cross the boundary
            if (isBlueKing) {
                currentX = Math.min(currentX, endX);
            } else {
                currentX = Math.max(currentX, endX);
            }

            // Zig-zag vertically
            const baseY = 300; // Center of battlefield
            const zigzagAmount = 60; // How far up/down to zig-zag
            const targetY = baseY + (zigzagUp ? -zigzagAmount : zigzagAmount);

            this.marchWaypoints.push({
                x: currentX,
                y: targetY,
                combatStrip: Math.floor(currentX / this.combatStripWidth) - 5,
            });

            // Alternate zig-zag direction
            zigzagUp = !zigzagUp;

            // Stop if we've reached the boundary
            if ((isBlueKing && currentX >= endX) || (!isBlueKing && currentX <= endX)) {
                break;
            }
        }

        // Start with first waypoint
        this.waypointIndex = 0;
        this.currentWaypoint = this.marchWaypoints[0];

        console.log(`${this.team} king march waypoints created: ${this.marchWaypoints.length} waypoints`);
        console.log(
            `${this.team} king final waypoint at x=${this.marchWaypoints[this.marchWaypoints.length - 1]?.x || 'none'}`
        );
    }

    updateKingMarch(time) {
        // Safety check: ensure king still exists and is valid
        if (!this || !this.active || !this.body) {
            console.error(`${this?.team || 'unknown'} king is invalid or has no body during march!`);
            if (this) {
                console.error(`King state: active=${this.active}, body=${!!this.body}, visible=${this.visible}`);
            }
            return;
        }

        // Don't march during game over or victory celebration
        if (this.scene.gameOver || !this.marching || !this.alive) {
            this.setVelocity(0, 0); // Ensure stopped
            return;
        }
        // Check if king should fire a fireball (only if not dodging)
        if (!this.dodging) {
            this.updateKingFireball(time);
        }

        // Handle dodging behavior
        if (this.dodging) {
            this.updateKingDodge(time);
            return; // Skip normal marching while dodging
        }

        // Normal marching behavior (only if not dodging)
        if (!this.currentWaypoint) {
            this.setVelocity(0, 0); // Stop if no waypoint
            return;
        }

        // Don't move if charging fireball
        if (this.fireballCharging) {
            this.setVelocity(0, 0); // Stop movement while charging
            return;
        }

        // Move toward current waypoint
        const distanceToWaypoint = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.currentWaypoint.x,
            this.currentWaypoint.y
        );

        if (distanceToWaypoint < 20) {
            // Reached waypoint, move to next one
            this.waypointIndex++;

            if (this.waypointIndex >= this.marchWaypoints.length) {
                // Reached end of march - this stops and holds position
                this.marching = false;
                this.currentWaypoint = null;
                this.setVelocity(0, 0); // Stop movement
                console.log(`${this.team} king completed march and holds position`);
                return;
            }

            this.currentWaypoint = this.marchWaypoints[this.waypointIndex];
            console.log(`${this.team} king moving to waypoint ${this.waypointIndex}`);
        }

        // Calculate movement toward waypoint
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.currentWaypoint.x, this.currentWaypoint.y);

        // Use physics velocity instead of direct position setting
        const velocityX = Math.cos(angle) * this.marchSpeed;
        const velocityY = Math.sin(angle) * this.marchSpeed;

        // Apply velocity for smooth physics-based movement
        this.setVelocity(velocityX, velocityY);

        // Update king's body rotation to face movement direction
        this.bodyRotation = angle;
        this.setRotation(angle);
        this.targetBodyRotation = angle;

        // Update head to face same direction as body with slight side-to-side motion
        this.updateMarchingHeadMovement(time, angle);
    }

    updateMarchingHeadMovement(time, bodyAngle) {
        // Initialize head movement properties if not already set
        if (!this.headSideMotionTime) {
            this.headSideMotionTime = 0;
            this.headSideMotionSpeed = 0.8 + Math.random() * 0.4; // 0.8-1.2 speed multiplier
            this.headSideMotionAmount = 0.1 + Math.random() * 0.1; // 0.1-0.2 radians of side motion
        }

        // Update the head motion timer
        this.headSideMotionTime += 0.016; // Assume 60fps, 16ms per frame

        // Calculate base head direction (same as body)
        const baseHeadRotation = bodyAngle;

        // Add subtle side-to-side motion using sine wave
        const sideMotion = Math.sin(this.headSideMotionTime * this.headSideMotionSpeed) * this.headSideMotionAmount;

        // Set the final head rotation
        this.headRotation = baseHeadRotation + sideMotion;

        // Ensure head rotation is wrapped properly
        this.headRotation = Phaser.Math.Angle.Wrap(this.headRotation);
    }

    updateKingDodge(time) {
        // Check if dodge duration has expired
        const currentTime = Date.now();
        if (currentTime - this.dodgeStartTime >= this.dodgeDuration) {
            // End dodge, return to normal marching
            this.endDodgeManuevre();
            return;
        }

        // Move toward dodge waypoint with increased speed
        const distanceToDodgeWaypoint = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.dodgeWaypoint.x,
            this.dodgeWaypoint.y
        );

        // If close to dodge waypoint, end dodge early
        if (distanceToDodgeWaypoint < 15) {
            this.endDodgeManuevre();
            return;
        }

        // Calculate movement toward dodge waypoint
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.dodgeWaypoint.x, this.dodgeWaypoint.y);

        // Use physics velocity for dodge movement
        const velocityX = Math.cos(angle) * this.marchSpeed; // Using boosted speed
        const velocityY = Math.sin(angle) * this.marchSpeed;

        // Apply velocity for smooth physics-based movement
        this.setVelocity(velocityX, velocityY);

        // Update king's body rotation to face dodge direction
        this.bodyRotation = angle;
        this.setRotation(angle);
        this.targetBodyRotation = angle;

        // Update head to face same direction as body during dodge
        this.updateMarchingHeadMovement(time, angle);
    }

    endDodgeManuevre() {
        console.log(`${this.team} king completed dodge maneuver, returning to march`);

        // Reset dodge properties
        this.dodging = false;
        this.dodgeWaypoint = null;
        this.marchSpeed = this.normalMarchSpeed; // Return to normal speed

        // Stop movement to prevent drift
        this.setVelocity(0, 0);

        // King continues with normal march from current position
        // The existing march logic will handle finding the next appropriate waypoint
    }

    updateKingFireball(time) {
        // Don't fire fireballs during game over or victory celebration
        if (this.scene.gameOver) return;

        // Check if it's time to start charging a fireball
        if (!this.fireballCharging && time - this.lastFireballTime > this.fireballInterval) {
            // Start fireball charge
            this.fireballCharging = true;
            this.fireballChargeStartTime = time;

            // Show charging effect
            this.createFireballChargeEffect();

            console.log(`${this.team} king begins charging fireball!`);
        }

        // Check if fireball charge is complete
        if (this.fireballCharging && time - this.fireballChargeStartTime >= this.fireballChargeDuration) {
            // Fire the fireball!
            this.launchFireball();

            // Reset fireball timing with new random values
            this.fireballCharging = false;
            this.lastFireballTime = time;
            this.fireballInterval = this.generateFireballInterval(); // New random interval
            this.fireballChargeDuration = this.generateChargeDuration(); // New random charge time

            console.log(
                `${this.team} king next fireball in ${(this.fireballInterval / 1000).toFixed(1)}s with ${(this.fireballChargeDuration / 1000).toFixed(1)}s charge`
            );
        }
    }

    createFireballChargeEffect() {
        // Safety check before creating effects
        if (!this || !this.active || !this.visible) {
            console.error(
                `Cannot create fireball charge effect - ${this?.team || 'unknown'} king is not properly active`
            );
            return;
        }

        // Create growing orange/red charging effect above king
        const chargeEffect = this.scene.add.circle(this.x, this.y - 30, 5, 0xff4500, 0.7);
        this.chargeEffect = chargeEffect;

        // Pulsing/growing animation during charge
        this.scene.tweens.add({
            targets: chargeEffect,
            radius: 20,
            alpha: 1.0,
            duration: this.fireballChargeDuration,
            ease: 'Power2.out',
            onComplete: () => {
                if (chargeEffect && chargeEffect.active) {
                    chargeEffect.destroy();
                }
                // Clear reference to prevent memory leaks
                if (this.chargeEffect === chargeEffect) {
                    this.chargeEffect = null;
                }
            },
        });

        // Add fire particles during charge
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                if (this.fireballCharging && this.alive && this.active) {
                    // Create simple fire particle for charging effect
                    const particle = this.scene.add.circle(
                        this.x + (Math.random() - 0.5) * 40,
                        this.y - 20 + (Math.random() - 0.5) * 20,
                        2 + Math.random() * 2,
                        0xff4500
                    );

                    this.scene.tweens.add({
                        targets: particle,
                        y: particle.y - 15 - Math.random() * 10,
                        x: particle.x + (Math.random() - 0.5) * 10,
                        alpha: 0,
                        scale: 0.3,
                        duration: 400 + Math.random() * 200,
                        ease: 'Power2.out',
                        onComplete: () => particle.destroy(),
                    });
                }
            }, i * 250); // Particles every 250ms during charge
        }
    }

    cleanupSprites() {
        // Destroy head sprite
        if (this.head && this.head.active) {
            this.head.destroy();
            this.head = null;
        }

        // Destroy speech bubble
        if (this.dialog) {
            this.dialog.destroy();
            this.dialog = null;
        }
    }

    destroy() {
        // Clean up all related sprites first
        this.cleanupSprites();

        // Then destroy the main sprite
        super.destroy();
    }
}
