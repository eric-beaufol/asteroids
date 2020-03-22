import * as THREE from 'three'
import * as CANNON from 'cannon'
import { accelerations, keysMap, linearAcceleration } from './config'

const keys = Object.keys(keysMap)
let base, height, scene, world

console.log(accelerations)

class Spaceship {

	constructor(...props) {
		this.props = props
		this.keysDown = []
		this.fireTimer
		this.center = new CANNON.Vec3(0,0,0)

		base = this.props[0]
		height = this.props[1]
		scene = this.props[2]
		world = this.props[3]

		this.onKeyDown = this.onKeyDown.bind(this)
		this.onKeyUp = this.onKeyUp.bind(this)

		console.log('[INFO] mesh contructor called')
		this.init()
	}

	init() {
		this.group = new THREE.Group()

    const geometry = new THREE.Geometry()
    const base = this.props[0]
    const height = this.props[1]

    geometry.vertices.push(
      new THREE.Vector3(-base/2, 0, -base/2),
      new THREE.Vector3(base/2, 0, -base/2),
      new THREE.Vector3(base/2, 0, base/2),
      new THREE.Vector3(-base/2, 0, base/2),
      new THREE.Vector3(0, height, 0)
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
    const mesh = new THREE.Mesh(geometry, material)
    this.group.add(mesh)
    scene.add(this.group)
    
    const target = new THREE.Object3D()
    target.position.set(0, 0, 2)
    this.group.add(target)

    this.light = new THREE.SpotLight(0xffffff, .7, 0, 0.2, 0.1)
    this.light.position.set(0, 0, 1)
    this.light.target = target
    this.group.add(this.light)

    this.body = new CANNON.Body({
      mass: .2,
      position: new CANNON.Vec3(20, 0, 40),
      shape: this.getConvexBodyShape(geometry),
      linearDamping: 0.8,
      angularDamping: 0.8
    })

    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI)
    world.addBody(this.body)

    this.group.axes = new THREE.AxesHelper(2)
    this.group.axes.rotation.y = Math.PI
    //this.group.add(this.group.axes)

    // Line

    const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 4})
    const lineGeometry = new THREE.Geometry()
    const v1 = mesh.position.clone()
    const v2 = mesh.position.clone().add(mesh.position.clone().normalize())
    
    lineGeometry.vertices.push(v1)
    lineGeometry.vertices.push(v2)

    const meshForceLine = new THREE.Line(lineGeometry, lineMaterial)
    this.group.add(meshForceLine)

    // Camera

    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000)

    const cameraPosition = this.group.position.clone().sub(new THREE.Vector3(0, -1, 6))
    this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    this.group.add(this.camera)
    this.camera.lookAt(mesh.position)

    // Listeners
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
	}

	drawForce(id) {
    if (!accelerations[id].line) {
      const geometry = new THREE.Geometry()
      geometry.vertices.push(new THREE.Vector3())
      geometry.vertices.push(new THREE.Vector3())

      const material = new THREE.LineBasicMaterial({color: 0x00f7ff})
      const line = new THREE.Line(geometry, material)

      this.group.add(line)
      line.position.copy(accelerations[id].point)
      console.log(accelerations[id].point)

      accelerations[id].line = line
    }

    let p1 = accelerations[id].acceleration.clone().negate()
    
    if (id.indexOf('SPEED') === -1) {
      p1.normalize()
    } else {
      p1 = p1.scale(30)
    }

    accelerations[id].line.geometry.vertices[1].copy(p1)
    accelerations[id].line.geometry.verticesNeedUpdate = true
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

  applyControls() {

    keys.forEach(key => {
      const id = keysMap[key]

      if (id === 'FIRE') {
        this.fireTimer = Math.max(0, this.fireTimer - 1)        
      }

      const isSpeed = String(id).indexOf('SPEED') !== -1

      // reset
      if (!isSpeed && id !== 'FIRE') {
        accelerations[id].acceleration.set(0,0,0)
      }

      // update
      if (this.keysDown.indexOf(Number(key)) !== -1) { 
        if (id === 'FIRE') {
          if (!this.fireTimer) {
            this.fireTimer = fireDelay
            this.fire()
          }

          return
        }

        const { acceleration, inc, min, max, point } = accelerations[id]

        if (isSpeed) {
          if (max) {
            acceleration.z = Math.min(acceleration.z + inc.z, max)
          } else if (min) {
            acceleration.z = Math.max(acceleration.z + inc.z, min)
          }
        } else {
          acceleration.x += inc.x
          acceleration.y += inc.y
          acceleration.z += inc.z

          this.body.applyLocalImpulse(acceleration, point)
        }
      }

      if (!isSpeed && id !== 'FIRE') {
        this.drawForce(id)
      }
    })

    this.drawForce('SPEED_UP')
    this.drawForce('SPEED_DOWN')

    this.body.applyLocalImpulse(linearAcceleration, this.center)
  }

  onKeyDown(e) {
    if (keys.indexOf(String(e.which)) !== -1 && this.keysDown.indexOf(e.which) === -1) {
      console.log(keysMap[e.which])
      this.keysDown.push(e.which)
    }
  }

  onKeyUp(e) {
    const index = this.keysDown.indexOf(e.which)
    if (index !== -1) {
      this.keysDown.splice(index, 1)
    }
  }

  update() {
  	this.applyControls()

  	this.group.position.copy(this.body.position)
    this.group.quaternion.copy(this.body.quaternion)
  }
}

export default Spaceship