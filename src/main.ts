import * as THREE from 'three';
import { createActor } from 'xstate';
import { fighterMachine } from './logic/fighterMachine';
import { InputSystem } from './input/InputSystem';
import fighterData from './data/fighters.json';
import { checkAttackCollision } from './physics/CollisionSystem';

// --- INIT ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(ambientLight, dirLight);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- 1. SPAWN FIGHTERS ---

// A. STEVEN SEAGAL (Player 1)
const seagalGeometry = new THREE.BoxGeometry(1, 2, 0.5);
const seagalMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green
const seagalMesh = new THREE.Mesh(seagalGeometry, seagalMaterial);
seagalMesh.position.set(-2, 1, 0); // Start on Left
scene.add(seagalMesh);

const seagalActor = createActor(fighterMachine, {
    input: fighterData.steven_seagal
}).start();

// B. CHUCK NORRIS (CPU / Opponent)
const chuckGeometry = new THREE.BoxGeometry(1, 2, 0.5);
const chuckMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue (initial)
const chuckMesh = new THREE.Mesh(chuckGeometry, chuckMaterial);
chuckMesh.position.set(2, 1, 0); // Start on Right
scene.add(chuckMesh);

const chuckActor = createActor(fighterMachine, {
    input: fighterData.chuck_norris
}).start();

camera.position.set(0, 3, 6);
camera.lookAt(0, 1, 0);

const inputSystem = new InputSystem();
inputSystem.registerCombo('JOINT_LOCK', ['DOWN', 'RIGHT', 'HEAVY_PUNCH']);

// --- GAME LOOP ---
const CLOCK = new THREE.Clock();
const FIXED_TIME_STEP = 1 / 60;
let accumulator = 0;

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = CLOCK.getDelta();
    accumulator += deltaTime;

    while (accumulator >= FIXED_TIME_STEP) {
        updateLogic(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
    }

    renderer.render(scene, camera);
}

function updateLogic(dt: number) {
    // 1. PLAYER INPUT (Seagal)
    const intent = inputSystem.update(); 
    
    if (intent) {
        if (intent.type === 'COMBO') {
            seagalActor.send({ type: 'SPECIAL_MOVE', name: intent.name } as any);
        } else if (intent.type === 'ATTACK') {
            seagalActor.send({ type: 'PUNCH', variant: intent.variant } as any);
        } else if (intent.type === 'BLOCK') {
            seagalActor.send({ type: 'BLOCK' });
        } else if (intent.type === 'MOVEMENT') {
            const snapshot = seagalActor.getSnapshot();
            if (snapshot.matches('idle') || snapshot.matches('walking')) {
                seagalMesh.position.x += intent.vector.x * 5 * dt;
                seagalMesh.position.x = Math.max(-8, Math.min(8, seagalMesh.position.x));

                if (intent.vector.x !== 0) seagalActor.send({ type: 'WALK' });
            }
        }
    }
    
    // 3. COLLISION & HIT CONFIRMATION
    const seagalState = seagalActor.getSnapshot();
    const chuckState = chuckActor.getSnapshot();

    if (seagalState.matches('attacking') || seagalState.matches('specialMove')) {
        if (checkAttackCollision(seagalMesh, chuckMesh)) {
            if (!chuckState.matches('blocking') && !chuckState.matches('counterWindow')) {
                console.log("HIT CONFIRMED: Chuck took damage!");
                chuckActor.send({ type: 'HIT_RECEIVED' });
                chuckMesh.position.x += 0.1; 
            } else {
                console.log("BLOCKED! Chuck is unimpressed.");
            }
        }
    }

    syncVisuals();
}

function syncVisuals() {
    updateMeshColor(seagalMesh, seagalActor);
    updateMeshColor(chuckMesh, chuckActor);
}

function updateMeshColor(mesh: THREE.Mesh, actor: any) {
    const state = actor.getSnapshot().value;
    const material = mesh.material as THREE.MeshStandardMaterial;

    if (state === 'attacking' || state === 'specialMove') {
        material.color.setHex(0xff0000); // Red (Attack)
    } else if (state === 'counterWindow') {
        material.color.setHex(0xffff00); // Yellow (Counter/Block)
    } else if (state === 'reversal') {
        material.color.setHex(0x550000); // Dark Red (Pain/Reversal)
    } else if (state === 'hurt') {
         material.color.setHex(0xffffff); // White (Flash for hurt)
    } else {
        if (mesh === seagalMesh) material.color.setHex(0x00ff00);
        else material.color.setHex(0x0000ff); // Chuck is Blue
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});