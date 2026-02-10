import { createActor, Actor, type AnyActorLogic } from 'xstate'
import { fighterMachine } from './fighterMachine'
import type { FighterEvent, FighterData } from './types'

export { FighterEvent }

export class FighterActor {
  actor: Actor<AnyActorLogic>
  baseColor: number

  // Logic state (position x, y)
  private pos: { x: number; y: number }

  constructor(startPos: { x: number; y: number }, color: number, fighterData: FighterData) {
    this.baseColor = color
    this.pos = { x: startPos.x, y: startPos.y }

    // Setup Logic
    this.actor = createActor(fighterMachine, { input: fighterData })
  }

  start() {
    this.actor.start()
  }

  send(event: FighterEvent) {
    this.actor.send(event)
  }

  // No visual update here - pure logic update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(dt: number) {
    // Logic updates (timers, cooldowns) are handled by XState automatically or via tick events if needed
  }

  move(vector: { x: number; y: number }, dt: number) {
    const snapshot = this.actor.getSnapshot()

    if (snapshot.matches('idle') || snapshot.matches('walking')) {
      this.pos.x += vector.x * 5 * dt
      this.pos.x = Math.max(-9, Math.min(9, this.pos.x))

      if (vector.x !== 0) {
        this.send({ type: 'WALK' })
      } else {
        this.send({ type: 'STOP' })
      }
    }
  }

  // Pure logic getter
  get position() {
    return this.pos
  }

  // New: Derived state for renderer to consume
  get visualState() {
    const snapshot = this.actor.getSnapshot()
    const state = snapshot.value
    let color = this.baseColor

    if (state === 'attacking') color = 0xff0000
    else if (state === 'counterWindow') color = 0xffff00
    else if (state === 'dodging') color = 0x0000ff
    else if (state === 'hurt') color = 0xffffff
    else if (state === 'reversal') color = 0x550000

    return { x: this.pos.x, y: this.pos.y, color }
  }
}
