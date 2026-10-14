
export function createRooms(width, height) {
  return {
    powerRestoration: {
      title: 'POWER RESTORATION',

			colors: {
				background: '#0b1020',
				floor: 0x18243a,
				platform: 0x263b56,
				ceiling: 0x263b56,
				console: 0xff9f43,
				exitLocked: 0x64748b,
				exitUnlocked: 0x67e8f9,
				hazard: 0xff5c5c,
				player: 0x67e8f9,
				visor: 0xff9f43
			},

      player: {
        x: 180,
        y: height - 140,
        width: 30,
        height: 40,
      },

      floor: {
        x: width / 2,
        y: height - 40,
        width,
        height: 80,
      },

      ceiling: {
        x: width / 2,
        y: 40,
        width,
        height: 24,
      },

      platforms: [
        {
          x: 650,
          y: height - 150,
          width: 200,
          height: 24,
        },
      ],

      console: {
        x: 820,
        y: 50,
        width: 36,
        height: 48,
      },

      exit: {
        x: 900,
        y: height - 80,
        width: 36,
        height: 48,
      },

      hazard: {
        x: 450,
        y: height - 80,
        width: 70,
        height: 24,
      },
    },
  }
}
