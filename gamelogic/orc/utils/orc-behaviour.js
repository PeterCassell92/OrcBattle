// Orc AI Behaviour and combat logic

export const OrcBehaviour = {
  updateOrcAI(scene, orc, time) {
    const enemies = orc.team === 'blue' ? scene.redOrcs : scene.blueOrcs;
    const activeEnemies = enemies.filter((e) => e.active);

    if (activeEnemies.length === 0) return;

    // Always sync head position to body (even when no enemies)
    if (orc.head) {
      orc.head.x = orc.x;
      orc.head.y = orc.y;
    }

    // Sync unit info label
    if (orc.unitInfoLabel) {
      orc.unitInfoLabel.x = orc.x;
      orc.unitInfoLabel.y = orc.y - 18;
    }

    // Special behavior during berserker trio phases
    if (scene.berserkerTrioActive) {
      // Handle berserker behavior during special phases
      if (orc.berserkerCandidate || orc.type === 'berserker') {
        if (scene.berserkerPhase === 'immunity') {
          // During immunity phase, berserkers stop firing but continue normal movement
          orc.canAttack = false;
          this.updateBerserkerImmunityBehavior(scene, orc, activeEnemies, time);
          return;
        }
        if (scene.berserkerPhase === 'invisibility') {
          // During invisibility, berserkers move very fast to strategic positions
          this.updateBerserkerInvisibilityBehavior(scene, orc, activeEnemies, time);
          return;
        }
        // Berserker phase behavior is handled in normal flow below
      } else {
        // Handle enemy behavior when facing berserkers
        if (scene.berserkerPhase === 'invisibility') {
          // Enemies look around confused during invisibility phase
          this.updateEnemyDuringInvisibility(scene, orc, time);
          return;
        }
      }
    }

    // If firing is not allowed yet and this is a cover firer, do terrain scouting
    if (!scene.firingAllowed && orc.behaviour === 'cover_firer') {
      this.updateCoverFirerScouting(scene, orc, activeEnemies, time);
      return;
    }

    let closestEnemy = null;
    let closestDistance = Infinity;

    activeEnemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(orc.x, orc.y, enemy.x, enemy.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      const angleToEnemy = Phaser.Math.Angle.Between(orc.x, orc.y, closestEnemy.x, closestEnemy.y);

      // Update head rotation (for aiming)
      const headAngleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - orc.headRotation);
      if (Math.abs(headAngleDiff) > 0.1) {
        orc.headRotation += Math.sign(headAngleDiff) * orc.headTurnSpeed * 0.016;
        if (orc.head) {
          orc.head.setRotation(orc.headRotation);
        }
      }

      // Update body rotation (for movement direction) - slower
      const bodyAngleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - orc.bodyRotation);
      if (Math.abs(bodyAngleDiff) > 0.2) {
        orc.bodyRotation += Math.sign(bodyAngleDiff) * orc.bodyTurnSpeed * 0.016;
        orc.setRotation(orc.bodyRotation);
      }

      if (orc.behaviour === 'cover_firer') {
        this.updateCoverFirerAI(scene, orc, closestEnemy, closestDistance, time);
      } else if (orc.type === 'berserker') {
        // Special berserker AI for close combat positioning
        this.updateBerserkerAI(scene, orc, closestEnemy, closestDistance, time);
      } else {
        this.updateRusherAI(scene, orc, closestEnemy, closestDistance, time);
      }

      if (time - orc.lastFireTime > orc.fireRate) {
        if (Math.abs(headAngleDiff) < 0.2 && this.hasLineOfSight(scene, orc, closestEnemy)) {
          // Check if firing is allowed (after initial delay)
          if (scene.firingAllowed) {
            // Check if orc can attack (not invisible) and can use lasers (not berserker)
            if (orc.canAttack !== false && orc.canUseLaser !== false) {
              orc.fireLaser();
              orc.lastFireTime = time;
            } else if (orc.hasSwordAttack && closestDistance < 70) {
              // Berserker sword attack when close enough (increased range from 60 to 70)
              orc.performSwordAttack(closestEnemy);
              orc.lastFireTime = time;
            }
          }
        }
      }
    }
  },

  shouldTakeEvasiveAction(scene, orc, time) {
    // Don't evade too frequently
    if (orc.lastEvasionCheck && time - orc.lastEvasionCheck < 200) {
      return false;
    }
    orc.lastEvasionCheck = time;

    // Initialize evasion properties if needed
    if (!orc.evasionCooldown) orc.evasionCooldown = 1500; // 1.5 seconds between evasions
    if (!orc.lastEvasionTime) orc.lastEvasionTime = 0;

    // Check cooldown
    if (time - orc.lastEvasionTime < orc.evasionCooldown) {
      return false;
    }

    // Look for incoming lasers
    const dangerRadius = 80; // Distance to consider lasers dangerous
    const threatLasers = scene.lasers.filter((laser) => {
      if (laser.team === orc.team) return false; // Don't evade friendly fire

      const distance = Phaser.Math.Distance.Between(orc.x, orc.y, laser.x, laser.y);
      if (distance > dangerRadius) return false;

      // Check if laser is moving toward the orc
      const laserToOrc = Phaser.Math.Angle.Between(laser.x, laser.y, orc.x, orc.y);
      const laserAngle = laser.rotation;
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(laserAngle - laserToOrc));

      // Laser is considered threatening if it's aimed within 30 degrees of the orc
      return angleDiff < Math.PI / 6; // 30 degrees
    });

    // Random chance to evade even without direct threat (paranoid behavior)
    const paranoidChance = 0.15; // 15% chance per check

    return threatLasers.length > 0 || Math.random() < paranoidChance;
  },

  performEvasiveManeuver(scene, orc, enemy, time) {
    orc.lastEvasionTime = time;

    // Find the best evasive position using terrain
    const evasivePosition = this.findEvasivePosition(scene, orc, enemy);

    if (evasivePosition) {
      // Move toward cover
      const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, evasivePosition.x, evasivePosition.y);
      const moveX = Math.cos(moveAngle) * orc.moveSpeed * 1.3; // 30% faster during evasion
      const moveY = Math.sin(moveAngle) * orc.moveSpeed * 1.3;
      orc.setVelocity(moveX, moveY);

      // Update body rotation toward movement
      orc.bodyRotation = moveAngle;
      orc.setRotation(orc.bodyRotation);

      console.log(`${orc.team} rusher evading to terrain cover`);
    } else {
      // No terrain available, perform random evasive maneuver
      const evasionAngle = Math.random() * Math.PI * 2;
      const evasionSpeed = orc.moveSpeed * 1.2;
      const evasionX = Math.cos(evasionAngle) * evasionSpeed;
      const evasionY = Math.sin(evasionAngle) * evasionSpeed;
      orc.setVelocity(evasionX, evasionY);

      // console.log(`${orc.team} rusher performing random evasion`);
    }
  },

  findEvasivePosition(scene, orc, enemy) {
    if (!scene.terrain || scene.terrain.length === 0) return null;

    let bestPosition = null;
    let bestScore = -1;

    // Evaluate terrain pieces for evasive cover
    scene.terrain.forEach((terrain) => {
      // Try positions around the terrain
      const angles = [
        0,
        Math.PI / 4,
        Math.PI / 2,
        (3 * Math.PI) / 4,
        Math.PI,
        (5 * Math.PI) / 4,
        (3 * Math.PI) / 2,
        (7 * Math.PI) / 4,
      ];

      angles.forEach((angle) => {
        const testX = terrain.x + Math.cos(angle) * 60; // Closer to terrain for quick cover
        const testY = terrain.y + Math.sin(angle) * 60;

        // Check if position is valid
        if (testX < 50 || testX > 750 || testY < 50 || testY > 550) return;

        // Check distance from other terrain
        let tooCloseToOtherTerrain = false;
        for (const otherTerrain of scene.terrain) {
          if (otherTerrain === terrain) continue;
          const distance = Phaser.Math.Distance.Between(testX, testY, otherTerrain.x, otherTerrain.y);
          if (distance < 40) {
            tooCloseToOtherTerrain = true;
            break;
          }
        }
        if (tooCloseToOtherTerrain) return;

        // Score this position
        let score = 0;

        // Bonus for being close to orc (quick to reach)
        const distanceToOrc = Phaser.Math.Distance.Between(orc.x, orc.y, testX, testY);
        score += Math.max(0, 100 - distanceToOrc); // Closer is better

        // Bonus for terrain providing cover from enemy
        const terrainToEnemy = Phaser.Math.Angle.Between(terrain.x, terrain.y, enemy.x, enemy.y);
        const terrainToPosition = Phaser.Math.Angle.Between(terrain.x, terrain.y, testX, testY);
        const coverAngle = Math.abs(Phaser.Math.Angle.Wrap(terrainToEnemy - terrainToPosition));

        if (coverAngle > Math.PI / 2) {
          score += 50; // Good cover from enemy
        }

        // Bonus for not being too far from enemy (rushers want to stay engaged)
        const distanceToEnemy = Phaser.Math.Distance.Between(testX, testY, enemy.x, enemy.y);
        if (distanceToEnemy < 200) {
          score += 30;
        }

        if (score > bestScore) {
          bestScore = score;
          bestPosition = { x: testX, y: testY, terrain };
        }
      });
    });

    return bestPosition;
  },

  updateCoverFirerScouting(scene, orc, enemies, time) {
    // During the firing delay, cover firers scout for optimal terrain positions

    // If orc already has a scouted position and is moving to it, continue
    if (orc.scoutedPosition && orc.aiState === 'scouting') {
      const distance = Phaser.Math.Distance.Between(orc.x, orc.y, orc.scoutedPosition.x, orc.scoutedPosition.y);

      if (distance > 15) {
        // Move toward scouted position
        const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, orc.scoutedPosition.x, orc.scoutedPosition.y);
        const moveX = Math.cos(moveAngle) * orc.moveSpeed * 0.8; // Move slower during scouting
        const moveY = Math.sin(moveAngle) * orc.moveSpeed * 0.8;
        orc.setVelocity(moveX, moveY);

        // Turn toward movement direction
        const bodyAngleDiff = Phaser.Math.Angle.Wrap(moveAngle - orc.bodyRotation);
        if (Math.abs(bodyAngleDiff) > 0.1) {
          orc.bodyRotation += Math.sign(bodyAngleDiff) * orc.bodyTurnSpeed * 0.016;
          orc.setRotation(orc.bodyRotation);
        }
        return;
      }
      // Reached scouted position
      orc.setVelocity(0, 0);
      orc.aiState = 'in_position';
      console.log(`${orc.team} cover firer reached scouted position`);
    }

    // If no scouted position or need to find a new one, evaluate terrain
    if (!orc.scoutedPosition || orc.aiState !== 'scouting') {
      const optimalPosition = this.findOptimalCoverPosition(scene, orc, enemies);

      if (optimalPosition) {
        orc.scoutedPosition = optimalPosition;
        orc.aiState = 'scouting';
        console.log(
          `${orc.team} cover firer found terrain to scout at (${optimalPosition.x}, ${optimalPosition.y})`,
        );
      } else {
        // No good terrain found, just hold position and scan
        orc.setVelocity(0, 0);
        this.scanForEnemies(orc, enemies, time);
      }
    }
  },

  findOptimalCoverPosition(scene, orc, enemies) {
    if (!scene.terrain || scene.terrain.length === 0) return null;

    let bestPosition = null;
    let bestScore = -1;

    // Evaluate each terrain piece as potential cover
    scene.terrain.forEach((terrain) => {
      // Try multiple positions around this terrain
      const angles = [
        0,
        Math.PI / 4,
        Math.PI / 2,
        (3 * Math.PI) / 4,
        Math.PI,
        (5 * Math.PI) / 4,
        (3 * Math.PI) / 2,
        (7 * Math.PI) / 4,
      ];

      angles.forEach((angle) => {
        const testX = terrain.x + Math.cos(angle) * 70; // 70 pixels from terrain
        const testY = terrain.y + Math.sin(angle) * 70;

        // Check if position is valid (within bounds, not too close to other terrain)
        if (!this.isValidScoutPosition(scene, testX, testY, terrain)) return;

        // Calculate score for this position
        const score = this.evaluateCoverPosition(scene, orc, enemies, testX, testY, terrain);

        if (score > bestScore) {
          bestScore = score;
          bestPosition = {
            x: testX,
            y: testY,
            terrain,
            score,
          };
        }
      });
    });

    return bestPosition;
  },

  isValidScoutPosition(scene, x, y, excludeTerrain) {
    // Check bounds
    if (x < 50 || x > 750 || y < 50 || y > 550) return false;

    // Check distance from other terrain (except the one we're using for cover)
    for (const terrain of scene.terrain) {
      if (terrain === excludeTerrain) continue;
      const distance = Phaser.Math.Distance.Between(x, y, terrain.x, terrain.y);
      if (distance < 60) return false; // Too close to other terrain
    }

    // Check distance from kings/alcoves
    const blueKingDist = Phaser.Math.Distance.Between(x, y, 30, 300);
    const redKingDist = Phaser.Math.Distance.Between(x, y, 770, 300);
    if (blueKingDist < 100 || redKingDist < 100) return false;

    return true;
  },

  evaluateCoverPosition(scene, orc, enemies, testX, testY, terrain) {
    let score = 0;

    // Base score for having cover
    score += 50;

    // Bonus for line of sight to enemies from this position
    let enemiesVisible = 0;
    enemies.forEach((enemy) => {
      if (this.hasLineOfSightFromPosition(scene, testX, testY, enemy.x, enemy.y)) {
        enemiesVisible++;
        score += 25; // Bonus per visible enemy
      }
    });

    // Penalty for being too far from enemies (cover firers want range but not too much)
    const avgEnemyDistance = enemies.reduce((sum, enemy) => sum + Phaser.Math.Distance.Between(testX, testY, enemy.x, enemy.y), 0)
            / enemies.length;

    const idealRange = orc.preferredRange; // 250 for cover firers
    const rangeDifference = Math.abs(avgEnemyDistance - idealRange);
    score -= rangeDifference * 0.1; // Penalty for being outside ideal range

    // Bonus for being on the "correct" side of terrain (away from enemies)
    const terrainToEnemyAngle = this.getAverageEnemyAngle(terrain.x, terrain.y, enemies);
    const terrainToPositionAngle = Phaser.Math.Angle.Between(terrain.x, terrain.y, testX, testY);
    const angleDifference = Math.abs(Phaser.Math.Angle.Wrap(terrainToEnemyAngle - terrainToPositionAngle));

    if (angleDifference > Math.PI / 2) {
      score += 30; // Bonus for being on opposite side of terrain from enemies
    }

    // Small bonus for positions closer to orc's current location (prefer closer moves)
    const distanceFromCurrent = Phaser.Math.Distance.Between(orc.x, orc.y, testX, testY);
    score -= distanceFromCurrent * 0.05;

    return score;
  },

  hasLineOfSightFromPosition(scene, fromX, fromY, toX, toY) {
    const line = new Phaser.Geom.Line(fromX, fromY, toX, toY);

    for (const terrain of scene.terrain) {
      let bounds;
      if (terrain.chunks && terrain.chunks.length > 0) {
        // Rock or Block class with chunks
        bounds = terrain.getBounds();
        if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          return false;
        }
      } else {
        // Regular terrain sprite
        bounds = terrain.getBounds();
        if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          return false;
        }
      }
    }
    return true;
  },

  getAverageEnemyAngle(fromX, fromY, enemies) {
    if (enemies.length === 0) return 0;

    let totalX = 0;
    let totalY = 0;
    enemies.forEach((enemy) => {
      totalX += enemy.x;
      totalY += enemy.y;
    });

    const avgEnemyX = totalX / enemies.length;
    const avgEnemyY = totalY / enemies.length;

    return Phaser.Math.Angle.Between(fromX, fromY, avgEnemyX, avgEnemyY);
  },

  scanForEnemies(orc, enemies, time) {
    // If no terrain to scout, just turn head to scan for enemies
    if (enemies.length > 0) {
      const targetEnemy = enemies[Math.floor(time / 1000) % enemies.length]; // Cycle through enemies
      const angleToEnemy = Phaser.Math.Angle.Between(orc.x, orc.y, targetEnemy.x, targetEnemy.y);

      const headAngleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - orc.headRotation);
      if (Math.abs(headAngleDiff) > 0.1) {
        orc.headRotation += Math.sign(headAngleDiff) * orc.headTurnSpeed * 0.016;
        if (orc.head) {
          orc.head.setRotation(orc.headRotation);
        }
      }
    }
  },

  updateBerserkerAI(scene, orc, enemy, distance, time) {
    // Berserkers use aggressive close-combat positioning for sword attacks

    // Check if berserker should destroy terrain based on lack of sword attacks
    // If they haven't been able to use their sword for 0.7s, they get frustrated and use axe
    const timeSinceLastSwordAttack = time - orc.lastFireTime;
    const swordFrustrationThreshold = 700; // 0.7 seconds

    if (timeSinceLastSwordAttack > swordFrustrationThreshold) {
      // Berserker is frustrated from not using sword - look for terrain to destroy
      this.checkBerserkerTerrainDestruction(scene, orc, enemy, time);
      return; // Exit if we're destroying terrain
    }

    // Normal berserker positioning logic
    const optimalSwordRange = 45; // Optimal range for sword attacks (closer than the 60 hit detection)
    const engageRange = 80; // Range at which berserker starts aggressive approach

    if (distance > engageRange) {
      // Far away - charge directly at enemy at full speed
      const chargeAngle = Phaser.Math.Angle.Between(orc.x, orc.y, enemy.x, enemy.y);
      const chargeX = Math.cos(chargeAngle) * orc.moveSpeed;
      const chargeY = Math.sin(chargeAngle) * orc.moveSpeed;
      orc.setVelocity(chargeX, chargeY);

      // console.log(`${orc.team} berserker charging from distance ${distance.toFixed(1)}`);
    } else if (distance > optimalSwordRange) {
      // Close but not optimal - use smart positioning to get into sword range
      this.updateBerserkerCloseCombatPositioning(scene, orc, enemy, distance, time);
    } else {
      // Within optimal sword range - maintain position and prepare for attacks
      this.updateBerserkerOptimalRangeMovement(orc, enemy, distance, time);
    }
  },

  checkBerserkerTerrainDestruction(scene, orc, enemy, time) {
    // Berserker is frustrated from not being able to use sword - find terrain to destroy
    // console.log(`${orc.team} berserker frustrated from lack of sword attacks for ${((time - orc.lastFireTime)/1000).toFixed(1)}s`);

    // Look for terrain between berserker and enemy, or just close terrain
    const line = new Phaser.Geom.Line(orc.x, orc.y, enemy.x, enemy.y);
    let closestBlockingTerrain = null;
    let closestDistance = Infinity;

    // First, try to find terrain that's actually blocking the path to enemy
    for (const terrain of scene.terrain) {
      if (terrain.chunks && terrain.chunks.length > 0) {
        // Rock or Block class - check against overall bounds and find closest chunk
        const bounds = terrain.getBounds();
        if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          // Find closest chunk in this terrain
          let closestChunk = null;
          let closestChunkDistance = Infinity;

          for (const chunk of terrain.chunks) {
            const chunkDistance = Phaser.Math.Distance.Between(orc.x, orc.y, chunk.x, chunk.y);
            if (chunkDistance < closestChunkDistance) {
              closestChunkDistance = chunkDistance;
              closestChunk = chunk;
            }
          }

          if (closestChunk && closestChunkDistance < closestDistance) {
            closestDistance = closestChunkDistance;
            closestBlockingTerrain = closestChunk;
          }
        }
      } else {
        // Regular terrain sprite (trees or legacy terrain)
        const bounds = terrain.getBounds();
        if (Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          const distance = Phaser.Math.Distance.Between(orc.x, orc.y, terrain.x, terrain.y);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestBlockingTerrain = terrain;
          }
        }
      }
    }

    // If no blocking terrain found, find the closest terrain piece (berserker rage)
    if (!closestBlockingTerrain) {
      // console.log(`${orc.team} berserker in rage mode - destroying closest terrain`);

      for (const terrain of scene.terrain) {
        if (terrain.chunks && terrain.chunks.length > 0) {
          // Find closest chunk in multi-chunk terrain
          for (const chunk of terrain.chunks) {
            const distance = Phaser.Math.Distance.Between(orc.x, orc.y, chunk.x, chunk.y);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestBlockingTerrain = chunk;
            }
          }
        } else {
          // Regular terrain
          const distance = Phaser.Math.Distance.Between(orc.x, orc.y, terrain.x, terrain.y);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestBlockingTerrain = terrain;
          }
        }
      }
    }

    // If we found terrain and we're close enough, use axe
    if (closestBlockingTerrain && closestDistance < 70) {
      orc.destroyTerrainChunk(closestBlockingTerrain);

      // Reset frustration timer by updating lastFireTime (berserker feels better after destroying something)
      orc.lastFireTime = time;
      return true; // Terrain destruction handled
    }
    if (closestBlockingTerrain && closestDistance < 110) {
      // Move towards the terrain to destroy it
      const moveAngle = Phaser.Math.Angle.Between(
        orc.x,
        orc.y,
        closestBlockingTerrain.x,
        closestBlockingTerrain.y,
      );
      const moveX = Math.cos(moveAngle) * orc.moveSpeed * 1.2; // 20% faster when seeking to destroy
      const moveY = Math.sin(moveAngle) * orc.moveSpeed * 1.2;
      orc.setVelocity(moveX, moveY);

      // console.log(`${orc.team} berserker moving to destroy terrain at distance ${closestDistance.toFixed(1)}`);
      return false; // Still seeking terrain
    }
    // No terrain to destroy - just charge at enemy in frustration
    const chargeAngle = Phaser.Math.Angle.Between(orc.x, orc.y, enemy.x, enemy.y);
    const chargeX = Math.cos(chargeAngle) * orc.moveSpeed * 1.3; // Extra fast charge
    const chargeY = Math.sin(chargeAngle) * orc.moveSpeed * 1.3;
    orc.setVelocity(chargeX, chargeY);

    // console.log(`${orc.team} berserker in frustrated charge - no terrain to destroy`);
    return false;
  },

  updateBerserkerCloseCombatPositioning(scene, orc, enemy, distance, time) {
    // Smart positioning to get into sword range while avoiding enemy movement

    // Predict enemy movement
    const enemyVelocity = enemy.body ? { x: enemy.body.velocity.x, y: enemy.body.velocity.y } : { x: 0, y: 0 };
    const predictionTime = 0.3; // Predict 300ms ahead
    const predictedEnemyX = enemy.x + enemyVelocity.x * predictionTime;
    const predictedEnemyY = enemy.y + enemyVelocity.y * predictionTime;

    // Calculate intercept angle to predicted position
    const interceptAngle = Phaser.Math.Angle.Between(orc.x, orc.y, predictedEnemyX, predictedEnemyY);

    // Add slight randomization to avoid predictable movement
    const randomOffset = (Math.random() - 0.5) * 0.3; // ±0.15 radians (±8.6 degrees)
    const finalAngle = interceptAngle + randomOffset;

    // Use enhanced speed for closing distance
    const closingSpeed = orc.moveSpeed * 1.1; // 10% faster when closing for attack
    const moveX = Math.cos(finalAngle) * closingSpeed;
    const moveY = Math.sin(finalAngle) * closingSpeed;

    orc.setVelocity(moveX, moveY);

    // console.log(`${orc.team} berserker positioning for sword attack - distance: ${distance.toFixed(1)}, predicted pos: (${predictedEnemyX.toFixed(1)}, ${predictedEnemyY.toFixed(1)})`);
  },

  updateBerserkerOptimalRangeMovement(orc, enemy, distance, time) {
    // Within optimal sword range - use micro-movements to stay in range and land hits

    const baseTime = time * 0.001;
    const orcId = orc.x + orc.y;

    // Slight orbital movement to stay close but avoid being too predictable
    const orbitIntensity = 0.4;
    const orbitFrequency = 3 + (orcId % 2); // Vary frequency per berserker
    const orbitDirection = Math.sin(baseTime * orbitFrequency + orcId);

    // Calculate orbit angle (perpendicular to enemy direction)
    const toEnemyAngle = Phaser.Math.Angle.Between(orc.x, orc.y, enemy.x, enemy.y);
    const orbitAngle = toEnemyAngle + Math.PI / 2; // 90 degrees

    const orbitX = Math.cos(orbitAngle) * orbitDirection * orc.moveSpeed * orbitIntensity;
    const orbitY = Math.sin(orbitAngle) * orbitDirection * orc.moveSpeed * orbitIntensity;

    // Small forward/backward adjustment to maintain optimal distance
    let rangeAdjustment = 0;
    const targetDistance = 40; // Ideal distance for sword attacks

    if (distance < targetDistance - 5) {
      rangeAdjustment = -0.3; // Back up slightly
    } else if (distance > targetDistance + 5) {
      rangeAdjustment = 0.3; // Move in slightly
    }

    const adjustX = Math.cos(toEnemyAngle) * rangeAdjustment * orc.moveSpeed;
    const adjustY = Math.sin(toEnemyAngle) * rangeAdjustment * orc.moveSpeed;

    const finalX = orbitX + adjustX;
    const finalY = orbitY + adjustY;

    orc.setVelocity(finalX, finalY);

    // console.log(`${orc.team} berserker in optimal range ${distance.toFixed(1)} - maintaining position`);
  },
  updateRusherAI(scene, orc, enemy, distance, time) {
    // Check if we've lost line of sight for too long
    if (!this.hasLineOfSight(scene, orc, enemy)) {
      if (!orc.lineOfSightLostTime) {
        orc.lineOfSightLostTime = time;
      } else if (time - orc.lineOfSightLostTime > 1500) {
        // 1.5 seconds
        // Move to get line of sight
        this.seekLineOfSight(scene, orc, enemy);
        return;
      }
    } else {
      // Reset timer when we have line of sight
      orc.lineOfSightLostTime = null;
      orc.seekingLineOfSightStartTime = null; // Also reset terrain destruction timer
    }

    // Check for incoming lasers and take evasive action
    if (this.shouldTakeEvasiveAction(scene, orc, time)) {
      this.performEvasiveManeuver(scene, orc, enemy, time);
      return;
    }

    // Normal rusher behaviour
    if (distance > orc.preferredRange * 1.5) {
      const moveX = Math.cos(orc.rotation) * orc.moveSpeed;
      const moveY = Math.sin(orc.rotation) * orc.moveSpeed;
      orc.setVelocity(moveX, moveY);
    } else if (distance > orc.preferredRange) {
      const forwardComponent = 0.7;
      const strafeComponent = 0.3;

      const forwardX = Math.cos(orc.rotation) * orc.moveSpeed * forwardComponent;
      const forwardY = Math.sin(orc.rotation) * orc.moveSpeed * forwardComponent;

      const strafeAngle = orc.rotation + (Math.sin(time * 0.003) > 0 ? Math.PI / 2 : -Math.PI / 2);
      const strafeX = Math.cos(strafeAngle) * orc.moveSpeed * strafeComponent;
      const strafeY = Math.sin(strafeAngle) * orc.moveSpeed * strafeComponent;

      orc.setVelocity(forwardX + strafeX, forwardY + strafeY);
    } else {
      this.updateRusherCombatMovement(orc, enemy, distance, time);
    }
  },

  seekLineOfSight(scene, orc, enemy) {
    // Start timing how long we've been seeking line of sight
    if (!orc.seekingLineOfSightStartTime) {
      orc.seekingLineOfSightStartTime = Date.now();
    }

    // If we've been seeking for more than the orc's patience, use axe to destroy terrain
    const seekingTime = Date.now() - orc.seekingLineOfSightStartTime;
    const patienceMs = orc.terrainPatience * 1000; // Convert seconds to milliseconds
    if (seekingTime > patienceMs) {
      // Find closest terrain piece that's blocking us
      const line = new Phaser.Geom.Line(orc.x, orc.y, enemy.x, enemy.y);
      let closestBlockingTerrain = null;
      let closestDistance = Infinity;

      for (const terrain of scene.terrain) {
        if (terrain.chunks && terrain.chunks.length > 0) {
          // Rock or Block class - check against overall bounds and find closest chunk
          const bounds = terrain.getBounds();
          if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
            // Find closest chunk in this terrain
            let closestChunk = null;
            let closestChunkDistance = Infinity;

            for (const chunk of terrain.chunks) {
              const chunkDistance = Phaser.Math.Distance.Between(orc.x, orc.y, chunk.x, chunk.y);
              if (chunkDistance < closestChunkDistance) {
                closestChunkDistance = chunkDistance;
                closestChunk = chunk;
              }
            }

            if (closestChunk && closestChunkDistance < closestDistance) {
              closestDistance = closestChunkDistance;
              closestBlockingTerrain = closestChunk;
            }
          }
        } else {
          // Regular terrain sprite (trees or legacy terrain)
          const bounds = terrain.getBounds();
          if (Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
            const distance = Phaser.Math.Distance.Between(orc.x, orc.y, terrain.x, terrain.y);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestBlockingTerrain = terrain;
            }
          }
        }
      }

      // If we found blocking terrain and we're close enough, use axe
      if (closestBlockingTerrain && closestDistance < 60) {
        orc.destroyTerrainChunk(closestBlockingTerrain);
        return; // Exit function after using axe
      }
    }

    // Normal line of sight seeking behavior
    // Try multiple positions around the enemy to find line of sight
    const attempts = [
      { angle: 0, distance: 150 }, // Direct approach
      { angle: Math.PI / 3, distance: 120 }, // 60 degrees
      { angle: -Math.PI / 3, distance: 120 }, // -60 degrees
      { angle: Math.PI / 2, distance: 100 }, // 90 degrees (flank)
      { angle: -Math.PI / 2, distance: 100 }, // -90 degrees (flank)
      { angle: Math.PI, distance: 140 }, // Behind enemy
    ];

    let bestPosition = null;

    for (const attempt of attempts) {
      const testX = enemy.x + Math.cos(attempt.angle) * attempt.distance;
      const testY = enemy.y + Math.sin(attempt.angle) * attempt.distance;

      // Check bounds
      if (testX < 50 || testX > 750 || testY < 50 || testY > 550) continue;

      // Check if this position has line of sight to enemy
      const testLine = new Phaser.Geom.Line(testX, testY, enemy.x, enemy.y);
      let hasLoS = true;

      for (const terrain of scene.terrain) {
        const bounds = terrain.getBounds();
        if (Phaser.Geom.Intersects.LineToRectangle(testLine, bounds)) {
          hasLoS = false;
          break;
        }
      }

      if (hasLoS) {
        bestPosition = { x: testX, y: testY };
        break; // Take first valid position
      }
    }

    if (bestPosition) {
      // Move toward the line of sight position
      const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, bestPosition.x, bestPosition.y);
      const moveX = Math.cos(moveAngle) * orc.moveSpeed * 1.2; // 20% faster when seeking LoS
      const moveY = Math.sin(moveAngle) * orc.moveSpeed * 1.2;
      orc.setVelocity(moveX, moveY);
    } else {
      // No good position found, advance directly toward enemy
      const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, enemy.x, enemy.y);
      const moveX = Math.cos(moveAngle) * orc.moveSpeed;
      const moveY = Math.sin(moveAngle) * orc.moveSpeed;
      orc.setVelocity(moveX, moveY);
    }
  },

  updateRusherCombatMovement(orc, enemy, distance, time) {
    const baseTime = time * 0.001;
    const orcId = orc.x + orc.y;

    const strafeIntensity = 0.7;
    const strafeFrequency = 2 + (orcId % 3);
    const strafeDirection = Math.sin(baseTime * strafeFrequency + orcId);
    const strafeAngle = orc.rotation + Math.PI / 2;
    const strafeX = Math.cos(strafeAngle) * strafeDirection * orc.moveSpeed * strafeIntensity;
    const strafeY = Math.sin(strafeAngle) * strafeDirection * orc.moveSpeed * strafeIntensity;

    const advanceIntensity = 0.3;
    let advanceDirection = 0;

    if (distance < orc.preferredRange * 0.6) {
      advanceDirection = -1;
    } else if (distance > orc.preferredRange * 0.9) {
      advanceDirection = 1;
    } else {
      advanceDirection = Math.sin(baseTime * 1.5 + orcId) * 0.5;
    }

    const advanceX = Math.cos(orc.rotation) * advanceDirection * orc.moveSpeed * advanceIntensity;
    const advanceY = Math.sin(orc.rotation) * advanceDirection * orc.moveSpeed * advanceIntensity;

    let evasionX = 0;
    let evasionY = 0;
    if (time - orc.lastEvasionTime > orc.evasionCooldown) {
      if (Math.random() < 0.3) {
        const evasionAngle = Math.random() * Math.PI * 2;
        const evasionIntensity = 0.8;
        evasionX = Math.cos(evasionAngle) * orc.moveSpeed * evasionIntensity;
        evasionY = Math.sin(evasionAngle) * orc.moveSpeed * evasionIntensity;
        orc.lastEvasionTime = time;
      }
    }

    const finalX = strafeX + advanceX + evasionX;
    const finalY = strafeY + advanceY + evasionY;

    const maxVelocity = orc.moveSpeed * 1.2;
    const velocityMagnitude = Math.sqrt(finalX * finalX + finalY * finalY);
    if (velocityMagnitude > maxVelocity) {
      const scale = maxVelocity / velocityMagnitude;
      orc.setVelocity(finalX * scale, finalY * scale);
    } else {
      orc.setVelocity(finalX, finalY);
    }
  },

  findCoverPosition(scene, orc, enemy) {
    let bestCover = null;
    let bestScore = -1;

    scene.terrain.forEach((terrain) => {
      const terrainToEnemy = Phaser.Math.Angle.Between(terrain.x, terrain.y, enemy.x, enemy.y);
      const coverX = terrain.x - Math.cos(terrainToEnemy) * 80;
      const coverY = terrain.y - Math.sin(terrainToEnemy) * 80;

      const distanceToOrc = Phaser.Math.Distance.Between(orc.x, orc.y, coverX, coverY);
      const distanceFromEnemy = Phaser.Math.Distance.Between(coverX, coverY, enemy.x, enemy.y);

      const score = distanceFromEnemy - distanceToOrc * 0.5;

      if (score > bestScore && distanceFromEnemy > orc.preferredRange * 0.8) {
        bestScore = score;
        bestCover = { x: coverX, y: coverY };
      }
    });

    return bestCover;
  },

  // Berserker trio special behaviors
  updateBerserkerImmunityBehavior(scene, orc, enemies, time) {
    // During immunity phase, berserkers move normally but don't attack
    // This gives them time to reposition while being invulnerable

    let closestEnemy = null;
    let closestDistance = Infinity;

    enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(orc.x, orc.y, enemy.x, enemy.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      const angleToEnemy = Phaser.Math.Angle.Between(orc.x, orc.y, closestEnemy.x, closestEnemy.y);

      // Update head rotation to track enemy
      const headAngleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - orc.headRotation);
      if (Math.abs(headAngleDiff) > 0.1) {
        orc.headRotation += Math.sign(headAngleDiff) * orc.headTurnSpeed * 0.016;
        if (orc.head) {
          orc.head.setRotation(orc.headRotation);
        }
      }

      // Move towards enemy but don't get too close during immunity
      if (closestDistance > 100) {
        const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, closestEnemy.x, closestEnemy.y);
        const moveX = Math.cos(moveAngle) * orc.moveSpeed * 0.8;
        const moveY = Math.sin(moveAngle) * orc.moveSpeed * 0.8;

        if (orc.body && orc.active) {
          orc.setVelocity(moveX, moveY);
        }

        // Update body rotation
        const bodyAngleDiff = Phaser.Math.Angle.Wrap(moveAngle - orc.bodyRotation);
        if (Math.abs(bodyAngleDiff) > 0.2) {
          orc.bodyRotation += Math.sign(bodyAngleDiff) * orc.bodyTurnSpeed * 0.016;
          orc.setRotation(orc.bodyRotation);
        }
      } else if (orc.body && orc.active) {
        orc.setVelocity(0, 0);
      }
    }
  },

  updateBerserkerInvisibilityBehavior(scene, orc, enemies, time) {
    // During invisibility, berserkers move very fast to strategic positions
    // They spread out and position themselves to surround enemies

    if (!orc.invisibilityWaypoint) {
      orc.invisibilityWaypoint = this.calculateBerserkerInvisibilityPosition(scene, orc, enemies);
      console.log(
        `${orc.team} berserker setting invisibility waypoint at (${orc.invisibilityWaypoint.x}, ${orc.invisibilityWaypoint.y})`,
      );
    }

    const waypointDistance = Phaser.Math.Distance.Between(
      orc.x,
      orc.y,
      orc.invisibilityWaypoint.x,
      orc.invisibilityWaypoint.y,
    );

    if (waypointDistance > 25) {
      // Move very fast towards waypoint
      const moveAngle = Phaser.Math.Angle.Between(
        orc.x,
        orc.y,
        orc.invisibilityWaypoint.x,
        orc.invisibilityWaypoint.y,
      );

      const fastSpeed = orc.moveSpeed * 4.0; // Much faster movement during invisibility (was 2.5)
      const moveX = Math.cos(moveAngle) * fastSpeed;
      const moveY = Math.sin(moveAngle) * fastSpeed;

      if (orc.body && orc.active) {
        orc.setVelocity(moveX, moveY);
      }

      // Update body rotation towards movement
      orc.bodyRotation = moveAngle;
      orc.setRotation(orc.bodyRotation);
    } else {
      // Reached waypoint, hold position
      if (orc.body && orc.active) {
        orc.setVelocity(0, 0);
      }
    }
  },

  calculateBerserkerInvisibilityPosition(scene, orc, enemies) {
    // Calculate strategic position that is:
    // 1. Away from other berserkers (spread out)
    // 2. In a flanking position relative to enemies
    // 3. Uses terrain for cover when possible
    // 4. NOT inside terrain or other orcs when invisibility ends

    const otherBerserkers = scene.berserkerOrcs.filter((b) => b !== orc && b.active);

    // Calculate center of enemy formation
    let enemyCenterX = 0;
    let enemyCenterY = 0;
    enemies.forEach((enemy) => {
      enemyCenterX += enemy.x;
      enemyCenterY += enemy.y;
    });
    enemyCenterX /= enemies.length;
    enemyCenterY /= enemies.length;

    // Generate potential positions in a circle around enemies
    const positions = [];
    const radius = 150 + Math.random() * 100; // 150-250 pixel radius

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const testX = enemyCenterX + Math.cos(angle) * radius;
      const testY = enemyCenterY + Math.sin(angle) * radius;

      // Check bounds
      if (testX < 50 || testX > 750 || testY < 50 || testY > 550) continue;

      // Check if position is clear of terrain and other orcs
      if (!this.isPositionSafeForMaterialization(scene, testX, testY, orc)) continue;

      // Score this position
      let score = 100;

      // Bonus for being away from other berserkers
      otherBerserkers.forEach((berserker) => {
        const distance = Phaser.Math.Distance.Between(testX, testY, berserker.x, berserker.y);
        if (distance > 80) {
          score += 50; // Good separation
        } else {
          score -= 100; // Too close to other berserker
        }
      });

      // Bonus for being near terrain (for cover) but not inside it
      scene.terrain.forEach((terrain) => {
        const distance = Phaser.Math.Distance.Between(testX, testY, terrain.x, terrain.y);
        if (distance > 60 && distance < 120) {
          score += 30; // Good cover distance
        }
      });

      positions.push({
        x: testX, y: testY, score, angle,
      });
    }

    // Sort by score and take the best position
    positions.sort((a, b) => b.score - a.score);

    if (positions.length > 0) {
      console.log(
        `${orc.team} berserker found safe waypoint at (${positions[0].x}, ${positions[0].y}) with score ${positions[0].score}`,
      );
      return positions[0];
    }
    // Fallback: find any safe position away from enemies
    return this.findSafeFallbackPosition(scene, enemyCenterX, enemyCenterY, orc);
  },

  isPositionSafeForMaterialization(scene, x, y, excludeOrc) {
    // Check if position would be inside terrain when berserker materializes
    for (const terrain of scene.terrain) {
      let terrainBounds;

      if (terrain.chunks && terrain.chunks.length > 0) {
        // Multi-chunk terrain (rocks/blocks)
        terrainBounds = terrain.getBounds();
        if (terrainBounds) {
          // Add buffer zone around terrain
          const buffer = 35; // Orc needs at least 35 pixels clearance
          if (
            x > terrainBounds.x - buffer
                        && x < terrainBounds.x + terrainBounds.width + buffer
                        && y > terrainBounds.y - buffer
                        && y < terrainBounds.y + terrainBounds.height + buffer
          ) {
            return false;
          }
        }
      } else {
        // Single terrain sprite
        const distance = Phaser.Math.Distance.Between(x, y, terrain.x, terrain.y);
        if (distance < 50) {
          // Too close to terrain
          return false;
        }
      }
    }

    // Check if position would overlap with other orcs
    const allOrcs = [...scene.blueOrcs, ...scene.redOrcs].filter((orc) => orc.active && orc !== excludeOrc);
    for (const orc of allOrcs) {
      const distance = Phaser.Math.Distance.Between(x, y, orc.x, orc.y);
      if (distance < 40) {
        // Too close to another orc
        return false;
      }
    }

    return true;
  },

  findSafeFallbackPosition(scene, enemyCenterX, enemyCenterY, orc) {
    // Try to find any safe position, starting from far away and working inward
    for (let radius = 300; radius >= 150; radius -= 25) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const testX = enemyCenterX + Math.cos(angle) * radius;
        const testY = enemyCenterY + Math.sin(angle) * radius;

        // Check bounds
        if (testX < 50 || testX > 750 || testY < 50 || testY > 550) continue;

        if (this.isPositionSafeForMaterialization(scene, testX, testY, orc)) {
          console.log(`${orc.team} berserker using fallback safe position at (${testX}, ${testY})`);
          return { x: testX, y: testY, score: 50 };
        }
      }
    }

    // Last resort: current position if it's safe
    if (this.isPositionSafeForMaterialization(scene, orc.x, orc.y, orc)) {
      console.log(`${orc.team} berserker staying at current safe position`);
      return { x: orc.x, y: orc.y, score: 25 };
    }

    // Emergency: just use a position away from center
    const emergencyAngle = Math.random() * Math.PI * 2;
    const emergencyX = Math.max(50, Math.min(750, enemyCenterX + Math.cos(emergencyAngle) * 200));
    const emergencyY = Math.max(50, Math.min(550, enemyCenterY + Math.sin(emergencyAngle) * 200));

    console.warn(`${orc.team} berserker using emergency position - may not be safe!`);
    return { x: emergencyX, y: emergencyY, score: 0 };
  },

  updateEnemyDuringInvisibility(scene, orc, time) {
    // Enemies look around confused and stop firing during berserker invisibility
    orc.canAttack = false;

    // Look around in a searching pattern
    const searchSpeed = 1.5; // Faster head movement when searching
    const searchTime = time * 0.002; // Time-based search pattern
    const baseAngle = Math.sin(searchTime) * Math.PI * 0.8; // Sweep back and forth

    // Add some randomness to each orc's search pattern
    const orcId = orc.x + orc.y; // Use position as unique ID
    const randomOffset = Math.sin(searchTime + orcId) * 0.5;

    const targetHeadAngle = baseAngle + randomOffset;

    // Smoothly rotate head towards search angle
    const headAngleDiff = Phaser.Math.Angle.Wrap(targetHeadAngle - orc.headRotation);
    if (Math.abs(headAngleDiff) > 0.1) {
      orc.headRotation += Math.sign(headAngleDiff) * searchSpeed * 0.016;
      if (orc.head) {
        orc.head.setRotation(orc.headRotation);
      }
    }

    // Move slowly and cautiously
    if (Math.random() < 0.3) {
      // 30% chance to move each frame
      const cautiousAngle = Math.random() * Math.PI * 2;
      const cautiousSpeed = orc.moveSpeed * 0.3; // Very slow movement
      const moveX = Math.cos(cautiousAngle) * cautiousSpeed;
      const moveY = Math.sin(cautiousAngle) * cautiousSpeed;

      if (orc.body && orc.active) {
        orc.setVelocity(moveX, moveY);
      }
    } else if (orc.body && orc.active) {
      orc.setVelocity(0, 0);
    }
  },

  hasLineOfSight(scene, orc, target) {
    const line = new Phaser.Geom.Line(orc.x, orc.y, target.x, target.y);

    for (const terrain of scene.terrain) {
      let bounds;
      if (terrain.chunks && terrain.chunks.length > 0) {
        // Rock or Block class with chunks
        bounds = terrain.getBounds();
        if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          return false;
        }
      } else {
        // Regular terrain sprite (trees or legacy terrain)
        bounds = terrain.getBounds();
        if (bounds && Phaser.Geom.Intersects.LineToRectangle(line, bounds)) {
          return false;
        }
      }
    }
    return true;
  },

  checkIfOrcStuck(scene, orc, time) {
    const currentPos = { x: orc.x, y: orc.y };
    const distance = Phaser.Math.Distance.Between(
      currentPos.x,
      currentPos.y,
      orc.lastPosition.x,
      orc.lastPosition.y,
    );

    if (distance < 5) {
      orc.stuckTime += 16;
      if (orc.stuckTime > 1000) {
        this.unstuckOrc(orc);
        orc.stuckTime = 0;
      }
    } else {
      orc.stuckTime = 0;
      orc.lastPosition = { x: currentPos.x, y: currentPos.y };
    }
  },

  unstuckOrc(orc) {
    orc.setVelocity(0, 0);

    const escapeAngle = Math.random() * Math.PI * 2;
    const escapeForce = 80;
    const escapeX = Math.cos(escapeAngle) * escapeForce;
    const escapeY = Math.sin(escapeAngle) * escapeForce;

    orc.setVelocity(escapeX, escapeY);

    orc.coverTarget = null;
    orc.aiState = 'patrol';
  },

  updateCoverFirerAI(scene, orc, enemy, distance, time) {
    if (orc.aiState === 'advancing' && orc.advanceWaypoint) {
      const waypointDistance = Phaser.Math.Distance.Between(
        orc.x,
        orc.y,
        orc.advanceWaypoint.x,
        orc.advanceWaypoint.y,
      );

      if (waypointDistance > 25) {
        const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, orc.advanceWaypoint.x, orc.advanceWaypoint.y);
        const moveX = Math.cos(moveAngle) * orc.moveSpeed;
        const moveY = Math.sin(moveAngle) * orc.moveSpeed;
        orc.setVelocity(moveX, moveY);
        return;
      }
      orc.aiState = 'patrol';
      orc.advanceWaypoint = null;
      orc.setVelocity(0, 0);
    }

    if (!orc.coverTarget || distance < orc.preferredRange * 0.8) {
      orc.coverTarget = this.findCoverPosition(scene, orc, enemy);
    }

    if (orc.coverTarget) {
      const coverDistance = Phaser.Math.Distance.Between(orc.x, orc.y, orc.coverTarget.x, orc.coverTarget.y);
      if (coverDistance > 20) {
        const moveAngle = Phaser.Math.Angle.Between(orc.x, orc.y, orc.coverTarget.x, orc.coverTarget.y);
        const moveX = Math.cos(moveAngle) * orc.moveSpeed;
        const moveY = Math.sin(moveAngle) * orc.moveSpeed;
        orc.setVelocity(moveX, moveY);
      } else {
        orc.setVelocity(0, 0);
      }
    } else if (distance < orc.preferredRange) {
      const retreatAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, orc.x, orc.y);
      const moveX = Math.cos(retreatAngle) * orc.moveSpeed;
      const moveY = Math.sin(retreatAngle) * orc.moveSpeed;
      orc.setVelocity(moveX, moveY);
    } else {
      orc.setVelocity(0, 0);
    }
  },
};
