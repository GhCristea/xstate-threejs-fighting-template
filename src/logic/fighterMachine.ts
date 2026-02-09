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
        PUNCH: 'attacking',
        BLOCK: 'counterWindow',
        SPECIAL_MOVE: 'specialMove',
        WALK: 'walking',
        HIT_RECEIVED: 'hurt'
      }
    },
    walking: { on: { PUNCH: 'attacking', BLOCK: 'counterWindow', STOP: 'idle', HIT_RECEIVED: 'hurt' } },
    counterWindow: { after: { 300: { target: 'idle' } }, on: { HIT_RECEIVED: 'reversal' } },
    reversal: { entry: () => console.log('Momentum Redirected!'), after: { 500: 'idle' } },
    attacking: { after: { 400: 'idle' }, on: { HIT_RECEIVED: 'hurt' } },
    specialMove: { after: { 1000: 'idle' }, on: { HIT_RECEIVED: 'hurt' } },
    hurt: { entry: 'takeDamage', after: { 500: [{ guard: 'isDead', target: 'ko' }, { target: 'idle' }] } },
    ko: { entry: () => console.log('KNOCKOUT!'), type: 'final' }
  }
})
