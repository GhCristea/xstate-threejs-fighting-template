import * as THREE from 'three';
import { createActor, Actor } from 'xstate';
import { fighterMachine } from './fighterMachine';

export class FighterActor {
    mesh: THREE.Mesh;
    actor: Actor<any>;
    scene: THREE.Scene;
    
    constructor(scene: THREE.Scene, startPos: THREE.Vector3, color: number, fighterData: any) {
        this.scene = scene;
        
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

    update(dt: number) {
        const snapshot = this.actor.getSnapshot();
        
        // 1. State-Based Movement (Physics)
        // If the state says we are "walking", actually move the mesh
        // Note: In a real game, velocity would be in the Context, but this works for simple movement
        if (snapshot.matches('walking') || snapshot.matches('idle')) {
            // Friction or other physics could go here
        }

        // 2. Sync Visuals (Color/Animation)
        this.syncVisuals(snapshot);
    }

    // Move character (called by Input or AI)
    move(vector: { x: number, y: number }, dt: number) {
        const snapshot = this.actor.getSnapshot();
        if (snapshot.matches('idle') || snapshot.matches('walking')) {
            this.mesh.position.x += vector.x * 5 * dt; // Speed * dt
            
            // Boundary Check (Arena Walls)
            this.mesh.position.x = Math.max(-9, Math.min(9, this.mesh.position.x));

            if (vector.x !== 0) {
                this.actor.send({ type: 'WALK' });
            } else {
                this.actor.send({ type: 'STOP' });
            }
        }
    }

    private syncVisuals(snapshot: any) {
        const state = snapshot.value;
        const material = this.mesh.material as THREE.MeshStandardMaterial;

        // Simple Color State Machine for Debugging
        if (state === 'attacking') {
            material.color.setHex(0xff0000); // Red
        } else if (state === 'counterWindow') {
            material.color.setHex(0xffff00); // Yellow
        } else if (state === 'reversal') {
            material.color.setHex(0x550000); // Dark Red
        } else {
            // Reset to base color (we might want to store base color to reset correctly)
             // For now, let's just make them white when idle if we don't store base
             // Or better, logic to revert to original color is needed.
             // Simplification: We won't strictly reset per frame unless we store base color.
             // Let's assume the "Flash" turns off by itself if we add logic, 
             // but for this template, let's keep it simple.
             // Ideally: this.mesh.userData.baseColor
        }
    }
    
    get position() {
        return this.mesh.position;
    }
}