import * as THREE from 'three';
import { createActor } from 'xstate';
import { fighterMachine } from './logic/fighterMachine';
import { InputSystem } from './input/InputSystem';
import fighterData from './data/fighters.json';

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

const seagalGeometry = new THREE.BoxGeometry(1, 2, 0.5);
const seagalMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const seagalMesh = new THREE.Mesh(seagalGeometry, seagalMaterial);
seagalMesh.position.y = 1;
scene.add(seagalMesh);

camera.position.set(0, 3, 6);
camera.lookAt(0, 1, 0);

const inputSystem = new InputSystem();
inputSystem.registerCombo('JOINT_LOCK', ['DOWN', 'RIGHT', 'HEAVY_PUNCH']);

const seagalActor = createActor(fighterMachine, {
    input: fighterData.steven_seagal
});

seagalActor.start();

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
    const intent = inputSystem.update(); 

    if (intent) {
        if (intent.type === 'COMBO') {
            seagalActor.send({ type: 'SPECIAL_MOVE', name: intent.name } as any);
            console.log("COMBO FIRED:", intent.name);
        } else if (intent.type === 'ATTACK') {
            seagalActor.send({ type: 'PUNCH', variant: intent.variant } as any);
        } else if (intent.type === 'BLOCK') {
            seagalActor.send({ type: 'BLOCK' });
        } else if (intent.type === 'MOVEMENT') {
            const snapshot = seagalActor.getSnapshot();
            
            if (snapshot.matches('idle') || snapshot.matches('walking')) {
                seagalMesh.position.x += intent.vector.x * 5 * dt;
                if (intent.vector.x !== 0) seagalActor.send({ type: 'WALK' });
            }
        }
    }
    syncVisuals();
}

function syncVisuals() {
    const snapshot = seagalActor.getSnapshot();
    const state = snapshot.value;

    if (state === 'attacking') {
        seagalMesh.material.color.setHex(0xff0000);
    } else if (state === 'counterWindow') {
        seagalMesh.material.color.setHex(0xffff00);
    } else if (state === 'idle') {
        seagalMesh.material.color.setHex(0x00ff00);
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});