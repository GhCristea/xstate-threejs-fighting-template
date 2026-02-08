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

// --- UI ELEMENTS ---
const p1HpBar = document.getElementById('p1-hp');
const p2HpBar = document.getElementById('p2-hp');
const koScreen = document.getElementById('ko-screen');

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
    // 1. Update Player
    const intent = inputSystem.update();
    if (intent) {
        if (intent.type === 'COMBO') player.actor.send({ type: 'SPECIAL_MOVE', name: intent.name } as any);
        if (intent.type === 'ATTACK') player.actor.send({ type: 'PUNCH', variant: intent.variant } as any);
        if (intent.type === 'BLOCK') player.actor.send({ type: 'BLOCK' });
        
        if (intent.type === 'MOVEMENT') {
            player.move(intent.vector, dt);
        }
    } else {
        const pState = player.actor.getSnapshot();
        if (pState.matches('walking')) {
            player.actor.send({ type: 'STOP' });
        }
    }

    // 2. Update NPC
    aiController.update(dt);

    // 3. Sync Visuals
    player.update(dt);
    npc.update(dt);

    // 4. Collisions
    checkCollisions();

    // 5. Update UI
    updateUI();
}

function checkCollisions() {
    const pState = player.actor.getSnapshot();
    const nState = npc.actor.getSnapshot();
    const dist = player.position.distanceTo(npc.position);
    const HIT_RANGE = 1.5;

    // Player Hits NPC
    if (pState.matches('attacking') && dist < HIT_RANGE) {
        if (!nState.matches('hurt') && !nState.matches('blocking') && !nState.matches('counterWindow') && !nState.matches('ko')) {
            npc.actor.send({ type: 'HIT_RECEIVED' });
            npc.mesh.position.x += 0.3; 
        }
    }

    // NPC Hits Player
    if (nState.matches('attacking') && dist < HIT_RANGE) {
        if (!pState.matches('hurt') && !pState.matches('blocking') && !pState.matches('counterWindow') && !pState.matches('ko')) {
            player.actor.send({ type: 'HIT_RECEIVED' });
            player.mesh.position.x -= 0.3;
        }
    }
}

function updateUI() {
    const p1State = player.actor.getSnapshot();
    const p2State = npc.actor.getSnapshot();

    const p1Pc = (p1State.context.hp / p1State.context.maxHp) * 100;
    const p2Pc = (p2State.context.hp / p2State.context.maxHp) * 100;

    if (p1HpBar) p1HpBar.style.width = `${p1Pc}%`;
    if (p2HpBar) p2HpBar.style.width = `${p2Pc}%`;

    if (p1State.matches('ko') || p2State.matches('ko')) {
        if (koScreen) koScreen.style.display = 'block';
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});