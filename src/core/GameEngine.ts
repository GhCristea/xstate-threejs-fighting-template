export type TickCallback = (dt: number) => void
export type RenderCallback = () => void

export type TimeSource = {
  now: () => number // milliseconds
}

export type Scheduler = { request: (cb: () => void) => number; cancel: (id: number) => void }

const defaultTimeSource: TimeSource = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
}

const defaultScheduler: Scheduler = {
  request: cb => {
    if (typeof requestAnimationFrame !== 'undefined') return requestAnimationFrame(cb)
    return setTimeout(cb, 16) as unknown as number
  },
  cancel: id => {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(id)
    else clearTimeout(id as unknown as number)
  }
}

export class GameEngine {
  private fixedTimeStep: number
  private accumulatorSeconds: number
  private isRunning: boolean
  private requestID: number | null

  private tickListeners: TickCallback[] = []
  private renderListeners: RenderCallback[] = []

  private timeSource: TimeSource
  private scheduler: Scheduler

  private lastTimeMs: number
  private maxDeltaSeconds: number
  private maxSubSteps: number

  constructor(options?: {
    fixedTimeStep?: number
    timeSource?: TimeSource
    scheduler?: Scheduler
    maxDeltaSeconds?: number
    maxSubSteps?: number
  }) {
    this.fixedTimeStep = options?.fixedTimeStep ?? 1 / 60
    this.timeSource = options?.timeSource ?? defaultTimeSource
    this.scheduler = options?.scheduler ?? defaultScheduler

    this.maxDeltaSeconds = options?.maxDeltaSeconds ?? 0.25
    this.maxSubSteps = options?.maxSubSteps ?? 8

    this.accumulatorSeconds = 0
    this.isRunning = false
    this.requestID = null
    this.lastTimeMs = this.timeSource.now()
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTimeMs = this.timeSource.now()
    this.loop()
  }

  stop() {
    this.isRunning = false
    if (this.requestID !== null) {
      this.scheduler.cancel(this.requestID)
      this.requestID = null
    }
  }

  onTick(callback: TickCallback) {
    this.tickListeners.push(callback)
    return () => {
      const idx = this.tickListeners.indexOf(callback)
      if (idx >= 0) this.tickListeners.splice(idx, 1)
    }
  }

  onRender(callback: RenderCallback) {
    this.renderListeners.push(callback)
    return () => {
      const idx = this.renderListeners.indexOf(callback)
      if (idx >= 0) this.renderListeners.splice(idx, 1)
    }
  }

  private loop = () => {
    if (!this.isRunning) return

    this.requestID = this.scheduler.request(this.loop)

    const nowMs = this.timeSource.now()
    let deltaSeconds = (nowMs - this.lastTimeMs) / 1000
    this.lastTimeMs = nowMs

    // Prevent spiral-of-death if the tab was backgrounded or the main thread stalled.
    if (deltaSeconds > this.maxDeltaSeconds) deltaSeconds = this.maxDeltaSeconds

    this.accumulatorSeconds += deltaSeconds

    let steps = 0
    while (this.accumulatorSeconds >= this.fixedTimeStep && steps < this.maxSubSteps) {
      this.tick(this.fixedTimeStep)
      this.accumulatorSeconds -= this.fixedTimeStep
      steps++
    }

    // If we hit the cap, drop remaining accumulated time.
    if (steps === this.maxSubSteps) {
      this.accumulatorSeconds = 0
    }

    this.render()
  }

  private tick(dt: number) {
    for (const listener of this.tickListeners) listener(dt)
  }

  private render() {
    for (const listener of this.renderListeners) listener()
  }
}
