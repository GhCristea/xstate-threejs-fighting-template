# Coding conventions

These rules are here to stop accidental architecture drift.

## XState (Logic)

- Use **XState v5** patterns: `setup(...)`, `createMachine(...)`, `createActor(...)`.
- Hydrate machines with **`input`** (from JSON/DB). Avoid hardcoded stats inside the machine when possible.
- Never mutate actor context from outside. Communicate via `.send({ type: 'EVENT' })`.

## Three.js (Visuals)

- Don’t allocate new geometries/materials every frame.
- Sync visuals from state snapshots: `actor.getSnapshot().matches('state')`.
- If you add temporary objects (particles, decals), dispose geometry/materials when removed.

## Input system

- Keyboard events translate to **actions**, actions become **intents**.
- Combo detection should use the input buffer; do not embed combo logic inside XState.

## Collisions

- Prefer a single collision pass in the fixed-timestep update.
- Avoid "infinite hit" bugs: debounce hits (state gate like `!matches('hurt')`, active-frame IDs, or hit tokens).

## Persistence (Drizzle / SQLite)

- Schema lives in `src/db/schema.ts`.
- Keep persistence adapters thin; `main.ts` should request/save state, not have SQL details everywhere.

## Folder boundaries

- `src/logic/`: state machines, actor wrappers, AI
- `src/input/`: input mapping + buffering
- `src/data/`: static JSON content
- `src/db/`: persistence
- `src/main.ts`: composition root (loop + systems wiring)
