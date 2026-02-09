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
- **Owns:** Scene graph objects (meshes/materials/animations) and state→visual mapping
- **Must not:** Compute damage, decide move legality, or store canonical match state

### Nerves (inputs)

- **Where:** `src/input/InputSystem.ts`
- **Owns:** Key mapping, input buffer, combo detection
- **Produces:** Semantic intents (MOVE/BLOCK/PUNCH/COMBO)

## The fixed timestep loop

The loop is owned by `src/core/GameEngine.ts`.

Design goals:

- **Decoupled from Three.js**: no `THREE.Clock` dependency.
- **Testable**: can inject a time source + scheduler.
- **Stable under stalls**: clamp delta to avoid the spiral-of-death.

The engine emits two phases:

- **Tick**: fixed `dt` updates, may run multiple times per frame
- **Render**: runs once per frame

Pseudo:

```ts
engine.onTick((dt) => updateGameLogic(dt));
engine.onRender(() => renderer.render(scene, camera));
engine.start();
```

### What belongs in the tick phase

- Read intents from `InputSystem`
- Run AI decisions (throttled)
- Run collisions + send `HIT_RECEIVED`
- Read snapshots for HUD percentages
- Update actor visuals (if your visuals are state-driven and cheap)

### What belongs in the render phase

- `renderer.render(scene, camera)`
- Non-authoritative interpolation (if added later)

## Adding a feature: placement test

When asked to "add feature X", classify it:

- **Rule change** (damage, hitstun, KO, cooldowns) → XState machine
- **Feedback change** (VFX, animation, camera shake) → Three.js (Body)
- **Control change** (rebinding, combos, gamepad) → InputSystem (Nerves)
- **Persistence** (profiles, mastery, history) → `src/db/*` + a small adapter used by `main.ts`
