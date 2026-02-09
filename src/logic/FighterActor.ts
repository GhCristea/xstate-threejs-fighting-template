import * as THREE from 'three';
import { createActor, Actor } from 'xstate';
import { fighterMachine } from './fighterMachine';
import { FighterEvent } from './types';

export { FighterEvent };

export class FighterActor {
    mesh: THREE.Mesh;
    actor: Actor<any>;
    scene: THREE.Scene;
    baseColor: number;

    constructor(scene: THREE.Scene, startPos: THREE.Vector3, color: number, fighterData: any) {
        this.scene = scene;
        this.baseColor = color;

        // 1. Setup Visuals
        const geometry = new THREE.BoxGeometry(1, 2, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        this.scene.add(this.mesh);

        // 2. Setup Logic
        this.actor = createActor(fighterMachine, {
            input: fighterData
        });
    }

    start() {
        this.actor.start();
    }

    send(event: FighterEvent) {
        // Now safer because the machine actually accepts these events
        this.actor.send(event);
    }

    update(dt: number) {
        const snapshot = this.actor.getSnapshot();
        this.syncVisuals(snapshot);
    }

    move(vector: { x: number; y: number }, dt: number) {
        const snapshot = this.actor.getSnapshot();

        if (snapshot.matches('idle') || snapshot.matches('walking')) {
            this.mesh.position.x += vector.x * 5 * dt;
            this.mesh.position.x = Math.max(-9, Math.min(9, this.mesh.position.x));

            if (vector.x !== 0) {
                this.send({ type: 'WALK' });
            } else {
                this.send({ type: 'STOP' });
            }
        }
    }

    private syncVisuals(snapshot: any) {
        const state = snapshot.value;
        const material = this.mesh.material as THREE.MeshStandardMaterial;

        if (state === 'attacking') {
            material.color.setHex(0xff0000);
        } else if (state === 'counterWindow' || state === 'blocking') {
            material.color.setHex(0xffff00);
        } else if (state === 'hurt') {
            material.color.setHex(0xffffff);
        } else if (state === 'reversal') {
            material.color.setHex(0x550000);
        } else {
            material.color.setHex(this.baseColor);
        }
    }

    get position() {
        return this.mesh.position;
    }
}
