export type AttackVariant = 'light' | 'heavy'

export type FighterEvent =
  | { type: 'PUNCH'; variant: AttackVariant }
  | { type: 'BLOCK' }
  | { type: 'SPECIAL_MOVE'; name: string }
  | { type: 'WALK' }
  | { type: 'STOP' }
  | { type: 'HIT_RECEIVED' }
  | { type: 'DODGE' }

export type FighterContext = {
  name: string
  hp: number
  maxHp: number
  stamina: number
  regenRate: number
  currentMove: string | null
}

export type FighterInput = { name: string; stats: { maxHp: number; staminaRegen: number } }

export type FighterData = {
  name: string
  style: string
  stats: { staminaRegen: number; counterWindow: number; maxHp: number }
  moves: { special: { name: string; damage: number } }
}
