import * as THREE from 'three';
import { InputSystem } from './input/InputSystem';
import fighterData from './data/fighters.json';
import { FighterActor } from './logic/FighterActor';
import { AIController } from './logic/AIController';

// --- INIT SCENE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(ambientLight, dirLight);

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- INIT ACTORS ---
// 1. Player (Seagal)
const player = new FighterActor(
    scene, 
    new THREE.Vector3(-2, 1, 0), 
    0x00ff00, // Green
    fighterData.steven_seagal
);
player.start();

// 2. NPC (Chuck)
const npc = new FighterActor(
    scene, 
    new THREE.Vector3(2, 1, 0), 
    0xff0000, // Red
    fighterData.chuck_norris
);
npc.start();

// --- INIT SYSTEMS ---
const inputSystem = new InputSystem();
inputSystem.registerCombo('JOINT_LOCK', ['DOWN', 'RIGHT', 'HEAVY_PUNCH']);

const aiController = new AIController(npc, player);

camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

// --- GAME LOOP ---
const CLOCK = new THREE.Clock();
const FIXED_TIME_STEP = 1 / 60;
let accumulator = 0;

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = CLOCK.getDelta();
    accumulator += deltaTime;

    while (accumulator >= FIXED_TIME_STEP) {
        updateGameLogic(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
    }

    renderer.render(scene, camera);
}

function updateGameLogic(dt: number) {
    // 1. Update Player via Input
    const intent = inputSystem.update();
    if (intent) {
        if (intent.type === 'COMBO') player.actor.send({ type: 'SPECIAL_MOVE', name: intent.name });
        if (intent.type === 'ATTACK') player.actor.send({ type: 'PUNCH', variant: intent.variant });
        if (intent.type === 'BLOCK') player.actor.send({ type: 'BLOCK' });
        
        // Movement is handled by the Actor's move method now
        if (intent.type === 'MOVEMENT') {
            player.move(intent.vector, dt);
        }
    }

    // 2. Update NPC via AI
    aiController.update(dt);

    // 3. Update Actor Internal Logic (Visual sync, state expiry)
    player.update(dt);
    npc.update(dt);

    // 4. Global Collision / Rules
    checkCollisions();
}

function checkCollisions() {
    // Simple Box collision for Hit detection
    const pState = player.actor.getSnapshot();
    const nState = npc.actor.getSnapshot();
    const dist = player.position.distanceTo(npc.position);
    const HIT_RANGE = 1.2;

    // Player Hitting NPC
    if (pState.matches('attacking') && dist < HIT_RANGE) {
        if (!nState.matches('blocking') && !nState.matches('counterWindow')) {
            npc.actor.send({ type: 'HIT_RECEIVED' });
            // Knockback
            npc.mesh.position.x += 0.2; 
        }
    }

    // NPC Hitting Player
    if (nState.matches('attacking') && dist < HIT_RANGE) {
        if (!pState.matches('blocking') && !pState.matches('counterWindow')) {
            player.actor.send({ type: 'HIT_RECEIVED' });
            // Knockback
            player.mesh.position.x -= 0.2;
        }
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});