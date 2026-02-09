import * as THREE from 'three';

type TickCallback = (dt: number) => void;
type RenderCallback = () => void;

export class GameEngine {
    private clock: THREE.Clock;
    private fixedTimeStep: number;
    private accumulator: number;
    private isRunning: boolean;
    private requestID: number | null;

    private tickListeners: TickCallback[] = [];
    private renderListeners: RenderCallback[] = [];

    constructor(fixedTimeStep: number = 1 / 60) {
        this.clock = new THREE.Clock();
        this.fixedTimeStep = fixedTimeStep;
        this.accumulator = 0;
        this.isRunning = false;
        this.requestID = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.requestID !== null) {
            cancelAnimationFrame(this.requestID);
            this.requestID = null;
        }
        this.clock.stop();
    }

    onTick(callback: TickCallback) {
        this.tickListeners.push(callback);
    }

    onRender(callback: RenderCallback) {
        this.renderListeners.push(callback);
    }

    private loop = () => {
        if (!this.isRunning) return;

        this.requestID = requestAnimationFrame(this.loop);

        const deltaTime = this.clock.getDelta();
        this.accumulator += deltaTime;

        while (this.accumulator >= this.fixedTimeStep) {
            this.tick(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }

        this.render();
    };

    private tick(dt: number) {
        for (const listener of this.tickListeners) {
            listener(dt);
        }
    }

    private render() {
        for (const listener of this.renderListeners) {
            listener();
        }
    }
}