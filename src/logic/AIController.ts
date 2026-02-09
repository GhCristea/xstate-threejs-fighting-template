import type { FighterActor } from './FighterActor'

export class AIController {
  npc: FighterActor
  target: FighterActor
  reactionTime: number
  timer: number

  constructor(npc: FighterActor, target: FighterActor) {
    this.npc = npc
    this.target = target
    this.reactionTime = 0.5
    this.timer = 0
  }

  update(dt: number) {
    this.timer += dt
    if (this.timer < this.reactionTime) return
    this.timer = 0
    const dx = this.target.position.x - this.npc.position.x
    const dy = this.target.position.y - this.npc.position.y
    const distSq = dx * dx + dy * dy

    const attackRange = 1.6

    if (distSq > attackRange * attackRange) {
      const dirX = dx > 0 ? 1 : -1
      this.npc.move({ x: dirX, y: 0 }, dt * 25)
    } else {
      const roll = Math.random()
      if (roll > 0.4) {
        this.npc.send({ type: 'PUNCH', variant: 'heavy' })
      } else if (roll > 0.2) {
        this.npc.send({ type: 'BLOCK' })
      } else {
        this.npc.send({ type: 'STOP' })
      }
    }
  }
}
