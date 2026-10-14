import './style.css'
import Phaser from 'phaser'
import RoomScene from './scenes/RoomScene'

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#0b1020',
  parent: 'app',

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },

  scene: RoomScene,
}

new Phaser.Game(config)
