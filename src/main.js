
import './style.css'
import Phaser from 'phaser'

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

  scene: {
    create() {
      const { width, height } = this.scale

      // create the floor
      const floor = this.add.rectangle(
        width / 2, height - 40, width, 80, 0x18243a
      );

      // create a raised platform.
      const platform = this.add.rectangle(
        650, height - 150, 200, 24, 0x67e8f9
      );

      // create the ceiling
      const ceiling = this.add.rectangle(
        width / 2, 40, width, 24, 0x263b56
      );

      // create the sys console
      this.console = this.add.rectangle(
        820, height - 80, 36, 48, 0xff9f43
      );

      // create the lvl/Room exit
      this.exit = this.add.rectangle(
        900, height - 80, 36, 48, 0x64748b
      );

      this.physics.add.existing(this.exit, true);

      this.roomComplete = false;

      this.completionText = this.add.text(
        width / 2,
        height / 2,
        'ROOM COMPLETE!',
        {
          fontSize: '32px',
          color: "#67e8f9",
          fontFamily: 'monospace',
          backgroundColor: '#0b1020',
          padding: { x: 20, y: 14 },
        }
      )

      this.completionText
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);

      // create a hazard
      this.hazard = this.add.rectangle(
        450, height - 80, 70, 24, 0xff5c5c
      )

      this.physics.add.existing(this.hazard, true);

      // Turn both rectangles into immovable physics platforms.
      this.physics.add.existing(floor, true);
      this.physics.add.existing(platform, true);
      this.physics.add.existing(ceiling, true);

      // Create the robot.
      this.robot = this.add.rectangle(
        180, height - 140, 30, 40, 0x67e8f9
      );

      // save robot's starting position
      this.startPosition = {
        x: this.robot.x,
        y: this.robot.y,
      }

      // Give the robot a physics body.
      this.physics.add.existing(this.robot);
      this.robot.body.setCollideWorldBounds(true);
      this.physics.add.collider(this.robot, ceiling);

      //  Make the robot collide with both platforms.
      this.physics.add.collider(this.robot, floor)
      this.physics.add.collider(this.robot, platform)

      this.physics.add.overlap(this.robot, this.hazard, () => {
        this.robot.setPosition(this.startPosition.x, this.startPosition.y)
        this.robot.body.setVelocity(0, 0)
        this.gravityDirection = 1
        this.physics.world.gravity.y = 900
      });

      this.physics.add.overlap(
        this.robot,
        this.exit,
        () => {
          if (this.systemRestored && !this.roomComplete) {
            this.roomComplete = true
            this.completionText.setVisible(true)
          }
        }
      )

      // keyboard input.
      this.keys = this.input.keyboard.addKeys({
        left: 'A',
        right: 'D',
        jump: 'W',
        flip: 'SPACE',
        interact: "E",
      });

      // Display the robot's visor separately.
      this.visor = this.add.rectangle(
        187, height - 107, 12, 6, 0xff9f43
      )

      // Remember the current gravity direction.
      this.gravityDirection = 1;

      this.systemRestored = false;
      this.interactionText = this.add.text(
        0,0, 'Press E to restore system',
        {
          fontSize: '14x',
          color: '#ff9f43',
          fontFamily: "monospace",
        }
      );

      this.interactionText.setVisible(false);

      // The game title
      this.add.text(32, 32, 'DOWNSHIFT', {
        fontSize: '24px',
        color: "#67e8f9",
        fontFamily: "monospace",
      })

      this.add.text(32, 65, 'A / D: Move W: Jump SPACE: Flip gravity', {
        fontSize: '12px',
        color: '#cbd5e1',
        fontFamily: 'monospace'
      })
    },

    update() {
      const body = this.robot.body;
      const speed = 220;

      // Horizontal movement.
      if (this.roomComplete) {
        this.robot.body.setVelocity(0,0)
        this.robot.body.setAllowGravity(false)
        return
      } else if (this.keys.left.isDown) {
        body.setVelocityX(-speed);
      } else if (this.keys.right.isDown) {
        body.setVelocityX(speed);
      } else {
        body.setVelocityX(0);
      }

      // Jump away from whichever surface gravity pulls us toward
      const grounded = this.gravityDirection === 1
        ? body.blocked.down || body.touching.down
        : body.blocked.up || body.touching.up;

      if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && grounded) {
        body.setVelocityY(-500 * this.gravityDirection)
      }

      // Flip gravity once per spacebar press.
      if (Phaser.Input.Keyboard.JustDown(this.keys.flip)) {
        this.gravityDirection *= -1;
        this.physics.world.gravity.y = 900 * this.gravityDirection
        body.setVelocityY(body.velocity.y * -0.5);
      }

      // Keep the visor attached to the robot.
      this.visor.setPosition(
        this.robot.x + 7,
        this.robot.y - 7
      )

      const distance = Phaser.Math.Distance.Between(
        this.robot.x, 
        this.robot.y, 
        this.console.x, 
        this.console.y
      );

      const nearConsole = distance < 65;
      
      this.interactionText.setPosition(
        this.console.x - 100,
        this.console.y - 45
      );

      this.interactionText.setVisible(
        this.systemRestored || nearConsole
      );

      if (
        nearConsole && 
        !this.systemRestored && 
        Phaser.Input.Keyboard.JustDown(this.keys.interact)
      ) {
        this.systemRestored = true
        this.console.setFillStyle(0x67e8f9)
        this.exit.setFillStyle(0x67e8f9)
        this.interactionText.setText('SYSTEM RESTORED')
      }
    }
  },
}

new Phaser.Game(config)
