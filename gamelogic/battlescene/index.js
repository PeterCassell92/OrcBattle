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

// Calculate responsive dimensions
function getGameDimensions() {
    const container = document.getElementById('game-container');
    const maxWidth = 800;
    const maxHeight = 600;
    const aspectRatio = maxWidth / maxHeight;
    
    // Get container dimensions
    const containerRect = container?.getBoundingClientRect();
    const availableWidth = containerRect ? containerRect.width : window.innerWidth - 40;
    const availableHeight = window.innerHeight - 200; // Leave space for UI
    
    // Calculate responsive dimensions while maintaining aspect ratio
    let gameWidth = Math.min(maxWidth, availableWidth);
    let gameHeight = gameWidth / aspectRatio;
    
    // If height is too large, constrain by height instead
    if (gameHeight > availableHeight) {
        gameHeight = Math.min(maxHeight, availableHeight);
        gameWidth = gameHeight * aspectRatio;
    }
    
    // Ensure minimum playable size - keep game at designed dimensions
    const minWidth = 800;
    const minHeight = 600;
    
    gameWidth = Math.max(minWidth, gameWidth);
    gameHeight = Math.max(minHeight, gameHeight);
    
    return {
        width: Math.floor(gameWidth),
        height: Math.floor(gameHeight)
    };
}

export const config = {
    type: Phaser.AUTO,
    ...getGameDimensions(),
    teamSize: 45,
    parent: 'game-container',
    backgroundColor: '#2d5a27',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1200,
            height: 900
        }
    },
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
    
    // Add resize listener for mobile orientation changes
    window.addEventListener('resize', () => {
        if (game && game.scale) {
            // Small delay to allow CSS to settle
            setTimeout(() => {
                const dimensions = getGameDimensions();
                game.scale.setGameSize(dimensions.width, dimensions.height);
                game.scale.refresh();
            }, 100);
        }
    });
    
    // Handle orientation change specifically for mobile
    window.addEventListener('orientationchange', () => {
        if (game && game.scale) {
            // Longer delay for orientation change as it can take time to settle
            setTimeout(() => {
                const dimensions = getGameDimensions();
                game.scale.setGameSize(dimensions.width, dimensions.height);
                game.scale.refresh();
            }, 300);
        }
    });
}

// Also make it available globally
window.startGame = startGame;
