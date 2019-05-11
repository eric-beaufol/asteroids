import React from 'react'
import styles from './Home.css'
import * as THREE from 'three'
import * as CANNON from 'cannon'
import OrbitControls from 'orbit-controls-es6'
import Stats from 'stats.js'
import dat from 'dat.gui'

// THREE
let scene, camera, renderer, controls, spaceShipForceLine, shipLight

// CANNON
let world, 
    velocityMax = .5, 
    angularVelocityMax = .5, 
    spaceshipForce = new CANNON.Vec3(0, 0, 0),
    spaceshipForceLeft = new CANNON.Vec3(0, 0, 0),
    spaceshipForceRight = new CANNON.Vec3(0, 0, 0),
    spaceshipPointLeft = new CANNON.Vec3(0, 0, 0),
    spaceshipPointRight = new CANNON.Vec3(0, 0, 0)

// Mixed
let asteroids = [], star, spaceship, spaceshipGroup, spaceshipLight

// Stats.js
let stats

// General
const length = 1000, 
      fieldWidth = 70, 
      fieldDepth = 70, 
      fieldHeight = 20, 
      keysDown = [],
      acceleration = 0.1,
      speed = new CANNON.Vec3(0,0,0),
      yawFactor = 0.04,
      rollFactor = 0.04,
      pitchFactor = 0.04,
      keysMap = {
        83: 'ROLL_UP',
        90: 'ROLL_DOWN',
        81: 'YAW_UP',
        68: 'YAW_DOWN',
        65: 'PITCH_UP',
        69: 'PITCH_DOWN',
        77: 'SLIDE_RIGHT',
        220: 'SLIDE_LEFT',
        18: 'SLIDE_TOP',
        16: 'SLIDE_DOWN',
        219: 'SPEED_DOWN',
        222: 'SPEED_UP',
      }

const keys = Object.keys(keysMap)

class Home extends React.Component {

  constructor(props) {
    super(props)

    this.canvas = React.createRef()
    this.animate = this.animate.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)

