# Testing guide

The project aims for stable gameplay under a fixed timestep loop. Testing focuses on:

- **Loop invariants**: logic runs in fixed steps; rendering is separate.
- **State-machine behavior**: transitions, timers, and KO conditions.
- **Regression checks**: prevent "logic in render" drift.

## What to test first

1. **State transitions**: `idle → attacking → idle`, `hurt → ko` when HP reaches 0.
2. **Debounce**: A single attack should not apply damage every tick.
3. **KO freeze**: Once in `ko`, the actor should stop responding to input/AI.

## Suggested approach (lightweight)

- Prefer unit tests around the XState machine (fast, deterministic).
- Add a smoke test that boots the loop and runs a few fixed steps.

> Note: A test runner is not wired yet in this template. If you add one, document it here.
