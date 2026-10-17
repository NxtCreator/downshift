import Phaser from "phaser";
import { TILE_SIZE, GRAVITY, JUMP, GAME_WIDTH, GAME_HEIGHT } from "../config";
import LEVELS from '../levels/index';


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('wall', 'assets/wall.png');
        this.load.image('spike', 'assets/spikes.png');
        this.load.image('crate', 'assets/crate.png');
        this.load.image('door-closed', 'assets/door-closed.png');
        this.load.image('door-open', 'assets/door-open.png');
        this.load.image('button', 'assets/button.png');
        this.load.image('robot', 'assets/robot.png');
    }

    init(data) {
        this.levelIndex = data.levelIndex ?? 0;
    }

    create() {
        const level = LEVELS[this.levelIndex];
        this.physics.world.gravity.y = GRAVITY;
        this.flipsLeft = level.flips;
        this.finished = false;
        this.doorOpen = false;

        this.buildlevel(level.map);

        this.robot = this.add.image(this.spawn.x, this.spawn.y, 'robot').setDisplaySize(32, 32);
        this.physics.add.existing(this.robot);

        this.physics.add.collider(this.robot, this.walls);
        this.physics.add.overlap(
            this.robot, this.spikes, () => this.restartLevel()
        );
        this.physics.add.overlap(
            this.robot, this.exit, () => this.nextLevel()
        );

        if (this.crates.length) {
            this.physics.add.collider(this.crates, this.walls);
            this.physics.add.collider(this.robot, this.crates);
            // this.physics.add.collider(this.crates, this.crates);
        }

        if (this.door) {
            this.physics.add.collider([this.robot, ...this.crates], this.door);
        }

        this.flipText = this.add.text(
            8, 6, `Flips: ${this.flipsLeft}`, { fontSize: '18px', color: '#ffffff'}
        );

        this.add.text(GAME_WIDTH / 2, 8, level.note, { fontSize: '14px', color: '#ffffff' })
        .setOrigin(0.5, 0);

        this.add.text(GAME_WIDTH - 8, 6, `Level ${this.levelIndex + 1} / ${LEVELS.length}`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.finished || this.flipsLeft <= 0) return;
            this.flipsLeft--;
            this.physics.world.gravity.y *= -1;
            this.flipText.setText(`Flips: ${this.flipsLeft}`);
        });

        this.input.keyboard.on('keydown-R', () => {
            if (this.won) {
                this.scene.restart({ levelIndex: 0 });
                return
            }
            this.restartLevel();
        }); 
    }

    
    buildlevel(map) {
        this.walls = [];
        this.spikes = [];
        this.crates = [];
        this.button = null;
        this.door = null;

        map.forEach((row, r) => {
            [...row].forEach((char, c) => {
                const x = c * TILE_SIZE + TILE_SIZE / 2;
                const y = r * TILE_SIZE + TILE_SIZE / 2;

                if (char === '#') {
                    const wall = this.add.image(x, y, 'wall').setDisplaySize(TILE_SIZE, TILE_SIZE);
                    this.physics.add.existing(wall, true);
                    this.walls.push(wall);
                } else if (char === '^') {
                    const spike = this.add.image(x, y, 'spike').setDisplaySize(TILE_SIZE, TILE_SIZE)
                    .setFlipY(r < map.length / 2);
                    this.physics.add.existing(spike, true);
                    this.spikes.push(spike);
                } else if (char === 'P') {
                    this.spawn = { x, y };
                } else if (char === 'E') {
                    this.exit = this.add.image(x, y, 'door-open')
                    .setDisplaySize(TILE_SIZE, TILE_SIZE)
                    .setTint(0xf1fac8c)
                    this.tweens.add({ targets: this.exit,
                         alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
                    this.physics.add.existing(this.exit, true);
                } else if (char === 'C') {
                    const crate = this.add.image(x, y, 'crate').setDisplaySize(TILE_SIZE, TILE_SIZE)
                    this.physics.add.existing(crate);
                    crate.body.setDrag(600);
                    this.crates.push(crate);
                } else if (char === 'B') {

                    this.button = this.add.image(x, y, 'button')
                    .setDisplaySize(TILE_SIZE, TILE_SIZE)
                    this.physics.add.existing(this.button, true);
                } else if (char === 'D') {
                    this.door = this.add.image(x, y, 'door-closed')
                    .setDisplaySize(TILE_SIZE, TILE_SIZE);
                    this.physics.add.existing(this.door, true);
                }
            }); 
        });
    }

    restartLevel() {
        this.scene.restart({ levelIndex: this.levelIndex });
    }

    nextLevel() {
        if (this.finished) return;
        this.finished = true;
        this.won = false;

        const next = this.levelIndex + 1;
        if (next < LEVELS.length) {
            this.scene.restart({ levelIndex: next });
        } else {
            this.won = true;
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 
                'Gravity restored.\nShift complete.\n\nPress R to play again', 
                { fontSize: '28px', color: '#ffffff', align: 'center'}).setOrigin(0.5);

            this.physics.pause()
        }
    }
    
    openDoor() {
        this.doorOpen = true;
        this.door.body.enable = false;
        this.door.setTexture('door-open');
    }

    update() {
        const speed = 160;
        const body = this.robot.body;

        if (this.cursors.left.isDown) {
            this.robot.body.setVelocityX(-speed);
            this.robot.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.robot.body.setVelocityX(speed);
            this.robot.setFlipX(false);
        } else {
            this.robot.body.setVelocityX(0);
        }

        const flipped = this.physics.world.gravity.y < 0;
        this.robot.setFlipY(flipped);
        const onGround = flipped 
            ? (body.blocked.up || body.touching.up) 
            : (body.blocked.down || body.touching.down) ;

        if (this.cursors.up.isDown && onGround) {
            body.setVelocityY(flipped ? JUMP : -JUMP);
        }

        if (this.button && !this.doorOpen) {
            const pressed = [this.robot, ...this.crates].some((thing) =>
                this.physics.overlap(thing, this.button)
            );
            if (pressed) this.openDoor();
        }
    }
}