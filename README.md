# XState + Three.js Fighting Template

A minimal, deterministic(ish) in-browser fighting-game template:

- **Brain**: [XState](https://xstate.js.org/) for character logic (idle/walk/attack/hurt/KO).
- **Body**: [Three.js](https://threejs.org/) for visuals.
- **Nerves**: Input buffering + action mapping (keyboard today; gamepad later).
- **HUD**: Plain HTML/CSS overlay (health bars + K.O. screen).

This repo intentionally keeps things small, readable, and hackable.

## Run locally

Prereqs:

- Node.js 18+ (recommended: latest LTS)

Install + run:

```bash
npm install
npm run dev
```

Build + preview:

```bash
npm run build
npm run preview
```

## Controls

Default mapping lives in `src/input/InputSystem.ts`.

- Move: Arrow keys
- Light punch: `Z`
- Heavy punch: `X`
- Block: `C`
- Ultimate: `Space`

Combos are detected via the input buffer; currently registered in `src/main.ts`:

- `JOINT_LOCK`: `Down` → `Right` → `Heavy Punch`

## Project structure

```text
src/
  main.ts                    # Game loop + orchestration + HUD sync
  data/
    fighters.json            # Character definitions (maxHp, etc.)
  input/
    InputSystem.ts           # Action mapping + input buffer + combo detection
  logic/
    fighterMachine.ts        # XState fighter machine (HP, KO)
    FighterActor.ts          # Wraps mesh + XState actor
    AIController.ts          # Simple NPC brain
  db/
    schema.ts                # Drizzle (placeholder; not wired into runtime yet)
```

## Architecture

### Core loop

- The renderer runs every animation frame.
- The simulation runs at a fixed timestep (`1/60`) using an accumulator.
- `main.ts` orchestrates input, AI, actors, collision rules, and UI sync.

Key files:

- `src/main.ts`: single place where systems are composed.
- `src/logic/FighterActor.ts`: "entity" wrapper; keeps main loop clean.
- `src/logic/fighterMachine.ts`: game rules + HP + KO.

### Health + KO

- `fighters.json` defines `maxHp` per character.
- `fighterMachine.ts` initializes `context.hp/maxHp` from input.
- On `HIT_RECEIVED`, fighter enters `hurt`, applies damage, then transitions to `ko` (final) if `hp <= 0`.

### HUD

`index.html` contains a fixed-position HUD overlay:

- Two health bars bound to `#p1-hp` and `#p2-hp`
- KO banner bound to `#ko-screen`

`src/main.ts` reads XState snapshots and updates DOM widths as percentages.

## Mermaid diagrams

### Systems overview

```mermaid
flowchart LR
  Input["InputSystem<br/>(keyboard + buffer)"] --> Main["main.ts<br/>fixed-timestep loop"]
  AI["AIController"] --> Main

  Main --> P1["FighterActor: Player<br/>(mesh + xstate actor)"]
  Main --> P2["FighterActor: NPC<br/>(mesh + xstate actor)"]

  P1 --> Three["Three.js<br/>Renderer"]
  P2 --> Three

  Main --> HUD["HUD<br/>(index.html DOM)"]
```

### Fighter state machine

```mermaid
stateDiagram-v2
  [*] --> idle

  idle --> walking: WALK
  walking --> idle: STOP

  idle --> attacking: PUNCH
  walking --> attacking: PUNCH
  attacking --> idle: after 400ms

  idle --> counterWindow: BLOCK
  walking --> counterWindow: BLOCK
  counterWindow --> idle: after 300ms
  counterWindow --> reversal: HIT_RECEIVED
  reversal --> idle: after 500ms

  idle --> specialMove: SPECIAL_MOVE
  specialMove --> idle: after 1000ms

  idle --> hurt: HIT_RECEIVED
  walking --> hurt: HIT_RECEIVED
  attacking --> hurt: HIT_RECEIVED
  specialMove --> hurt: HIT_RECEIVED

  hurt --> ko: after 500ms (hp <= 0)
  hurt --> idle: after 500ms (hp > 0)
  ko --> [*]
```

### Fixed-timestep update sequence

```mermaid
sequenceDiagram
  participant RAF as requestAnimationFrame
  participant Main as main.ts
  participant Input as InputSystem
  participant AI as AIController
  participant P1 as FighterActor(Player)
  participant P2 as FighterActor(NPC)
  participant HUD as DOM HUD

  RAF->>Main: frame(delta)
  loop while accumulator >= 1/60
    Main->>Input: update()
    Main->>AI: update(dt)
    Main->>P1: update(dt)
    Main->>P2: update(dt)
    Main->>Main: checkCollisions()
    Main->>HUD: updateUI(snapshot.context)
  end
  Main-->>RAF: render(scene,camera)
```

## Notes / next upgrades

- **Debounce hits properly**: add per-attack hit IDs or active-frames to prevent edge-case multi-hit.
- **Move data**: drive damage/range/active frames from `fighters.json` (or a move manifest).
- **Rollback netcode**: possible once logic is fully deterministic and input-driven.
- **Persistence**: wire Drizzle/SQLite or IndexedDB to store keybinds, stats, match history.
