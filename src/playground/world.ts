import * as THREE from 'three'

export type SceneWorld = {
  update: (dt: number) => void
  spawnCube: (pos?: THREE.Vector3) => string
  pick: (clientX: number, clientY: number) => { id: string } | null
  selectById: (id: string | null) => void
  projectToGround: (clientX: number, clientY: number) => THREE.Vector3 | null
}

export function createSceneWorld(input: {
  scene: THREE.Scene
  camera: THREE.Camera
  domElement: HTMLElement
}): SceneWorld {
  const { scene, camera, domElement } = input

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  const cubes = new Map<string, THREE.Mesh>()
  let selected: THREE.Mesh | null = null

  const selectionMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b })

  function setMouseFromClient(clientX: number, clientY: number) {
    const rect = domElement.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1)
    mouse.set(x, y)
  }

  function update(_: number) {
    // Placeholder for future: gizmos, damping, etc.
  }

  function spawnCube(pos?: THREE.Vector3) {
    const id = crypto.randomUUID()

    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshStandardMaterial({ color: 0x22c55e })
    const mesh = new THREE.Mesh(geo, mat)

    mesh.position.copy(pos ?? new THREE.Vector3(0, 0.5, 0))
    ;(mesh as any).userData = { id }

    scene.add(mesh)
    cubes.set(id, mesh)
    return id
  }

  function pick(clientX: number, clientY: number) {
    setMouseFromClient(clientX, clientY)
    raycaster.setFromCamera(mouse, camera as THREE.Camera)

    const intersects = raycaster.intersectObjects(Array.from(cubes.values()), false)
    const first = intersects[0]?.object as THREE.Object3D | undefined
    const id = first?.userData?.id
    return typeof id === 'string' ? { id } : null
  }

  function selectById(id: string | null) {
    if (selected) {
      // restore original material by re-creating; simple and fine for dev tool.
      selected.material = new THREE.MeshStandardMaterial({ color: 0x22c55e })
      selected = null
    }

    if (!id) return
    const mesh = cubes.get(id) ?? null
    if (!mesh) return

    mesh.material = selectionMat
    selected = mesh
  }

  function projectToGround(clientX: number, clientY: number) {
    setMouseFromClient(clientX, clientY)
    raycaster.setFromCamera(mouse, camera as THREE.Camera)

    const out = new THREE.Vector3()
    const hit = raycaster.ray.intersectPlane(ground, out)
    return hit ? out : null
  }

  return {
    update,
    spawnCube,
    pick,
    selectById,
    projectToGround
  }
}
