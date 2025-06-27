import { IOrc, LaserProjectile, TerrainObject, Position, TeamType } from '../orc/index.d.ts';

// === KING INTERFACES ===

export interface IFireball extends Phaser.Physics.Arcade.Sprite {
    fireAt(targetX: number, targetY: number): void;
}

export interface IKing extends Phaser.Physics.Arcade.Sprite {
    scene: any;
    team: TeamType;
    alive: boolean;
    released?: boolean;
    
    // Visual components
    head: Phaser.GameObjects.Sprite | null;
    dialog: any; // SpeechBubble
    
    // Animation properties
    bodyRotation: number;
    headRotation: number;
    headTurnSpeed: number;
    currentTarget: IOrc | null;
    lastTargetScanTime: number;
    targetScanInterval: number;
    
    // Marching properties
    marching: boolean;
    marchSpeed: number;
    currentWaypoint: Position | null;
    waypointIndex: number;
    marchWaypoints: Array<Position & { combatStrip: number }>;
    
    // Fireball properties
    lastFireballTime: number;
    fireballInterval: number;
    fireballCharging: boolean;
    fireballChargeStartTime: number;
    fireballChargeDuration: number;
    chargeEffect?: Phaser.GameObjects.GameObject | null;
    
    // Dodging properties
    dodging: boolean;
    dodgeWaypoint: Position | null;
    normalMarchSpeed: number;
    dodgeSpeed: number;
    dodgeStartTime: number;
    dodgeDuration: number;
    
    // Pacing properties
    paceDirection: number;
    paceSpeed: number;
    alcoveCenter: Position;
    paceRange: number;
    lastCommandTime: number;
    commandInterval: number;
    bodyTurnSpeed: number;
    targetBodyRotation: number;
    
    // Command arrays
    normalCommands: string[];
    desperateCommands: string[];
    
    // Head movement during march
    headSideMotionTime?: number;
    headSideMotionSpeed?: number;
    headSideMotionAmount?: number;
    
    // Methods
    generateFireballInterval(): number;
    generateChargeDuration(): number;
    move(x: number, y: number): void;
    checkFlagAreaRestrictions(x: number, y: number): Position;
    syncSprites(): void;
    updateHeadAnimation(time: number): void;
    updatePacing(): void;
    updateCommandShouting(time: number): void;
    findInterestingTarget(): void;
    tauntOpposingArmy(): void;
    findFireballTargetNearAlcove(alcoveTeam: TeamType): Position;
    isFireballTargetInvalid(targetX: number, targetY: number, enemyTeam: TeamType): boolean;
    findNearestShrubToAlcove(alcoveTeam: TeamType): any;
    launchFireball(): void;
    dodgeIncomingFireball(fireballTargetX: number, fireballTargetY: number): void;
    setMarchWaypoints(): void;
    updateKingMarch(time: number): void;
    updateMarchingHeadMovement(time: number, bodyAngle: number): void;
    updateKingDodge(time: number): void;
    endDodgeManuevre(): void;
    updateKingFireball(time: number): void;
    createFireballChargeEffect(): void;
    cleanupSprites(): void;
}

// === DECORATION INTERFACES ===

export interface IDecoration extends Phaser.GameObjects.Sprite {
    decorationType: 'grass' | 'shrub';
    burnt?: boolean;
}

export interface IBloodStain extends Phaser.GameObjects.Sprite {
    // Blood stain specific properties if any
}

// === PHYSICS GROUP INTERFACES ===

export interface IPhysicsGroups {
    blueOrcGroup: Phaser.Physics.Arcade.Group;
    redOrcGroup: Phaser.Physics.Arcade.Group;
    laserGroup: Phaser.Physics.Arcade.Group;
    terrainGroup: Phaser.Physics.Arcade.StaticGroup;
}

// === GAME PHASE INTERFACES ===

export type BerserkerPhase = 'immunity' | 'invisibility' | 'berserker' | null;

export interface IBerserkerSystem {
    berserkerTrioActive: boolean;
    berserkerTeam: TeamType | null;
    berserkerOrcs: IOrc[];
    berserkerPhase: BerserkerPhase;
    berserkerPhaseStartTime: number | null;
}

export interface ICombatStripSystem {
    combatStripWidth: number;
    combatStrips: Record<string, number>;
}

export interface IGameTiming {
    gameOver: boolean;
    winner: TeamType | null;
    gameStartTime: number | null;
    gameEndTime: number | null;
    firingAllowed: boolean;
    firingDelayTime: number;
    kingsReleased: boolean;
    kingReleaseTime: number;
}

// === CLEANUP INTERFACES ===

export interface ICleanupSystem {
    cleansingTimeouts?: NodeJS.Timeout[];
    fireInterval?: NodeJS.Timeout | null;
    smokeInterval?: NodeJS.Timeout | null;
}

// === MAIN BATTLE SCENE INTERFACE ===