    this.autoSpeed = false
    this.pause = false
    this.light = false
    this.freeCamera = false
  }

  componentDidMount() {

    // THREE

    renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas})
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(devicePixelRatio)

    scene = new THREE.Scene()
    
    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000)
    camera.position.y = 10
    camera.position.z = 50

    controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0
    controls.maxDistance = 1000

    const grid = new THREE.GridHelper(1000, 200)
    scene.add(grid)

    const pointLight = new THREE.PointLight(0xffffff, .6)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, .1)
    scene.add(ambientLight)

    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // CANNON

    world = new CANNON.World()
    world.gravity.set(0, 0, 0)

    // Stats.js
    stats = new Stats()
    document.body.appendChild(stats.domElement)

    // Dat.gui

    const gui = new dat.GUI()
    gui.add(this, 'pause')
    gui.add(this, 'freeCamera')

    // Asteroids

    this.createStar()
    this.createAsteroids()
    this.createSpaceship()

    controls.target = spaceship.position

    // Listeners
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)

    this.animate()
  }

  onKeyDown(e) {
    // console.log(e.which)

    if (keys.indexOf(String(e.which)) !== -1 && keysDown.indexOf(e.which) === -1) {
      keysDown.push(e.which)
    }
  }

  onKeyUp(e) {
    const index = keysDown.indexOf(e.which)
    if (index !== -1) {
      keysDown.splice(index, 1)
    }
  }

  createAsteroids() {
    const material = new THREE.MeshStandardMaterial({color: 0xffffff})

    for (let i = 0; i < length; i++) {

      const geometry = new THREE.DodecahedronGeometry(radius)
      const geometry2 = new THREE.DodecahedronBufferGeometry(radius)
      const mesh = new THREE.Mesh(geometry, material)

      //console.log(geometry2)

      const x = -fieldWidth / 2 + Math.random() * fieldWidth
      const y = -fieldHeight / 2 + Math.random() * fieldHeight
      const z = -fieldDepth / 2 + Math.random() * fieldDepth
      const radius = Math.random() * 1
      const velocityX = Math.random() * velocityMax * (Math.random() > 0.5 ? 1 : -1)
      const velocityY = Math.random() * velocityMax * (Math.random() > 0.5 ? 1 : -1)
      const velocityZ = Math.random() * velocityMax * (Math.random() > 0.5 ? 1 : -1)
      const angularVelocityX = Math.random() * angularVelocityMax * (Math.random() > 0.5 ? 1 : -1)
      const angularVelocityY = Math.random() * angularVelocityMax * (Math.random() > 0.5 ? 1 : -1)
      const angularVelocityZ = Math.random() * angularVelocityMax * (Math.random() > 0.5 ? 1 : -1)

      if (Math.abs(x) < 10 && Math.abs(z) < 10) {
        x *= 10
        z *= 10
      }

      mesh.body = new CANNON.Body({
        mass: .1,
        position: new CANNON.Vec3(x, y, z),
        shape: this.getConvexBodyShape(geometry),
        velocity: new CANNON.Vec3(velocityX, velocityY, velocityZ),
        angularVelocity: new CANNON.Vec3(angularVelocityX, angularVelocityY, angularVelocityZ),
        angularDamping: 0
      })

      scene.add(mesh)
      world.addBody(mesh.body)

      asteroids.push(mesh)
    } 
  }

  createStar() {
    const geometry = new THREE.SphereGeometry(2, 32, 32)
    const material = new THREE.MeshBasicMaterial(0xffffff)
    star = new THREE.Mesh(geometry, material)
    scene.add(star)

    star.body = new CANNON.Body({
      mass: 100,
      position: new CANNON.Vec3(0, 0, 0),
      shape: new CANNON.Sphere(10)
    })

    world.addBody(star.body)
  }

  createSpaceship() {
    const ratio = 146.5 / 230 // Great Pyramid dimensions ;)
    const pBase = 1
    const pHeight = pBase * ratio
    
    spaceshipGroup = new THREE.Group()

    const geometry = new THREE.Geometry()
    geometry.vertices.push(
      new THREE.Vector3(-pBase/2, 0, -pBase/2),
      new THREE.Vector3(pBase/2, 0, -pBase/2),
      new THREE.Vector3(pBase/2, 0, pBase/2),
      new THREE.Vector3(-pBase/2, 0, pBase/2),
      new THREE.Vector3(0, pHeight, 0)
    )
    geometry.faces.push(
      new THREE.Face3(0, 1, 2),
      new THREE.Face3(0, 2, 3),
      new THREE.Face3(0, 4, 1),
      new THREE.Face3(1, 4, 2),
      new THREE.Face3(2, 4, 3),
      new THREE.Face3(3, 4, 0)
    )

    const material = new THREE.MeshStandardMaterial({color: 0xff0000, flatShading: true})
    spaceship = new THREE.Mesh(geometry, material)
    spaceshipGroup.add(spaceship)
    scene.add(spaceshipGroup)
    
    const target = new THREE.Object3D()
    target.position.set(0, 0, -2)
    spaceshipGroup.add(target)

    spaceshipLight = new THREE.SpotLight(0xffffff, .7, 0, 0.2, 0.1)
    spaceshipLight.position.set(0, 0, -1)
    spaceshipLight.target = target

    spaceshipGroup.add(spaceshipLight)

    spaceship.body = new CANNON.Body({
      mass: .2,
      position: new CANNON.Vec3(20, 0, 40),
      shape: this.getConvexBodyShape(geometry),
      linearDamping: 0.8,
      angularDamping: 0.8
    })

    //spaceship.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)

    world.addBody(spaceship.body)

    spaceshipGroup.axes = new THREE.AxesHelper(2)
    spaceshipGroup.add(spaceshipGroup.axes)

    // Line

    const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 4})
    const lineGeometry = new THREE.Geometry()
    const v1 = spaceship.position.clone()
    const v2 = spaceship.position.clone().add(spaceship.position.clone().normalize())
    
    lineGeometry.vertices.push(v1)
    lineGeometry.vertices.push(v2)

    spaceShipForceLine = new THREE.Line(lineGeometry, lineMaterial)
    spaceshipGroup.add(spaceShipForceLine)
  }

  getConvexBodyShape(geometry) {
    const vertices = [], faces = []

    for (let i = 0; i < geometry.vertices.length; i++) {
      const vertice = geometry.vertices[i]
      vertices.push(new CANNON.Vec3(vertice.x, vertice.y, vertice.z))
    }

    for (let i = 0; i < geometry.faces.length; i++) {
      const face = geometry.faces[i]
      faces.push([face.a, face.b, face.c])
    }

    return new CANNON.ConvexPolyhedron(vertices, faces)
  }

  animate() {
    requestAnimationFrame(this.animate)

    stats.begin()
    this.update()
    renderer.render(scene, camera)
    stats.end()

    // console.log(keysDown)
  }

  update() {
    if (this.pause) {
      return
    }

    world.step(1/60)

    asteroids.forEach(mesh => {
      mesh.position.copy(mesh.body.position)
      mesh.quaternion.copy(mesh.body.quaternion)
    })

    star.position.copy(star.body.position)
    star.quaternion.copy(star.body.quaternion)

    spaceshipGroup.position.copy(spaceship.body.position)
    spaceshipGroup.quaternion.copy(spaceship.body.quaternion)

    this.applyForce()
    
    // Acceleration helper  
    // const force = new THREE.Vector3(spaceshipForce.x, spaceshipForce.y, spaceshipForce.z).multiplyScalar(10)

    // spaceShipForceLine.geometry.vertices[0] = spaceship.position.clone()
    // spaceShipForceLine.geometry.vertices[1] = spaceship.position.clone().sub(force)
    // spaceShipForceLine.geometry.verticesNeedUpdate = true

    if (this.freeCamera) { 
      controls.update()
      controls.target = spaceshipGroup.position
    } else {
      this.moveCamera()
    }
  }

  applyForce() {
    const linearForce = new CANNON.Vec3(0,0,0)
    const rollDownForce = new CANNON.Vec3(0,0,0) // x
    const rollUpForce = new CANNON.Vec3(0,0,0) // -x
    const yawUpForce = new CANNON.Vec3(0,0,0) // y
    const yawDownForce = new CANNON.Vec3(0,0,0) // -y
    const pitchUpForce = new CANNON.Vec3(0,0,0) // z
    const pitchDownForce = new CANNON.Vec3(0,0,0) // -z

    keysDown.forEach(key => {
      switch (keysMap[key]) {
        case 'SPEED_UP':
        //linearForce.z = acceleration
        speed.z = Math.min(speed.z + acceleration / 20, .04)
        break

        case 'SPEED_DOWN':
        //linearForce.z = -acceleration
        speed.z = Math.max(speed.z - acceleration / 20, -.2)
        break

        case 'SLIDE_LEFT':
        linearForce.x = acceleration
        break

        case 'SLIDE_RIGHT':
        linearForce.x = -acceleration
        break

        case 'SLIDE_TOP':
        linearForce.y = acceleration
        break

        case 'SLIDE_DOWN':
        linearForce.y = -acceleration
        break

        case 'ROLL_UP':
        rollUpForce.y = -0.0003
        rollUpForce.z = 0.0003
        break

        case 'ROLL_DOWN':
        rollDownForce.y = 0.0003
        rollDownForce.z = -0.0003
        break

        case 'YAW_UP':
        yawUpForce.x = 0.001
        yawUpForce.z = 0.001
        break

        case 'YAW_DOWN':
        yawDownForce.x = -0.001
        yawDownForce.z = 0.001
        break

        case 'PITCH_UP':
        pitchUpForce.x = 0.005
        pitchUpForce.y = -0.005
        break

        case 'PITCH_DOWN':
        pitchDownForce.x = -0.005
        pitchDownForce.y = -0.005
        break
      }
    })

    spaceship.body.applyLocalImpulse(speed, new CANNON.Vec3(0, 0, 0))
    spaceship.body.applyLocalImpulse(linearForce, new CANNON.Vec3(0, 0, 0))
    spaceship.body.applyLocalImpulse(rollUpForce, new CANNON.Vec3(0, 0.5, 0.5))
    spaceship.body.applyLocalImpulse(rollDownForce, new CANNON.Vec3(0, 0.5, 0.5))
    spaceship.body.applyLocalImpulse(yawUpForce, new CANNON.Vec3(-0.5, 0, 0))
    spaceship.body.applyLocalImpulse(yawDownForce, new CANNON.Vec3(0.5, 0, 0))
    spaceship.body.applyLocalImpulse(pitchUpForce, new CANNON.Vec3(-0.4, 0.2, 0))
    spaceship.body.applyLocalImpulse(pitchDownForce, new CANNON.Vec3(0.4, 0.2, 0))

    console.log(spaceship.body.velocity)
    console.log(spaceship.body.angularVelocity)
  }

  moveCamera() {
    const cameraAxisAngle = spaceship.body.quaternion.toAxisAngle()
    const newCameraPos = spaceshipGroup.position.clone().sub(new THREE.Vector3(0, -2, -10).applyQuaternion(spaceshipGroup.quaternion))
    camera.position.copy(newCameraPos)
    camera.lookAt(spaceshipGroup.position)
  }

  deg(rad) {
    return rad * 180 / Math.PI
  }

  rad(deg) {
    return deg * Math.PI / 180
  }

  render() {
    return (
      <div className={styles.container}>
        <canvas ref={el => { this.canvas = el }}/>
      </div>
    )
  }
}

export default Home;