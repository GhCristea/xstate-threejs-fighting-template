import * as THREE from 'three'

export function checkAttackCollision(attackerMesh: THREE.Mesh, defenderMesh: THREE.Mesh) {
  // 1. Get positions
  const attackerPos = attackerMesh.position
  const defenderPos = defenderMesh.position

  // 2. Define "Reach" (How far can they punch?)
  // In a real game, this comes from the Move Data (e.g., Roundhouse = 1.5m)
  const attackRange = 1.5

  // 3. Check distance (Simple 1D check for 2D fighting plane)
  const distance = attackerPos.distanceTo(defenderPos)

  return distance < attackRange
}
