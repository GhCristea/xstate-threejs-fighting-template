import { createMachine, assign, type ActorRefFrom } from 'xstate'
import type { SceneWorld } from './world'

export type PlaygroundTool = 'select' | 'place'

export type PlaygroundEvent =
  | { type: 'SPAWN_CUBE' }
  | { type: 'TOGGLE_TOOL' }
  | { type: 'POINTER_DOWN'; x: number; y: number }
  | { type: 'POINTER_MOVE'; x: number; y: number }
  | { type: 'POINTER_UP'; x: number; y: number }

export type PlaygroundContext = {
  tool: PlaygroundTool
  pointer: { x: number; y: number } | null
  selectedId: string | null
  world: SceneWorld
}

export function createPlaygroundMachine(input: { world: SceneWorld }) {
  return createMachine(
    {
      id: 'playground',
      initial: 'ready',
      types: {} as {
        context: PlaygroundContext
        events: PlaygroundEvent
      },
      context: {
        tool: 'select',
        pointer: null,
        selectedId: null,
        world: input.world
      },
      states: {
        ready: {
          on: {
            TOGGLE_TOOL: {
              actions: assign({
                tool: ({ context }) => (context.tool === 'select' ? 'place' : 'select')
              })
            },
            SPAWN_CUBE: {
              actions: ({ context }) => {
                const id = context.world.spawnCube()
                context.world.selectById(id)
              }
            },
            POINTER_DOWN: {
              actions: [
                assign({ pointer: ({ event }) => ({ x: event.x, y: event.y }) }),
                ({ context, event }) => {
                  if (context.tool === 'select') {
                    const hit = context.world.pick(event.x, event.y)
                    context.world.selectById(hit?.id ?? null)
                  }

                  if (context.tool === 'place') {
                    const pos = context.world.projectToGround(event.x, event.y)
                    if (pos) {
                      const id = context.world.spawnCube(pos)
                      context.world.selectById(id)
                    }
                  }
                }
              ]
            },
            POINTER_MOVE: {
              actions: assign({ pointer: ({ event }) => ({ x: event.x, y: event.y }) })
            },
            POINTER_UP: {
              actions: assign({ pointer: _ => null })
            }
          }
        }
      }
    },
    {}
  )
}

export type PlaygroundActor = ActorRefFrom<ReturnType<typeof createPlaygroundMachine>>
