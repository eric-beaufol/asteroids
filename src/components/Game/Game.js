import React from 'react'
import styles from './Game.css'
import * as THREE from 'three'
import * as CANNON from 'cannon'
import OrbitControls from 'orbit-controls-es6'
import Stats from 'stats.js'
import dat from 'dat.gui'
import { keysMap } from './config'
import Spaceship from './../../classes/Spaceship/Spaceship'

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
      lasers = [],
      fireDelay = 12, // frames delay
      laserLife = 60,
      fireGeometry = new THREE.CylinderBufferGeometry(0.02,0.02,1,50),
      fireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000}),
      fireLight = new THREE.PointLight(0xff0000, 1, 10, 2)

const keys = Object.keys(keysMap)

class Home extends React.Component {

  constructor(props) {
    super(props)

    this.canvas = React.createRef()
    this.animate = this.animate.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onFireTouch = this.onFireTouch.bind(this)

    this.autoSpeed = false
    this.pause = false
    this.light = false
    this.sideCamera = false
    this.debug = false
    this.spotLight = false

    this.state = {
      velocity: new CANNON.Vec3(),
      angularVelocity: new CANNON.Vec3(),
      debug: false
    }
  }

  componentDidMount() {

    // THREE

    renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas})
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(devicePixelRatio)

    scene = new THREE.Scene()
    scene.fog = new THREE.Fog(scene.background, 3500, 15000)

    const grid = new THREE.GridHelper(1000, 200)
    scene.add(grid)

    const pointLight = new THREE.PointLight(0xffffff, .6)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, .3)
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
    gui.add(this, 'pause').listen()
    gui.add(this, 'sideCamera')
    gui.add(this, 'spotLight')

    const debugCtrl = gui.add(this, 'debug')

    debugCtrl.onFinishChange(value => {
      this.setState({debug: value})
    })

    // Asteroids

    this.createStar()
    this.createAsteroids()
    this.createSpaceship()

    // // Listeners
    document.addEventListener('keydown', this.onKeyDown)

    this.animate()
  }

  onKeyDown(e) {
    if (keys.indexOf(String(e.which)) !== -1 && keysDown.indexOf(e.which) === -1) {
      console.log(keysMap[e.which])

      switch (keysMap[e.which]) {
        case 'PAUSE':
        this.pause = !this.pause
        break
      }
    }
  }

  fire() {
    const geometry = fireGeometry.clone()
    
    geometry.rotateX(Math.PI / 2)
    geometry.rotateX(-spaceshipGroup.rotation.x)
    geometry.rotateY(spaceshipGroup.rotation.y)
    geometry.rotateZ(spaceshipGroup.rotation.z)

    const mesh = new THREE.Mesh(geometry, fireMaterial)
    const group = new THREE.Group()
    //const light = fireLight.clone()

    //group.add(light)
    group.add(mesh)
    scene.add(group)

    const velocityZ = 1.5 + linearAcceleration.z * 2
    group.velocity = new THREE.Vector3(0, 0, velocityZ).applyQuaternion(spaceshipGroup.quaternion)

    group.position.copy(spaceshipGroup.position.clone().add(new THREE.Vector3(0, 0, 1).applyQuaternion(spaceshipGroup.quaternion)))
    group.life = laserLife
    lasers.push(group)

    group.body = new CANNON.Body({
      shape: new CANNON.Sphere(0.2),
      mass: 0.2,
      velocity: group.velocity.clone().multiplyScalar(50),
      linearDamping: 0.0,
      position: group.position.clone()
    })

    group.body.addEventListener('collide', this.onFireTouch)
    world.add(group.body)
  }

  onFireTouch(e) {
    console.log('touched', e.body)
  }

  createAsteroids() {
    const material = new THREE.MeshStandardMaterial({color: 0xffffff})

    for (let i = 0; i < length; i++) {

      const geometry = new THREE.DodecahedronGeometry(radius)
      geometry.mergeVertices()
      const geometry2 = new THREE.BufferGeometry().fromGeometry(geometry)
      const mesh = new THREE.Mesh(geometry2, material)
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
      shape: new CANNON.Sphere(2)
    })

    world.addBody(star.body)
  }

  createSpaceship() {
    this.spaceship = new Spaceship(1, 1 * 146.5 / 230, scene, world)
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
    renderer.render(scene, this.spaceship.camera)
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

    // lasers.forEach((group, index) => {
    //   group.life--

    //   if (group.life) {
    //     //group.position.add(group.velocity)
    //     group.position.copy(group.body.position)
    //   } else {
    //     scene.remove(group)
    //     lasers.splice(index, 1)
    //     world.remove(group.body)
    //   }
    // })

    star.position.copy(star.body.position)
    star.quaternion.copy(star.body.quaternion)

    this.spaceship.update()
    this.spaceship.light.visible = this.spotLight
  }

  deg(rad) {
    return rad * 180 / Math.PI
  }

  rad(deg) {
    return deg * Math.PI / 180
  }

  getInfosJSX() {
    const { velocity, angularVelocity } = this.state

    return (
       <div className={styles.infos}>
        <ul>
          <li>Velocity: { velocity.x.toFixed(2) }, { velocity.y.toFixed(2) }, { velocity.z.toFixed(2) }</li>
          <li>Angular velocity : { angularVelocity.x.toFixed(2) }, { angularVelocity.y.toFixed(2) }, { angularVelocity.z.toFixed(2) }</li>
        </ul>
      </div>
    )
  }

  render() {
    const { debug } = this.state

    return (
      <div className={styles.container}>
        { debug && this.getInfosJSX() }
        <canvas ref={el => { this.canvas = el }}/>
      </div>
    )
  }
}

export default Home;