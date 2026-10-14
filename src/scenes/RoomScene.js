import Phaser from 'phaser'
import { createRooms } from '../data/rooms'

// Gravity is a commitment. Until we flip it. 😎
const GRAVITY = 900
const PLAYER_SPEED = 220
const JUMP_FORCE = 500

const RoomScene = {
  create() {
    // ==========================================
    // 1. ROOM SETUP
    // ==========================================

    const { width, height } = this.scale
    const { powerRestoration: room } = createRooms(width, height)
    const { colors } = room
    this.colors = colors

    this.cameras.main.setBackgroundColor(colors.background)

    // Initialize our room's state before the action begins.
    this.gravityDirection = 1
    this.systemRestored = false
    this.roomComplete = false

    this.physics.world.gravity.y = GRAVITY

    // ==========================================
    // 2. BUILD THE ENVIRONMENT
    // ==========================================

    // The floor: a robot's best friend.
    const floor = this.add.rectangle(
      room.floor.x,
      room.floor.y,
      room.floor.width,
      room.floor.height,
      colors.floor
    )

    // The ceiling: sometimes the new floor.
    const ceiling = this.add.rectangle(
      room.ceiling.x,
      room.ceiling.y,
      room.ceiling.width,
      room.ceiling.height,
      colors.ceiling
    )

    // Build every platform from our room blueprint.
    const platforms = room.platforms.map((platform) => {
      return this.add.rectangle(
        platform.x,
        platform.y,
        platform.width,
        platform.height,
        colors.platform
      )
    })

    // Turn the environment into immovable physics bodies.
    this.physics.add.existing(floor, true)
    this.physics.add.existing(ceiling, true)

    platforms.forEach((platform) => {
      this.physics.add.existing(platform, true)
    })

    // The console powers up the exit. No power, no escape.
    this.console = this.add.rectangle(
      room.console.x,
      room.console.y,
      room.console.width,
      room.console.height,
      colors.console
    )

    this.exit = this.add.rectangle(
      room.exit.x,
      room.exit.y,
      room.exit.width,
      room.exit.height,
      colors.exitLocked
    )

    this.hazard = this.add.rectangle(
      room.hazard.x,
      room.hazard.y,
      room.hazard.width,
      room.hazard.height,
      colors.hazard
    )

    // The exit and hazard need physics, too.
    this.physics.add.existing(this.exit, true)
    this.physics.add.existing(this.hazard, true)

    // ==========================================
    // 3. SPAWN THE PLAYER
    // ==========================================

    this.robot = this.add.rectangle(
      room.player.x,
      room.player.y,
      room.player.width,
      room.player.height,
      colors.player
    )

    // IMPORTANT: a rectangle alone is just a drawing.
    // Give our robot a physics body so it can move!
    this.physics.add.existing(this.robot)

    this.robot.body.setCollideWorldBounds(true)

    // Remember where home is. Hazards send us back here.
    this.startPosition = {
      x: this.robot.x,
      y: this.robot.y,
    }

    // Create and Keep the robot's stylish little visor. 🤖
    this.visor = this.add.rectangle(
      this.robot.x + 7,
      this.robot.y - 7,
      12,
      6,
      colors.visor
    )

    // ==========================================
    // 4. COLLISIONS & INTERACTIONS
    // ==========================================

    // Solid ground, solid ceiling, solid platforms.
    this.physics.add.collider(this.robot, floor)
    this.physics.add.collider(this.robot, ceiling)

    platforms.forEach((platform) => {
      this.physics.add.collider(this.robot, platform)
    })

    // Touching danger means returning to the spawn point.
    this.physics.add.overlap(this.robot, this.hazard, () => {
      this.robot.setPosition(
        this.startPosition.x,
        this.startPosition.y
      )

      this.robot.body.setVelocity(0, 0)

      this.gravityDirection = 1
      this.physics.world.gravity.y = GRAVITY
    })

    // The exit only works after restoring the system.
    this.physics.add.overlap(this.robot, this.exit, () => {
      if (this.systemRestored && !this.roomComplete) {
        this.roomComplete = true
        this.completionText.setVisible(true)
      }
    })

    // ==========================================
    // 5. CONTROLS & UI
    // ==========================================

    this.keys = this.input.keyboard.addKeys({
      left: 'A',
      right: 'D',
      jump: 'W',
      flip: 'SPACE',
      interact: 'E',
    })

    this.add.text(32, 32, 'DOWNSHIFT', {
      fontSize: '24px',
      color: colors.player === undefined ? '#67e8f9' : '#67e8f9',
      fontFamily: 'monospace',
    })

    this.add.text(
      32,
      65,
      'A / D: Move   W: Jump   SPACE: Flip gravity',
      {
        fontSize: '12px',
        color: colors.text,
        fontFamily: 'monospace',
      }
    )

    this.add.text(
      width / 2,
      32,
      room.title,
      {
        fontSize: '16px',
        color: colors.text,
        fontFamily: 'monospace',
      }
    ).setOrigin(0.5, 0)

    this.interactionText = this.add.text(
      0,
      0,
      'Press E to restore system',
      {
        fontSize: '14px',
        color: '#ff9f43',
        fontFamily: 'monospace',
      }
    )

    this.interactionText.setVisible(false)

    this.completionText = this.add.text(
      width / 2,
      height / 2,
      'ROOM COMPLETE!',
      {
        fontSize: '32px',
        color: '#67e8f9',
        fontFamily: 'monospace',
        backgroundColor: '#0b1020',
        padding: { x: 20, y: 14 },
      }
    )

    this.completionText
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false)
  },

  update() {
    const body = this.robot.body

    // A completed room means the robot can finally clock out.
    if (this.roomComplete) {
      body.setVelocity(0, 0)
      body.setAllowGravity(false)
      return
    }

    // ==========================================
    // 6. PLAYER MOVEMENT
    // ==========================================

    // Walk left or right. No input? No movement.
    if (this.keys.left.isDown) {
      body.setVelocityX(-PLAYER_SPEED)
    } else if (this.keys.right.isDown) {
      body.setVelocityX(PLAYER_SPEED)
    } else {
      body.setVelocityX(0)
    }

    // Find the surface gravity is pulling us toward.
    const grounded = this.gravityDirection === 1
      ? body.blocked.down || body.touching.down
      : body.blocked.up || body.touching.up

    // Jump away from the surface we're standing on.
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && grounded) {
      body.setVelocityY(-JUMP_FORCE * this.gravityDirection)
    }

    // Spacebar: because floors are merely suggestions.
    if (Phaser.Input.Keyboard.JustDown(this.keys.flip)) {
      this.gravityDirection *= -1

      this.physics.world.gravity.y =
        GRAVITY * this.gravityDirection

      body.setVelocityY(body.velocity.y * -0.5)
    }

    // The visor follows its owner. Employee benefits. 🤖
    this.visor.setPosition(
      this.robot.x + 7,
      this.robot.y - 7
    )

    // ==========================================
    // CONSOLE & EXIT LOGIC
    // ==========================================

    const distance = Phaser.Math.Distance.Between(
      this.robot.x,
      this.robot.y,
      this.console.x,
      this.console.y
    )

    const nearConsole = distance < 65

    this.interactionText.setPosition(
      this.console.x - 100,
      this.console.y - 45
    )

    this.interactionText.setVisible(
      this.systemRestored || nearConsole
    )

    // Press E to restore power. Management approves.
    if (
      nearConsole &&
      !this.systemRestored &&
      Phaser.Input.Keyboard.JustDown(this.keys.interact)
    ) {
      this.systemRestored = true

      this.console.setFillStyle(this.colors.exitUnlocked)
      this.exit.setFillStyle(this.colors.exitUnlocked)

      this.interactionText.setText('SYSTEM RESTORED')
    }
  },
}

export default RoomScene
