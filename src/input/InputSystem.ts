export const defaultKeyMap = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  KeyZ: 'LIGHT_PUNCH',
  KeyX: 'HEAVY_PUNCH',
  KeyC: 'BLOCK',
  Space: 'ULTIMATE'
} as const

export type Action = (typeof defaultKeyMap)[keyof typeof defaultKeyMap]
export type AttackVariant = 'light' | 'heavy'

export type Intent =
  | { type: 'COMBO'; name: string }
  | { type: 'BLOCK' }
  | { type: 'ATTACK'; variant: AttackVariant }
  | { type: 'MOVEMENT'; vector: { x: number; y: number } }

type BufferedFrame = { frame: number; actions: Action[] }
type ComboDef = { name: string; sequence: Action[]; priority: number }

export function getAction(keyCode: string): Action | null {
  return (defaultKeyMap as Record<string, Action>)[keyCode] ?? null
}

export class InputSystem {
  currentInputs: Set<Action>
  buffer: BufferedFrame[]
  bufferSize: number
  comboDefinitions: ComboDef[]

  constructor() {
    this.currentInputs = new Set()
    this.buffer = []
    this.bufferSize = 60
    this.comboDefinitions = []

    this.initListeners()
  }

  initListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', e => {
        const action = getAction(e.code)
        if (action) this.currentInputs.add(action)
      })

      window.addEventListener('keyup', e => {
        const action = getAction(e.code)
        if (action) this.currentInputs.delete(action)
      })
    }
  }

  registerCombo(name: string, sequence: Action[], priority = 1) {
    this.comboDefinitions.push({ name, sequence, priority })
  }

  update(frameCount?: number): Intent | null {
    const activeActions = Array.from(this.currentInputs)

    this.buffer.push({ frame: frameCount ?? Date.now(), actions: activeActions })
    if (this.buffer.length > this.bufferSize) this.buffer.shift()

    const combo = this.checkCombos()

    if (combo) return { type: 'COMBO', name: combo }
    if (activeActions.includes('BLOCK')) return { type: 'BLOCK' }

    // Prefer heavy when both are pressed.
    if (activeActions.includes('HEAVY_PUNCH')) return { type: 'ATTACK', variant: 'heavy' }
    if (activeActions.includes('LIGHT_PUNCH')) return { type: 'ATTACK', variant: 'light' }

    const movement = {
      x:
        activeActions.includes('RIGHT') ? 1
        : activeActions.includes('LEFT') ? -1
        : 0,
      y:
        activeActions.includes('UP') ? 1
        : activeActions.includes('DOWN') ? -1
        : 0
    }

    if (movement.x !== 0 || movement.y !== 0) return { type: 'MOVEMENT', vector: movement }

    return null
  }

  private checkCombos(): string | null {
    for (const combo of this.comboDefinitions) {
      if (this.matchSequence(combo.sequence)) {
        this.buffer = []
        return combo.name
      }
    }
    return null
  }

  private matchSequence(sequence: Action[]) {
    let seqIndex = sequence.length - 1
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const frameActions = this.buffer[i].actions
      const requiredAction = sequence[seqIndex]

      if (frameActions.includes(requiredAction)) {
        seqIndex--
        if (seqIndex < 0) return true
      }
      if (this.buffer.length - 1 - i > 20) return false
    }
    return false
  }
}
