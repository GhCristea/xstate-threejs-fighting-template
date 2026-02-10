import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VHSShader } from '../shaders/VHSShader'
import { FighterActor } from '../logic/FighterActor'

// This simple system maps Logic Actors -> Visual Meshes
export class RendererSystem {
  private meshes: Map<FighterActor, THREE.Mesh> = new Map()
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer
  private vhsPass: ShaderPass

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    actors: FighterActor[]
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    // Setup Post-Processing
    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.vhsPass = new ShaderPass(VHSShader)
    this.composer.addPass(this.vhsPass)

    // Init meshes
    actors.forEach(actor => this.createMesh(actor))
  }

  private createMesh(actor: FighterActor) {
    const geometry = new THREE.BoxGeometry(1, 2, 0.5)
    // Using MeshPhongMaterial for better light interaction if we want it, or keep Standard
    const material = new THREE.MeshStandardMaterial({ color: actor.baseColor })
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
    this.meshes.set(actor, mesh)
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  update(dt: number) {
    // 1. Update Visuals
    for (const [actor, mesh] of this.meshes) {
      const state = actor.visualState
      mesh.position.set(state.x, state.y, 0) // Logic is 2D, Visual is 3D
      ;(mesh.material as THREE.MeshStandardMaterial).color.setHex(state.color)
    }

    // 2. Update Shader Uniforms
    this.vhsPass.uniforms.time.value += dt
  }

  render() {
    this.composer.render()
  }
}
