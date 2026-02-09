# Coding conventions (few-shot)

LLMs follow concrete diffs better than abstract warnings. Prefer examples.

## XState (Logic)

**Rule:** XState is the source of truth. Machines are pure (no Three.js, no DOM).

❌ Bad (hardcoded + coupled):

```ts
import { createMachine } from 'xstate'

export const machine = createMachine({
  context: { hp: 100 },
  actions: {
    render: () => mesh.material.color.set('red') // Three.js in logic
  }
})
```

✅ Good (hydrated + pure):

```ts
import { setup, assign } from 'xstate'

export const fighterMachine = setup({
  actions: { takeDamage: assign({ hp: ({ context }) => Math.max(0, context.hp - 10) }) }
}).createMachine({ context: ({ input }) => ({ hp: input.stats.maxHp, maxHp: input.stats.maxHp }) })
```

## Three.js (Visuals)

**Rule:** Visuals are a function of state (read snapshot → render), not the other way around.

❌ Bad (rules in render phase):

```ts
// Inside a render loop
if (keyboard.space) {
  mesh.position.y += 1 // Physics inside variable render phase!
}
renderer.render(scene, camera)
```

✅ Good (state-driven visuals):

```ts
// FighterActor.update(dt) - called during fixed tick
const snap = this.actor.getSnapshot()
if (snap.matches('hurt')) {
  ;(this.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff)
}
```

## Game Loop

**Rule:** Use `GameEngine` for loop management. Do not write raw `requestAnimationFrame` loops in `main.ts`.

✅ Good:

```ts
const engine = new GameEngine()
engine.onTick(dt => {
  // Fixed update logic
})
engine.onRender(() => {
  renderer.render(scene, camera)
})
engine.start()
```

## Input

**Rule:** No `addEventListener` inside actors/machines. InputSystem produces intents.

✅ Good:

```ts
// main.ts
const intent = inputSystem.update()
if (intent?.type === 'ATTACK') {
  player.actor.send({ type: 'PUNCH', variant: intent.variant } as any)
}
```

## Collisions

**Rule:** One collision pass per fixed update, and debounce hits.

✅ Good (state gate debounce):

```ts
if (attacker.matches('attacking') && dist < HIT_RANGE) {
  if (!defender.matches('hurt') && !defender.matches('ko')) {
    defenderActor.send({ type: 'HIT_RECEIVED' })
  }
}
```

## Persistence

**Rule:** Keep persistence adapters thin; don’t spread DB code across gameplay.

✅ Good:

```ts
// main.ts (composition root)
const profile = await profileRepo.load()
// then send event to actor, don’t mutate context directly
actor.send({ type: 'LOAD_PROFILE', profile } as any)
```

## Folder boundaries

- `src/core/`: engine infrastructure (GameEngine)
- `src/logic/`: state machines, actor wrappers, AI
- `src/input/`: input mapping + buffering
- `src/data/`: static JSON content
- `src/db/`: persistence
- `src/main.ts`: composition root (wires everything together)
