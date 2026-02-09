import * as THREE from 'three';
import { FighterActor } from '../logic/FighterActor';

// This simple system maps Logic Actors -> Visual Meshes
export class RendererSystem {
    private meshes: Map<FighterActor, THREE.Mesh> = new Map();
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, actors: FighterActor[]) {
        this.scene = scene;
        actors.forEach(actor => this.createMesh(actor));
    }

    private createMesh(actor: FighterActor) {
        const geometry = new THREE.BoxGeometry(1, 2, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: actor.baseColor });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.meshes.set(actor, mesh);
    }

    update() {
        for (const [actor, mesh] of this.meshes) {
            const state = actor.visualState;
            mesh.position.set(state.x, state.y, 0); // Logic is 2D, Visual is 3D
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(state.color);
        }
    }
}
