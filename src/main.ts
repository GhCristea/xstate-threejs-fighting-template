import * as THREE from 'three'
import { InputSystem } from './input/InputSystem'
import fighterData from './data/fighters.json'
import { FighterActor } from './logic/FighterActor'
import { AIController } from './logic/AIController'
import { GameEngine } from './core/GameEngine'
import { RendererSystem } from './systems/RendererSystem'

// --- INIT SCENE ---
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040)
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 10, 7)
scene.add(ambientLight, dirLight)

// Floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x333333 }))
floor.rotation.x = -Math.PI / 2
scene.add(floor)

// --- INIT ACTORS ---
// 1. Player (Seagal) - LOGIC ONLY
const player = new FighterActor({ x: -2, y: 1 }, 0x00ff00, fighterData.steven_seagal)
player.start()

// 2. NPC (Chuck) - LOGIC ONLY
const npc = new FighterActor({ x: 2, y: 1 }, 0xff0000, fighterData.chuck_norris)
npc.start()

// --- RENDERER SYSTEM (The Glue) ---
const renderSystem = new RendererSystem(scene, [player, npc])

// --- INIT SYSTEMS ---
const inputSystem = new InputSystem()
inputSystem.registerCombo('JOINT_LOCK', ['DOWN', 'RIGHT', 'HEAVY_PUNCH'])

const aiController = new AIController(npc, player)

camera.position.set(0, 3, 8)
camera.lookAt(0, 1, 0)

// --- UI ELEMENTS ---
const p1HpBar = document.getElementById('p1-hp')
const p2HpBar = document.getElementById('p2-hp')
const koScreen = document.getElementById('ko-screen')

// --- GAME LOOP ---
const engine = new GameEngine()

engine.onTick(dt => {
  // 1. Update Player
  const intent = inputSystem.update()
  if (intent) {
    if (intent.type === 'COMBO') player.send({ type: 'SPECIAL_MOVE', name: intent.name })
    if (intent.type === 'ATTACK') player.send({ type: 'PUNCH', variant: intent.variant })
    if (intent.type === 'BLOCK') player.send({ type: 'BLOCK' })

    if (intent.type === 'MOVEMENT') {
      player.move(intent.vector, dt)
    }
  } else {
    const pState = player.actor.getSnapshot()
    if (pState.matches('walking')) {
      player.send({ type: 'STOP' })
    }
  }

  // 2. Update NPC
  aiController.update(dt)

  // 3. Update Visuals (One-way binding)
  renderSystem.update()

  // 4. Collisions
  checkCollisions()

  // 5. Update UI
  updateUI()
})

engine.onRender(() => {
  renderer.render(scene, camera)
})

engine.start()

function checkCollisions() {
  const pState = player.actor.getSnapshot()
  const nState = npc.actor.getSnapshot()

  // Simple 1D distance check
  const dist = Math.abs(player.position.x - npc.position.x)
  const HIT_RANGE = 1.5

  // Player Hits NPC
  if (pState.matches('attacking') && dist < HIT_RANGE) {
    if (
      !nState.matches('hurt')
      && !nState.matches('blocking')
      && !nState.matches('counterWindow')
      && !nState.matches('ko')
    ) {
      npc.send({ type: 'HIT_RECEIVED' })
    }
  }

  // NPC Hits Player
  if (nState.matches('attacking') && dist < HIT_RANGE) {
    if (
      !pState.matches('hurt')
      && !pState.matches('blocking')
      && !pState.matches('counterWindow')
      && !pState.matches('ko')
    ) {
      player.send({ type: 'HIT_RECEIVED' })
    }
  }
}

function updateUI() {
  const p1State = player.actor.getSnapshot()
  const p2State = npc.actor.getSnapshot()

  const p1Pc = (p1State.context.hp / p1State.context.maxHp) * 100
  const p2Pc = (p2State.context.hp / p2State.context.maxHp) * 100

  if (p1HpBar) p1HpBar.style.width = `${p1Pc}%`
  if (p2HpBar) p2HpBar.style.width = `${p2Pc}%`

  if (p1State.matches('ko') || p2State.matches('ko')) {
    if (koScreen) koScreen.style.display = 'block'
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
