# Architecture guide

This document is the "constitution" for the engine. If you change the loop, keep these invariants.

## The Brain / Body / Nerves split

### Brain (rules)

- **Where:** `src/logic/fighterMachine.ts`
- **Tech:** XState v5
- **Owns:** Legal transitions, HP/KO, timers, move gates (e.g., can't walk while hurt)
- **Must not:** Import Three.js or reference meshes/camera/renderer

### Body (rendering)

- **Where:** `src/logic/FighterActor.ts`
- **Tech:** Three.js
- **Owns:** Scene graph, meshes, materials, animations, camera
- **Must not:** Compute damage, decide move legality, or store canonical match state

### Nerves (inputs)

- **Where:** `src/input/InputSystem.ts`
- **Owns:** Key mapping, input buffer, combo detection
- **Produces:** Semantic intents (MOVE/BLOCK/PUNCH/COMBO)

## The fixed timestep loop

The loop logic is encapsulated in `src/core/GameEngine.ts`. It uses a semi-fixed timestep accumulator.

- **`tick(dt)`**: Runs multiple times per frame if needed (logic, physics, AI). Fixed `dt` (e.g., 1/60).
- **`render()`**: Runs once per frame (visuals).

Pseudo-implementation (in `GameEngine.ts`):

```ts
loop() {
  requestID = requestAnimationFrame(loop);
  const delta = clock.getDelta();
  accumulator += delta;

  while (accumulator >= fixedTimeStep) {
    this.tick(fixedTimeStep); // Emits 'tick' event
    accumulator -= fixedTimeStep;
  }
  
  this.render(); // Emits 'render' event
}
```

### What belongs in the `tick` callback

- Read intents from `InputSystem`
- Run AI decisions (throttled)
- Run collisions + send `HIT_RECEIVED`
- Read snapshots for HUD percentages
- Update actor logic (state transitions)

### What belongs in the `render` callback

- `renderer.render(scene, camera)`
- Non-authoritative interpolation (if added later)

## Adding a feature: placement test

When asked to "add feature X", classify it:

- **Rule change** (damage, hitstun, KO, cooldowns) → XState machine
- **Feedback change** (VFX, animation, camera shake) → Three.js (Body)
- **Control change** (rebinding, combos, gamepad) → InputSystem (Nerves)
- **Persistence** (profiles, mastery, history) → `src/db/*` + a small adapter used by `main.ts`
