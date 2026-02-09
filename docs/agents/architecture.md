# Architecture guide

This document is the "constitution" for the engine. If you change the loop, keep these invariants.

## The Brain / Body / Nerves split

### Brain (rules)

- **Where:** `src/logic/fighterMachine.ts`
- **Tech:** XState v5
- **Owns:** Legal transitions, HP/KO, timers, move gates (e.g., can't walk while hurt)
- **Must not:** Import Three.js or reference meshes/camera/renderer

### Body (rendering)

- **Where:** `src/main.ts`, `src/logic/FighterActor.ts`
- **Tech:** Three.js
- **Owns:** Scene graph, meshes, materials, animations, camera
- **Must not:** Compute damage, decide move legality, or store canonical match state

### Nerves (inputs)

- **Where:** `src/input/InputSystem.ts`
- **Owns:** Key mapping, input buffer, combo detection
- **Produces:** Semantic intents (MOVE/BLOCK/PUNCH/COMBO)

## The fixed timestep loop

`src/main.ts` uses a semi-fixed timestep accumulator:

- Render: once per `requestAnimationFrame`
- Logic: multiple fixed updates per frame if needed (to catch up)

Pseudo:

```ts
function animate() {
  const delta = clock.getDelta();
  accumulator += delta;

  while (accumulator >= FIXED_STEP) {
    updateGameLogic(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  renderer.render(scene, camera);
}
```

### What belongs in `updateGameLogic()`

- Read intents from `InputSystem`
- Run AI decisions (throttled)
- Run collisions + send `HIT_RECEIVED`
- Read snapshots for HUD percentages

### What belongs in `animate()` only

- `renderer.render(scene, camera)`
- Non-authoritative interpolation (if you add it later)

## Adding a feature: placement test

When asked to "add feature X", classify it:

- **Rule change** (damage, hitstun, KO, cooldowns) → XState machine
- **Feedback change** (VFX, animation, camera shake) → Three.js (Body)
- **Control change** (rebinding, combos, gamepad) → InputSystem (Nerves)
- **Persistence** (profiles, mastery, history) → `src/db/*` + a small adapter used by `main.ts`
