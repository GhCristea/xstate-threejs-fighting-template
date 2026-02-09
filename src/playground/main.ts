import * as THREE from 'three'
import { createActor } from 'xstate'
import { GameEngine } from '../core/GameEngine'
import { createPlaygroundMachine } from './playground.machine'
import { createSceneWorld } from './world'

// Devtools: Stately Inspector (XState v5)
// Note: createBrowserInspector may open a popup/tab; allow popups for localhost.
let inspector: { inspect: any } | null = null
if (import.meta.env.DEV) {
  // Lazy import so prod builds don't pull inspector code.
  const mod = await import('@statelyai/inspect')
  inspector = mod.createBrowserInspector()
}

const app = document.getElementById('app')
if (!app) throw new Error('Missing #app')

// --- Three.js shell ---
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b0d10)

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(6, 6, 10)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
app.appendChild(renderer.domElement)

// Lighting / helpers
scene.add(new THREE.AmbientLight(0xffffff, 0.45))
const dir = new THREE.DirectionalLight(0xffffff, 1)
dir.position.set(5, 10, 7)
scene.add(dir)

const grid = new THREE.GridHelper(40, 40, 0x334155, 0x1f2937)
scene.add(grid)

const axes = new THREE.AxesHelper(2)
scene.add(axes)

// --- World adapter (no fighting constraints) ---
const world = createSceneWorld({ scene, camera, domElement: renderer.domElement })

// --- State machine owns "tool" state; world is an adapter ---
const machine = createPlaygroundMachine({ world })
const service = createActor(machine, {
  inspect: inspector?.inspect
})
service.start()

// --- Simple HUD wiring ---
const toolLabel = document.getElementById('tool')
const spawnBtn = document.getElementById('spawn')
const toggleToolBtn = document.getElementById('toggle-tool')
const pauseBtn = document.getElementById('pause')

service.subscribe(snapshot => {
  if (toolLabel) toolLabel.textContent = `Tool: ${snapshot.context.tool}`
})

spawnBtn?.addEventListener('click', () => service.send({ type: 'SPAWN_CUBE' }))

toggleToolBtn?.addEventListener('click', () => service.send({ type: 'TOGGLE_TOOL' }))

let paused = false
pauseBtn?.addEventListener('click', () => {
  paused = !paused
  pauseBtn.textContent = paused ? 'Resume' : 'Pause'
})

// Pointer / key events
renderer.domElement.addEventListener('pointerdown', ev => {
  renderer.domElement.setPointerCapture(ev.pointerId)
  service.send({ type: 'POINTER_DOWN', x: ev.clientX, y: ev.clientY })
})

renderer.domElement.addEventListener('pointermove', ev => {
  service.send({ type: 'POINTER_MOVE', x: ev.clientX, y: ev.clientY })
})

renderer.domElement.addEventListener('pointerup', ev => {
  service.send({ type: 'POINTER_UP', x: ev.clientX, y: ev.clientY })
})

window.addEventListener('keydown', ev => {
  if (ev.code === 'Space') service.send({ type: 'TOGGLE_TOOL' })
})

// --- Engine reuse (but not limiting) ---
// Reuse fixed-step tick for deterministic tool interactions; render stays separate.
const engine = new GameEngine({ fixedTimeStep: 1 / 60 })

engine.onTick(dt => {
  if (paused) return
  world.update(dt)
})

engine.onRender(() => {
  renderer.render(scene, camera)
})

engine.start()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
