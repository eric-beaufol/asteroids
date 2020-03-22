import CANNON from 'cannon'

// Pyramid dimensions
const ratio = 146.5 / 230 // Great Pyramid ratio ;)
const base = 1
const apex = base * ratio

// const adjacent = base / 2
// const hypothenuse = Math.sqrt(Math.pow(adjacent) + Math.pow(apex, 2))
// const angle = Math.acos(adjacent / hypothenuse)

// const i = new CANNON.Vec2(adjacent/2, apex/2)

// const adjacent2 = base - adjacent
// const opposite = apex / 2
// const hypothenuse2 = Math.sqrt(Math.pow(adjacent2, 2) + Math.pow(opposite, 2))
// const ratio = 3 / 4

const gY = (apex / 2) - ((apex / 2) * (1 / 4))
const g = new CANNON.Vec3(base / 2, gY, base / 2)

console.log(g)

export const linearAcceleration = new CANNON.Vec3(0,0,0)

export const accelerations = {
  'ROLL_UP': {
    line: null,
    point: new CANNON.Vec3(0,0,-0.5),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,-0.002,0)
  },
  'ROLL_DOWN': {
    line: null,
    point: new CANNON.Vec3(0,0,0.5),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,-0.002,0)
  },
  'YAW_UP': {
    line: null,
    point: new CANNON.Vec3(-0.5,0,-0.5),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(-0.001,0,0.001)
  },
  'YAW_DOWN': {
    line: null,
    point: new CANNON.Vec3(0.5,0,-0.5),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0.001,0,0.001)
  },
  'PITCH_UP': {
    line: null,
    point: new CANNON.Vec3(-1,apex/2,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,0.002,0)
  },
  'PITCH_DOWN': {
    line: null,
    point: new CANNON.Vec3(1,apex/2,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,0.002,0)
  },
  'SLIDE_RIGHT': {
    line: null,
    point: new CANNON.Vec3(-0.5,0,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0.05,0,0)
  },
  'SLIDE_LEFT': {
    line: null,
    point: new CANNON.Vec3(0.5,0,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(-0.05,0,0)
  },
  'SLIDE_UP': {
    line: null,
    point: new CANNON.Vec3(0,0,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,0.05,0)
  },
  'SLIDE_DOWN': {
    line: null,
    point: new CANNON.Vec3(0,apex,0),
    acceleration: new CANNON.Vec3(0,0,0),
    inc: new CANNON.Vec3(0,-0.05,0)
  },
  'SPEED_UP': {
    line: null,
    point: new CANNON.Vec3(0,0,-0.5),
    acceleration: linearAcceleration,
    inc: new CANNON.Vec3(0,0,0.002),
    max: 0.3
  },
  'SPEED_DOWN': {
    line: null,
    point: new CANNON.Vec3(0,0,0.5),
    acceleration: linearAcceleration,
    inc: new CANNON.Vec3(0,0,-0.002),
    min: -0.1
  }
}

export const keysMap = {
  83: 'ROLL_UP',
  90: 'ROLL_DOWN',
  81: 'YAW_UP',
  68: 'YAW_DOWN',
  65: 'PITCH_UP',
  69: 'PITCH_DOWN',
  77: 'SLIDE_RIGHT',
  220: 'SLIDE_LEFT',
  18: 'SLIDE_UP',
  16: 'SLIDE_DOWN',
  222: 'SPEED_DOWN',
  219: 'SPEED_UP',
  32: 'FIRE'
}