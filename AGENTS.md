# AGENTS.md

> **Stop & read**: This repository uses a strict **fixed-timestep (semi-deterministic) game loop**.
>
> - **No React.**
> - Keep **rules** in XState, keep **rendering** in Three.js.
> - Avoid writing gameplay logic inside the variable render phase.

## What this repo is

A minimal fighting-game template using:

- **Logic (Brain):** XState v5 (`src/logic/fighterMachine.ts`)
- **Visuals (Body):** Three.js (`src/main.ts`, `src/logic/FighterActor.ts`)
- **Input (Nerves):** Buffered keyboard intents (`src/input/InputSystem.ts`)
- **UI (HUD):** DOM overlay (`index.html`)

## Progressive disclosure map

If you’re touching code, read the smallest relevant doc first:

1. **Start here:** [`README.md`](README.md)
2. **If editing the loop or architecture:** [`docs/agents/architecture.md`](docs/agents/architecture.md)
3. **If adding features:** [`docs/agents/conventions.md`](docs/agents/conventions.md)

## Critical boundaries (non-negotiable)

1. **Visuals are slaves:** Three.js meshes never decide rules; they only reflect state.
2. **No gameplay in render phase:** Put rules, collisions, and state transitions in the fixed-timestep update.
3. **Inputs are buffered:** Don’t bind `keydown` to gameplay directly; go through `InputSystem`.

## Quick commands

```bash
npm install
npm run dev
```
