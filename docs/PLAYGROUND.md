## Dev tool: Playground

A sandbox to iterate on Three.js interaction + UI patterns without changing the fighting template runtime.

### Run

- Start dev server: `npm run dev`
- Open playground: `http://localhost:5173/playground.html`
- Open game (default): `http://localhost:5173/`

### Notes

- The playground reuses `GameEngine` for tick/render scheduling.
- Tool state is owned by an XState machine (`src/playground/playground.machine.ts`).
