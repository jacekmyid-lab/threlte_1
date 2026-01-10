// src/lib/manifold/extrudeModule.ts

import * as THREE from 'three'

export interface Point2D {
  x: number
  y: number
}

export interface ExtrudeOptions {
  height: number
  twist?: number
  scale?: number
  steps?: number
}

/**
 * Tworzy Three.js geometrię poprzez ekstruzję 2D konturu
 * Używa wbudowanej ExtrudeGeometry dla niezawodności
 */
export function extrudeContour(
  points: Point2D[],
  options: ExtrudeOptions
): THREE.BufferGeometry {
  const {
    height = 1,
    twist = 0,
    scale = 1,
    steps = 1
  } = options

  if (points.length < 3) {
    throw new Error('Kontur musi mieć minimum 3 punkty')
  }

  // Utwórz Shape z punktów
  const shape = new THREE.Shape()
  shape.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y)
  }
  shape.closePath()

  // Użyj ExtrudeGeometry
  const extrudeSettings = {
    depth: height,
    bevelEnabled: false,
    steps: steps
  }

  let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)

  // ExtrudeGeometry nie jest indexed - tworzymy indeksy
  if (!geometry.index) {
    const positions = geometry.attributes.position
    const indices = []
    for (let i = 0; i < positions.count; i++) {
      indices.push(i)
    }
    geometry.setIndex(indices)
  }

  // Zastosuj twist i scale jeśli potrzebne
  if (twist !== 0 || scale !== 1) {
    const positions = geometry.attributes.position.array
    geometry.computeBoundingBox()
    const minZ = geometry.boundingBox!.min.z
    const maxZ = geometry.boundingBox!.max.z
    const rangeZ = maxZ - minZ

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]

      const t = (z - minZ) / rangeZ
      const angle = twist * t * Math.PI / 180
      const s = 1 + (scale - 1) * t

      // Rotacja wokół Z i skalowanie
      positions[i] = (x * Math.cos(angle) - y * Math.sin(angle)) * s
      positions[i + 1] = (x * Math.sin(angle) + y * Math.cos(angle)) * s
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // Dodaj grupy materiałów
  geometry.clearGroups()
  geometry.addGroup(0, Infinity, 0)

  return geometry
}

/**
 * Konwertuje Three.js geometrię do formatu Manifold Mesh
 */
export function threeGeometryToManifoldMesh(
  geometry: THREE.BufferGeometry,
  Mesh: any,
  materialIDs: number[]
): any {
  const positions = geometry.attributes.position.array as Float32Array
  const indices = geometry.index?.array as Uint32Array

  if (!indices) {
    throw new Error('Geometria musi być indeksowana')
  }

  // Przygotuj dane dla Manifold
  const vertProperties = new Float32Array(positions)
  const triVerts = new Uint32Array(indices)

  // Grupy materiałów
  const groups = geometry.groups.length > 0 ? geometry.groups : [
    { start: 0, count: indices.length, materialIndex: 0 }
  ]

  console.log('📊 Groups:', groups)
  console.log('🔢 Indices count:', indices.length)
  console.log('🎨 Material IDs:', materialIDs)

  const runIndex = new Uint32Array(groups.map(g => g.start))
  const runOriginalID = new Uint32Array(
    groups.map(g => materialIDs[g.materialIndex || 0])
  )

  const mesh = new Mesh({
    numProp: 3,
    vertProperties,
    triVerts,
    runIndex,
    runOriginalID
  })

  console.log('🔨 Mesh created, calling merge...')
  mesh.merge()
  console.log('✓ Mesh merged')

  return mesh
}

/**
 * Sprawdza czy kontur jest zamknięty
 */
export function isContourClosed(points: Point2D[]): boolean {
  if (points.length < 3) return false
  
  const first = points[0]
  const last = points[points.length - 1]
  const epsilon = 0.001
  
  return Math.abs(first.x - last.x) < epsilon && 
         Math.abs(first.y - last.y) < epsilon
}

/**
 * Oblicza pole powierzchni konturu
 */
export function contourArea(points: Point2D[]): number {
  let area = 0
  const n = points.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }

  return Math.abs(area) / 2
}

/**
 * Sprawdza czy kontur jest zgodny z ruchem wskazówek zegara
 */
export function isClockwise(points: Point2D[]): boolean {
  let sum = 0
  const n = points.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y)
  }

  return sum > 0
}

/**
 * Odwraca kolejność punktów
 */
export function reverseContour(points: Point2D[]): Point2D[] {
  return [...points].reverse()
}