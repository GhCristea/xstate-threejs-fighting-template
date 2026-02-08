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
        WALK: 'walking',
        HIT_RECEIVED: 'hurt'
      }
    },
    walking: {
      on: {
        PUNCH: 'attacking',
        BLOCK: 'counterWindow',
        STOP: 'idle',
        HIT_RECEIVED: 'hurt'
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
      after: { 400: 'idle' },
      on: {
         HIT_RECEIVED: 'hurt' // Counter-hit logic
      }
    },
    specialMove: {
        after: { 1000: 'idle' },
        on: {
            HIT_RECEIVED: 'hurt'
        }
    },
    hurt: {
        entry: () => console.log("Ouch!"),
        after: { 500: 'idle' }
    }
  }
});