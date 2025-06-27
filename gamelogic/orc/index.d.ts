import { SpeechBubble } from '../dialogUI/speechbubble.js';
import { IBattleScene } from '../battlescene/index.d.ts';

// === CORE TYPES ===
export type TeamType = 'blue' | 'red';
export type BehaviorType = 'rusher' | 'cover_firer';
export type OrcType = 'berserker' | null;
export type AIState = 'patrol' | 'seeking' | 'combat' | 'advancing' | 'converting';

// === INTERFACE DEFINITIONS ===

/**
 * Position interface for waypoints and targets
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * Terrain object interface
 */
export interface TerrainObject {
    x: number;
    y: number;
    terrainType?: string;
    rockParent?: any;
    blockParent?: any;
    chunks?: any[];
    getBounds?(): { x: number; y: number; width: number; height: number } | null;
    destroy(): void;
}

/**
 * Laser projectile interface
 */
export interface LaserProjectile extends Phaser.Physics.Arcade.Sprite {
    shooter: IOrc;
    team: TeamType;
    isCoverFirerLaser?: boolean;
    lastX?: number;
    lastY?: number;
}

/**
 * Core Orc interface - defines the contract for all orc functionality
 * This interface represents the fully composed orc with all modular behaviors
 */
export interface IOrc extends Phaser.Physics.Arcade.Sprite {
    // === CORE PROPERTIES ===
    scene: IBattleScene;
    team: TeamType;
    behavior: BehaviorType;
    originalbehavior: BehaviorType;
    health: number;
    active: boolean;

    // === VISUAL COMPONENTS ===
    head: Phaser.GameObjects.Sprite | null;
    dialog: SpeechBubble | null;
    unitInfoLabel?: Phaser.GameObjects.Text | null;
    spriteGen: any;

    // === MOVEMENT AND AI ===
    moveSpeed: number;
    bodyTurnSpeed: number;
    headTurnSpeed: number;
    preferredRange: number;
    bodyRotation: number;
    headRotation: number;
    aiState: AIState;
    target: IOrc | null;
    patrolTarget: Position;
    stuck: boolean;
    lastPosition: Position;
    stuckTime: number;
    combatStrip: number;

    // === COMBAT PROPERTIES ===
    fireRate: number;
    lastFireTime: number;
    aimVariance: number;
    lastEvasionTime: number;
    evasionCooldown: number;

    // === BEHAVIOR-SPECIFIC PROPERTIES ===
    coverTarget?: any;
    advanceWaypoint?: any;

    // === TERRAIN INTERACTION ===
    seekingLineOfSightStartTime?: number | null;
    terrainPatience: number;

    // === BERSERKER PROPERTIES (optional - present when type === 'berserker') ===
    type?: OrcType;
    laserResistance?: number;
    maxLaserResistance?: number;
    minLaserResistance?: number;
    deflectionsCount?: number;
    deflectionsThisDecay?: number;
    resistanceDecayRate?: number;
    resistanceDecayAmount?: number;
    canUseLaser?: boolean;
    hasSwordAttack?: boolean;
    hasAxeAttack?: boolean;
    berserkerCandidate?: boolean;
    berserkerStrengthBonus?: number;
    immuneToDamage?: boolean;
    invisible?: boolean;
    invulnerableWhileInvisible?: boolean;
    canAttack?: boolean;
    invisibilityWaypoint?: Position | null;
    collisionsDisabled?: boolean;
    isDying?: boolean;

    // === UI PROPERTIES ===
    showUnitInfo: boolean;

    // === CORE METHODS ===
    attemptDie(): void;
    generateAimVariance(): void;
    setbehaviourStats(behavior: BehaviorType): void;
    generateTerrainPatience(): number;
    destroyTerrainChunk(terrain: TerrainObject): void;
    convertToRusher(): void;
    createUnitInfoLabel(): void;
    cleanupSprites(): void;
    move(x: number, y: number): void;
    fireLaser(): void;
    syncSprites(): void;

    // === BERSERKER METHODS ===
    convertToBerserker?(): void;
    handleBerserkerDeflection?(): void;
    decayLaserResistance?(): void;
    showResistanceLossEffect?(): void;
    getBerserkerDeflectionAlpha?(): number;
    getBerserkerDeflectionColor?(resistanceRatio: number): number;
    updateBerserkerUnitInfo?(): void;
    applySwordDamage?(target: IOrc): void;
    performSwordAttack?(target: IOrc): void;
    ensureSafeMaterialization?(): void;
    isPositionSafeForMaterialization?(testX?: number, testY?: number): boolean;
    findNearestSafePosition?(): Position | null;
    cleanupBerserkerEffects?(): void;

    // === COVER FIRER METHODS ===
    setCoverFirerAdvanceWaypoint?(targetCombatStrip: number): void;
    convertFromCoverFirerToRusher?(): void;
    findNearestCover?(): any;

    // === RUSHER METHODS ===
    convertFromRusherToCoverFirer?(): void;
    setRusherBehavior?(): void;

    // === PHYSICS METHODS ===
    enableCollisions?(): void;
    disableCollisions?(): void;
    updatePhysics?(): void;
    handleTerrainCollision?(terrain: TerrainObject): void;
}

/**
 * Collision handler interface for the battle scene
 */
export interface ICollisionHandlers {
    laserHitOrc(laser: LaserProjectile, orc: IOrc): void;
    laserHitTerrain(laser: LaserProjectile, terrain: TerrainObject): void;
    laserHitAlcoveWall(laser: LaserProjectile, wall: any): void;
    kingHitTerrain(king: any, terrain: TerrainObject): void;
}

/**
 * Configuration interface for the game
 */
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

/**
 * Factory function interface for creating orcs
 */
export interface IOrcFactory {
    createOrc(scene: IBattleScene, x: number, y: number, team: TeamType, behavior?: BehaviorType): IOrc;
}

/**
 * Type guard functions
 */
export function isBerserker(
    orc: IOrc
): orc is IOrc & Required<Pick<IOrc, 'type' | 'laserResistance' | 'convertToBerserker'>> {
    return orc.type === 'berserker';
}

export function isCoverFirer(orc: IOrc): orc is IOrc & Required<Pick<IOrc, 'setCoverFirerAdvanceWaypoint'>> {
    return orc.behavior === 'cover_firer';
}

export function isRusher(orc: IOrc): orc is IOrc & Required<Pick<IOrc, 'setRusherBehavior'>> {
    return orc.behavior === 'rusher';
}

/**
 * Utility types for method composition
 */
export type BerserkerMethods = Pick<
    IOrc,
    | 'convertToBerserker'
    | 'handleBerserkerDeflection'
    | 'decayLaserResistance'
    | 'showResistanceLossEffect'
    | 'getBerserkerDeflectionAlpha'
    | 'getBerserkerDeflectionColor'
    | 'updateBerserkerUnitInfo'
    | 'applySwordDamage'
    | 'performSwordAttack'
    | 'ensureSafeMaterialization'
    | 'isPositionSafeForMaterialization'
    | 'findNearestSafePosition'
    | 'cleanupBerserkerEffects'
>;

export type CoverFirerMethods = Pick<
    IOrc,
    'setCoverFirerAdvanceWaypoint' | 'convertFromCoverFirerToRusher' | 'findNearestCover'
>;

export type RusherMethods = Pick<IOrc, 'convertFromRusherToCoverFirer' | 'setRusherBehavior'>;

export type PhysicsMethods = Pick<
    IOrc,
    'enableCollisions' | 'disableCollisions' | 'updatePhysics' | 'handleTerrainCollision'
>;

/**
 * Export the main interface as the default
 */
export default IOrc;
