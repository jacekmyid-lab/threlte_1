<script>
  import { T, useFrame } from '@threlte/core'
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import Module from 'manifold-3d'

  export let uiState
  export let stats
  export let manifoldReady = false
  export let error = null
  export let Manifold = null
  export let Mesh = null
  export let materialIDs = []
  export let cadGeometry = null
  export let showCADGeometry = false
  export let objects = []
  export let selectedObjects = []

  const wireframeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
  
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2
  })

  let firstID, ids, id2matIndex
  
  // Cache materiałów
  let materialCache = new Map()
  let edgesCache = new Map()
  
  function getMaterialForColor(colorHex) {
    if (!materialCache.has(colorHex)) {
      materialCache.set(
        colorHex, 
        new THREE.MeshLambertMaterial({ 
          color: colorHex, 
          flatShading: true 
        })
      )
    }
    return materialCache.get(colorHex)
  }
  
  function getEdgesGeometry(geometry) {
    const key = geometry.uuid
    if (!edgesCache.has(key)) {
      // Używamy EdgesGeometry do wykrycia krawędzi
      const edges = new THREE.EdgesGeometry(geometry, 20)
      edgesCache.set(key, edges)
    }
    return edgesCache.get(key)
  }

  onMount(async () => {
    try {
      console.log('🔍 Ładowanie Manifold z NPM...')
      
      const wasm = await Module()
      wasm.setup()
      
      Manifold = wasm.Manifold
      Mesh = wasm.Mesh
      
      console.log('✅ Manifold załadowany')
      
      const defaultMaterialCount = 3
      firstID = Manifold.reserveIDs(defaultMaterialCount)
      ids = [...Array(defaultMaterialCount)].map((_, idx) => firstID + idx)
      materialIDs = ids
      id2matIndex = new Map()
      ids.forEach((id, idx) => id2matIndex.set(id, idx))
      
      manifoldReady = true
      
      console.log('🎉 Scene gotowy!')
      
    } catch (e) {
      console.error('❌ Błąd ładowania Manifold:', e)
      error = `Błąd: ${e.message}`
    }
  })
</script>

<T.PerspectiveCamera
  makeDefault
  position={[5, 5, 8]}
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0)
  }}
/>

<T.DirectionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
<T.DirectionalLight position={[-3, 3, -3]} intensity={0.4} />
<T.AmbientLight intensity={0.6} />

<!-- Obiekty użytkownika -->
{#each objects as obj}
  {#if obj.visible && obj.geometry}
    <!-- Główny mesh -->
    <T.Mesh 
      geometry={obj.geometry} 
      material={getMaterialForColor(obj.color)}
      position={obj.position}
      scale={selectedObjects.includes(obj.id) ? 1.05 : 1.0}
      castShadow
      receiveShadow
    />
    
    <!-- Krawędzie -->
    {#if uiState.showEdges}
      <T.LineSegments
        geometry={getEdgesGeometry(obj.geometry)}
        material={edgeMaterial}
        position={obj.position}
        scale={selectedObjects.includes(obj.id) ? 1.05 : 1.0}
      />
    {/if}
    
    <!-- Wireframe -->
    {#if uiState.showWireframe}
      <T.Mesh 
        geometry={obj.geometry} 
        material={wireframeMaterial}
        position={obj.position}
        scale={selectedObjects.includes(obj.id) ? 1.05 : 1.0}
      />
    {/if}
    
    <!-- Highlight dla zaznaczonych -->
    {#if selectedObjects.includes(obj.id)}
      <T.Mesh 
        geometry={obj.geometry} 
        position={obj.position}
        scale={1.1}
      >
        <T.MeshBasicMaterial color="#667eea" transparent opacity={0.25} />
      </T.Mesh>
    {/if}
  {/if}
{/each}

<!-- Podłoga -->
<T.Mesh rotation.x={-Math.PI/2} position.y={-2} receiveShadow>
  <T.CircleGeometry args={[10, 64]}/>
  <T.MeshStandardMaterial color="#1a1a2e" />
</T.Mesh>

<!-- Siatka pomocnicza -->
<T.GridHelper args={[20, 20, '#444', '#222']} position.y={-2} />