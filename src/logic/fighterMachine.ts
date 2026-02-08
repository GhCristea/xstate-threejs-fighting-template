import { setup } from 'xstate';

export const fighterMachine = setup({
  types: {
    context: {} as any,
    input: {} as any,
    events: {} as any
  }
}).createMachine({
  id: 'fighter',
  context: ({ input }) => ({
    name: input.name,
    stamina: 100,
    regenRate: input.stats.staminaRegen,
    currentMove: null
  }),
  initial: 'idle',
  states: {
    idle: {
      on: { 
        PUNCH: 'attacking',
        BLOCK: 'counterWindow',
        SPECIAL_MOVE: 'specialMove',
        WALK: 'walking'
      }
    },
    walking: {
      on: {
        PUNCH: 'attacking',
        BLOCK: 'counterWindow',
        STOP: 'idle'
      }
    },
    counterWindow: {
      after: {
        300: { target: 'idle' }
      },
      on: {
        HIT_RECEIVED: 'reversal'
      }
    },
    reversal: {
      entry: () => console.log("Momentum Redirected!"),
      after: { 500: 'idle' }
    },
    attacking: {
      after: { 400: 'idle' }
    },
    specialMove: {
        after: { 1000: 'idle' }
    }
  }
});