/**
 * Main Battle Scene interface that properly extends Phaser.Scene
 * With @types/phaser installed, all Phaser properties are automatically available
 */
export interface IBattleScene extends Phaser.Scene, IPhysicsGroups, IBerserkerSystem, ICombatStripSystem, IGameTiming, ICleanupSystem {
    // === CORE ARRAYS ===
    blueOrcs: IOrc[];
    redOrcs: IOrc[];
    lasers: LaserProjectile[];
    terrain: TerrainObject[];
    backgroundDecorations: IDecoration[];
    bloodStains: IBloodStain[];
    
    // === KINGS ===
    blueKing: IKing | null;
    redKing: IKing | null;
    
    // === CORE LIFECYCLE METHODS ===
    preload(): void;
    loadExternalAssets(): void;
    create(): void;
    update(time: number, delta: number): void;
    destroy(): void;
    
    // === SPRITE CREATION METHODS ===
    createFlagSprites(): void;
    createLaserSprite(): void;
    createTerrainSprites(): void;
    createKingsAndAlcoves(): void;
    createTerrain(): void;
    createBackgroundDecorations(): void;
    
    // === UNIT CREATION METHODS ===
    createTeams(): void;
    createOrc(x: number, y: number, team: TeamType, behavior?: string): IOrc;
    createKing(x: number, y: number, team: TeamType): IKing;
    
    // === PHYSICS AND COLLISION SETUP ===
    setupInitialColliders(): void;
    
    // === GAME STATE METHODS ===
    updateUI(): void;
    getCombatStrip(x: number): number;
    updateCombatStripPositions(): void;
    cleanupBloodStains(): void;
    resetAllCollisionStates(): void;
    updateLaserPositions(delta: number): void;
    cleanupPendingTimeouts(): void;
    
    // === PHASE MANAGEMENT METHODS ===
    checkFiringDelay(): void;
    checkCoverFirerAdvancement(): void;
    checkTeamCoverFirerAdvancement(teamOrcs: IOrc[], teamName: string): void;
    checkKingRelease(): void;
    checkBerserkerTrio(): void;
    updateBerserkerPhase(time: number): void;
    checkWinCondition(): void;
    
    // === EFFECT METHODS ===
    createImmunityEffect(sprite: IOrc): void;
    removeImmunityEffect(sprites: IOrc | IOrc[]): void;
    createInvisibilityEffect(sprites: IOrc | IOrc[]): void;
    removeInvisibilityEffect(sprites: IOrc | IOrc[]): void;
    syncEffectPositions(sprite: IOrc): void;
    createImmunityDeflectionEffect(x: number, y: number): void;
    createFireParticle(x: number, y: number): void;
    createLaserRippleEffect(x: number, y: number, alcoveTeam: TeamType): void;
    createInvisibilityDeflectionEffect(x: number, y: number): void;
    createBerserkerResistanceEffect(x: number, y: number, orc: IOrc): void;
    
    // === COLLISION HANDLER METHODS ===
    laserHitOrc(laser: LaserProjectile, orc: IOrc): void;
    laserHitTerrain(laser: LaserProjectile, terrain: TerrainObject): void;
    laserHitAlcoveWall(laser: LaserProjectile, wall: any): void;
    kingHitTerrain(king: IKing, terrain: TerrainObject): void;
    
    // === KNOCKBACK METHODS ===
    checkRoyalKnockback(x: number, y: number): void;
    checkTerrainKnockback(x: number, y: number, attacker: IOrc): void;
    
    // === ZONE AND BATTLEFIELD METHODS ===
    isLocationInEnemyAlcovesOrOOB(x: number, y: number, enemyTeam: TeamType): boolean;
    findNearestShrubToAlcove(alcoveTeam: TeamType): IDecoration | null;
    
    // === BLOOD STAIN MANAGEMENT ===
    createBloodStain(x: number, y: number): void;
}

// === GAME CONFIG INTERFACE ===

export interface IGameConfig {
    type: number;
    width: number;
    height: number;
    teamSize: number;
    parent: string;
    backgroundColor: string;
    physics: {
        default: string;
        arcade: {
            gravity: { y: number };
            debug: boolean;
        };
    };
    scene: any;
}

// === FACTORY INTERFACES ===

export interface IBattleSceneFactory {
    createBattleScene(): IBattleScene;
}

// === UTILITY TYPE GUARDS ===

export function isKingAlive(king: IKing | null): king is IKing {
    return king !== null && king.alive;
}

export function isKingReleased(king: IKing | null): king is IKing & { released: true } {
    return king !== null && king.alive && king.released === true;
}

export function isBerserkerPhaseActive(scene: IBattleScene): boolean {
    return scene.berserkerTrioActive && scene.berserkerPhase !== null;
}

export function isGameInProgress(scene: IBattleScene): boolean {
    return !scene.gameOver && scene.gameStartTime !== null;
}

// === EXPORT MAIN INTERFACE ===
export default IBattleScene;