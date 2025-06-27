import { BattleScene } from './index.js';
//import Phaser from 'phaser'

// Game configuration

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
            debug: false, // Enable to see collision boxes
        },
    },
    scene: BattleScene,
};
