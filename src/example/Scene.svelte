<script>
  import { T, useFrame } from '@threlte/core'
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import Module from 'manifold-3d'

  export let uiState
  export let stats
  export let manifoldReady = false
  export let error = null

  let Manifold, Mesh
  let resultGeometry = null
  let rotation = 0

  const materials = [
    new THREE.MeshLambertMaterial({ color: 0xff6b6b, flatShading: true }),
    new THREE.MeshLambertMaterial({ color: 0x4ecdc4, flatShading: true }),
    new THREE.MeshLambertMaterial({ color: 0xffe66d, flatShading: true })
  ]

  const wireframeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })

  let firstID, ids, id2matIndex

  function geometry2mesh(geometry) {
    const vertProperties = geometry.attributes.position.array
    const triVerts = geometry.index != null ?
      geometry.index.array :
      new Uint32Array(vertProperties.length / 3).map((_, idx) => idx)
    
    const starts = [...Array(geometry.groups.length)].map(
      (_, idx) => geometry.groups[idx].start)
    
    const originalIDs = [...Array(geometry.groups.length)].map(
      (_, idx) => ids[geometry.groups[idx].materialIndex])
    
    const indices = Array.from(starts.keys())
    indices.sort((a, b) => starts[a] - starts[b])
    
    const runIndex = new Uint32Array(indices.map(i => starts[i]))
    const runOriginalID = new Uint32Array(indices.map(i => originalIDs[i]))
    
    const mesh = new Mesh({
      numProp: 3,
      vertProperties,
      triVerts,
      runIndex,
      runOriginalID
    })
    
    mesh.merge()
    return mesh
  }

  function mesh2geometry(mesh) {
    const geometry = new THREE.BufferGeometry()
    
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(mesh.vertProperties, 3)
    )
    geometry.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1))
    
    let id = mesh.runOriginalID[0]
    let start = mesh.runIndex[0]
    
    for (let run = 0; run < mesh.numRun; run++) {
      const nextID = mesh.runOriginalID[run + 1]
      if (nextID !== id) {
        const end = mesh.runIndex[run + 1]
        geometry.addGroup(start, end - start, id2matIndex.get(id))
        id = nextID
        start = end
      }
    }
    
    geometry.computeBoundingSphere()
    return geometry
  }

  function createBoxWithSeparateFaces() {
    const geometry = new THREE.BoxGeometry(uiState.boxSize, uiState.boxSize, uiState.boxSize)
    geometry.clearGroups()
    geometry.addGroup(0, 18, 0)
    geometry.addGroup(18, Infinity, 1)
    return geometry
  }

  function createIcosahedron() {
    const geometry = new THREE.IcosahedronGeometry(uiState.icoRadius, uiState.icoDetail)
    
    if (!geometry.index) {
      const positions = geometry.attributes.position
      const indices = []
      for (let i = 0; i < positions.count; i++) {
        indices.push(i)
      }
      geometry.setIndex(indices)
    }
    
    geometry.clearGroups()
    const halfFaces = Math.floor(geometry.index.count / 2)
    geometry.addGroup(halfFaces, Infinity, 2)
    geometry.addGroup(0, halfFaces, 0)
    return geometry
  }

  function updateStats(manifoldResult) {
    try {
      if (!resultGeometry) return
      
      stats.vertices = resultGeometry.attributes.position.count
      stats.triangles = Math.floor(resultGeometry.index.count / 3)
      
      if (typeof manifoldResult.genus === 'function') {
        stats.genus = manifoldResult.genus()
      }
      
      stats.volume = 'N/A'
      stats.surfaceArea = 'N/A'
    } catch (e) {
      console.warn('Nie można pobrać statystyk:', e)
    }
  }

  function performBooleanOperation(op) {
    if (!manifoldReady) return null
    
    try {
      const boxGeometry = createBoxWithSeparateFaces()
      const icoGeometry = createIcosahedron()
      
      const manifoldBox = new Manifold(geometry2mesh(boxGeometry))
      const manifoldIco = new Manifold(geometry2mesh(icoGeometry))
      
      let result
      if (op === 'union') {
        result = manifoldBox.add(manifoldIco)
      } else if (op === 'difference') {
        result = manifoldBox.subtract(manifoldIco)
      } else if (op === 'intersection') {
        result = manifoldBox.intersect(manifoldIco)
      }
      
      const geo = mesh2geometry(result.getMesh())
      updateStats(result)
      error = null
      return geo
      
    } catch (e) {
      console.error('Operacja boolean nie powiodła się:', e)
      error = e.message
      return null
    }
  }

  useFrame((state, delta) => {
    if (uiState.autoRotate) {
      rotation += delta * 0.5
    }
  })

  onMount(async () => {
    try {
      console.log('🔍 Ładowanie Manifold z NPM...')
      
      const wasm = await Module()
      wasm.setup()
      
      Manifold = wasm.Manifold
      Mesh = wasm.Mesh
      
      console.log('✅ Manifold załadowany')
      
      firstID = Manifold.reserveIDs(materials.length)
      ids = [...Array(materials.length)].map((_, idx) => firstID + idx)
      id2matIndex = new Map()
      ids.forEach((id, idx) => id2matIndex.set(id, idx))
      
      manifoldReady = true
      resultGeometry = performBooleanOperation(uiState.operation)
      
    } catch (e) {
      console.error('❌ Błąd ładowania Manifold:', e)
      error = `Błąd: ${e.message}`
    }
  })

  $: if (manifoldReady) {
    resultGeometry = performBooleanOperation(uiState.operation)
  }
</script>

<T.PerspectiveCamera
  makeDefault
  position={[3, 3, 5]}
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0)
  }}
/>

<T.DirectionalLight position={[5, 5, 5]} intensity={1} castShadow />
<T.AmbientLight intensity={0.5} />

{#if manifoldReady && resultGeometry}
  <T.Mesh geometry={resultGeometry} material={materials} rotation.y={rotation} />
  
  {#if uiState.showWireframe}
    <T.Mesh geometry={resultGeometry} material={wireframeMaterial} rotation.y={rotation} />
  {/if}
{:else if !error}
  <T.Mesh>
    <T.BoxGeometry args={[1, 1, 1]} />
    <T.MeshStandardMaterial color="orange" />
  </T.Mesh>
{/if}

<T.Mesh rotation.x={-Math.PI/2} position.y={-1.5} receiveShadow>
  <T.CircleGeometry args={[5, 32]}/>
  <T.MeshStandardMaterial color="#1a1a2e" />
</T.Mesh>