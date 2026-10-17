import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import { GRAVITY } from './config';
import './style.css';


new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY, fps: 120, overlapBias: 8 } },
  },
  scene: [GameScene],
});