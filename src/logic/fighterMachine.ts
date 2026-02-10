import { setup, assign } from 'xstate'
import type { FighterContext, FighterEvent, FighterInput } from './types'

export const fighterMachine = setup({
  types: { context: {} as FighterContext, input: {} as FighterInput, events: {} as FighterEvent },
  actions: { takeDamage: assign({ hp: ({ context }) => Math.max(0, context.hp - 10) }) },
  guards: { isDead: ({ context }) => context.hp <= 0 }
}).createMachine({
  id: 'fighter',
  context: ({ input }) => ({
    name: input.name,
    hp: input.stats.maxHp,
    maxHp: input.stats.maxHp,
    stamina: 100,
    regenRate: input.stats.staminaRegen,
    currentMove: null
  }),
  initial: 'idle',
  states: {
    idle: {
      on: {
        PUNCH: { target: 'attacking' },
        BLOCK: { target: 'counterWindow' },
        SPECIAL_MOVE: { target: 'specialMove' },
        WALK: { target: 'walking' },
        HIT_RECEIVED: { target: 'hurt' },
        DODGE: { target: 'dodging' }
      }
    },
    attacking: { on: { HIT_RECEIVED: { target: 'hurt' } }, after: { 400: { target: 'idle' } } },
    counterWindow: { on: { HIT_RECEIVED: { target: 'reversal' } }, after: { 300: { target: 'idle' } } },
    specialMove: { on: { HIT_RECEIVED: { target: 'hurt' } }, after: { 1000: { target: 'idle' } } },
    walking: {
      on: {
        PUNCH: { target: 'attacking' },
        BLOCK: { target: 'counterWindow' },
        STOP: { target: 'idle' },
        HIT_RECEIVED: { target: 'hurt' },
        DODGE: { target: 'dodging' }
      }
    },
    hurt: { entry: 'takeDamage', after: { 500: [{ guard: 'isDead', target: 'ko' }, { target: 'idle' }] } },
    dodging: { on: { HIT_RECEIVED: { target: 'hurt' } }, after: { 200: { target: 'idle' } } },
    reversal: { entry: () => console.log('Momentum Redirected!'), after: { 500: { target: 'idle' } } },
    ko: { type: 'final', entry: () => console.log('KNOCKOUT!') }
  }
})
