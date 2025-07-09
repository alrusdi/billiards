import {
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  CircleGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ArrowHelper,
  Color,
  BufferAttribute,
  Vector3,
  TextureLoader
} from "three"
import { State } from "../model/ball"
import { norm, up, zero } from "./../utils/utils"
import { R } from "../model/physics/constants"
import { Trace } from "./trace"

const texturesMap = {
  'white': 'cue',
  'yellow': '1',
  'blue': '2',
  'red': '3',
  'purple': '4',
  'green': '5',
  'orange': '6',
  'maroon': '7',
  'black': '8',
  'yellow-stripes': '9'
}

export class BallMesh {
  mesh: Mesh
  shadow: Mesh
  spinAxisArrow: ArrowHelper
  trace: Trace
  color: Color
  name: string = "unknown"
  constructor(color, name?) {
    this.color = new Color(color)
    if (name) this.name = name
    this.initialiseMesh(color)
  }

  updateAll(ball, t) {
    this.updatePosition(ball.pos)
    this.updateArrows(ball.pos, ball.rvel, ball.state)
    if (ball.rvel.lengthSq() !== 0) {
      this.updateRotation(ball.rvel, t)
      this.trace.addTrace(ball.pos, ball.vel)
    }
  }

  updatePosition(pos) {
    this.mesh.position.copy(pos)
    this.shadow.position.copy(pos)
  }

  readonly m = new Matrix4()

  updateRotation(rvel, t) {
    const angle = rvel.length() * t
    this.mesh.rotateOnWorldAxis(norm(rvel), angle)
  }

  updateArrows(pos, rvel, state) {
    this.spinAxisArrow.setLength(R + (R * rvel.length()) / 2, R, R)
    this.spinAxisArrow.position.copy(pos)
    this.spinAxisArrow.setDirection(norm(rvel))
    if (state == State.Rolling) {
      this.spinAxisArrow.setColor(0xcc0000)
    } else {
      this.spinAxisArrow.setColor(0x00cc00)
    }
  }

  initialiseMesh(color) {
    const props = {
      color: color,
      roughness: 0.37,
      metalness: 0,
      flatShading: false,
      vertexColors: true,
      forceSinglePass: false,
    }
    if (this.name !== "unknown") {
      props.map = new TextureLoader().load(
        `images/pool/${texturesMap[this.name]}.png`
      )
      props.color = new Color(0xffffff)
    }
    const geometry = new IcosahedronGeometry(R, 5)
    const material = new MeshStandardMaterial(props)
    this.addDots(geometry, props.color)
    this.mesh = new Mesh(geometry, material)
    this.mesh.name = "ball"
    this.updateRotation(new Vector3().random(), 100)

    const shadowGeometry = new CircleGeometry(R * 0.65, 29)
    shadowGeometry.applyMatrix4(
      new Matrix4().identity().makeTranslation(0, 0, -R * 0.9)
    )
    const shadowMaterial = new MeshBasicMaterial({ color: 0x111122, transparent: true, opacity: 0.75 })
    this.shadow = new Mesh(shadowGeometry, shadowMaterial)
    this.spinAxisArrow = new ArrowHelper(up, zero, 2, 0x000000, 0.01, 0.01)
    this.spinAxisArrow.visible = false
    this.trace = new Trace(500, color)
  }

  addDots(geometry, baseColor) {
    const count = geometry.attributes.position.count
    const color = new Color(baseColor)

    geometry.setAttribute(
      "color",
      new BufferAttribute(new Float32Array(count * 3), 3)
    )

    const verticies = geometry.attributes.color
    for (let i = 0; i < count / 3; i++) {
      this.colorVerticesForFace(
        i,
        verticies,
        this.scaleNoise(color.r),
        this.scaleNoise(color.g),
        this.scaleNoise(color.b)
      )
    }
  }

  addToScene(scene) {
    scene.add(this.mesh)
    scene.add(this.shadow)
    scene.add(this.spinAxisArrow)
    scene.add(this.trace.line)
  }

  private colorVerticesForFace(face, verticies, r, g, b) {
    verticies.setXYZ(face * 3 + 0, r, g, b)
    verticies.setXYZ(face * 3 + 1, r, g, b)
    verticies.setXYZ(face * 3 + 2, r, g, b)
  }

  private scaleNoise(v) {
    return (1.0 - Math.random() * 0.25) * v
  }
}
