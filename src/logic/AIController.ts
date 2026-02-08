import { FighterActor } from './FighterActor';

export class AIController {
    npc: FighterActor;
    target: FighterActor;
    reactionTime: number;
    timer: number;

    constructor(npc: FighterActor, target: FighterActor) {
        this.npc = npc;
        this.target = target;
        this.reactionTime = 0.5; // Update AI every 0.5 seconds
        this.timer = 0;
    }

    update(dt: number) {
        // AI "Tick" Rate (Don't update every single frame to simulate reaction time)
        this.timer += dt;
        if (this.timer < this.reactionTime) return;
        this.timer = 0;

        const dist = this.npc.position.distanceTo(this.target.position);
        const direction = this.target.position.x - this.npc.position.x;
        const attackRange = 1.5;

        // 1. Check State
        const npcState = this.npc.actor.getSnapshot();
        const targetState = this.target.actor.getSnapshot();

        // 2. Decision Tree
        if (dist > attackRange) {
            // WALK towards player
            const dirX = direction > 0 ? 1 : -1;
            this.npc.move({ x: dirX, y: 0 }, dt * 20); // Scale dt up since we only run periodically
        } else {
            // ATTACK range
            if (Math.random() > 0.3) {
                // 70% chance to attack
                this.npc.actor.send({ type: 'PUNCH', variant: 'heavy' });
            } else {
                // 30% chance to block or wait
                 this.npc.actor.send({ type: 'BLOCK' });
            }
        }
    }
}