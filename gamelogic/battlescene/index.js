import { BattleScene } from './utils/battlescene.js';
import { applyCollisionMethods } from './utils/collisions.js';
import { applyEffectMethods } from './utils/effects.js';
import { applyKnockbackMethods } from './utils/knockback.js';
import { applyInitialCeaseFirePhaseMethods, applyCoverFirersAdvancePhaseMethods } from './phases/initial-phases.js';
import { applyBerserkerPhaseMethods } from './phases/berserker-phase.js';
import { applyKingPhaseMethods } from './phases/king-release-phase.js';
import { applyVictoryPhaseMethods } from './phases/victory-phase.js';
import { applyZoneMethods } from './utils/zone.js';
import { applyTerrainGenerationMethods } from './utils/terrain-generation.js';
import { applyUnitCreationMethods } from './utils/unit-creation.js';
import { applyBattlefieldStateMethods } from './utils/battlefield-state.js';

//Phase 1 -- Ceasefire
applyInitialCeaseFirePhaseMethods(BattleScene);

//Phase 2 -- Laser Battle with Cover Firers , then conversion to Rushers
applyCoverFirersAdvancePhaseMethods(BattleScene);

//Phase 3 -- Kings are Released
applyKingPhaseMethods(BattleScene);

//Phase 4 -- Berserker Trio Rises if losing team is far enough behind
applyBerserkerPhaseMethods(BattleScene);

//Phase 5 -- Victory. One Team has won and must celebrate
applyVictoryPhaseMethods(BattleScene);

//Effects
applyEffectMethods(BattleScene);

//Collisions
applyCollisionMethods(BattleScene);

//Knockbacks
applyKnockbackMethods(BattleScene);

//Zones
applyZoneMethods(BattleScene);

//Terrain Generation
applyTerrainGenerationMethods(BattleScene);

//Unit Creation
applyUnitCreationMethods(BattleScene);

//Battlefield State
applyBattlefieldStateMethods(BattleScene);

export { BattleScene };

export const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    teamSize: 45,
    parent: 'game-container',
    backgroundColor: '#2d5a27',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: BattleScene,
};

let game = null;

export function startGame() {
    if (game) {
        game.destroy(true);
    }
    window.game = game = new Phaser.Game(config);
}

// Also make it available globally
window.startGame = startGame;
