<script>
  import { T, useFrame } from '@threlte/core'
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  
  // Import Manifold z npm package
  import Module from 'manifold-3d'

  let manifoldReady = false
  let Manifold, Mesh
  let resultGeometry = null
  let operation = 'union'
  let error = null
  let rotation = 0

  // Materiały dla różnych części
  const materials = [
    new THREE.MeshLambertMaterial({ color: 0xff6b6b, flatShading: true }), // czerwony
    new THREE.MeshLambertMaterial({ color: 0x4ecdc4, flatShading: true }), // cyjan
    new THREE.MeshLambertMaterial({ color: 0xffe66d, flatShading: true })  // żółty
  ]

  // IDs dla materiałów (system Manifold)
  let firstID, ids, id2matIndex

  // Konwersja Three.js BufferGeometry -> Manifold Mesh
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

  // Konwersja Manifold Mesh -> Three.js BufferGeometry
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
    
    return geometry
  }

  // Box ze składowych ścianek (różne materiały)
  function createBoxWithSeparateFaces() {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    geometry.clearGroups()
    geometry.addGroup(0, 18, 0)         // Pierwsze 6 ścian
    geometry.addGroup(18, Infinity, 1)  // Reszta
    return geometry
  }

  // Ikosahedron
  function createIcosahedron() {
    const geometry = new THREE.IcosahedronGeometry(0.6)
    geometry.clearGroups()
    geometry.addGroup(30, Infinity, 2)  // Druga połowa
    geometry.addGroup(0, 30, 0)         // Pierwsza połowa
    return geometry
  }

  // Wykonaj operację boolean
  function performBooleanOperation(op) {
    if (!manifoldReady) return null
    
    try {
      const boxGeometry = createBoxWithSeparateFaces()
      const icoGeometry = createIcosahedron()
      
      const manifoldBox = new Manifold(geometry2mesh(boxGeometry))
      const manifoldIco = new Manifold(geometry2mesh(icoGeometry))
      
      let result
      if (op === 'union') {
        result = Manifold.union(manifoldBox, manifoldIco)
      } else if (op === 'difference') {
        result = Manifold.difference(manifoldBox, manifoldIco)
      } else if (op === 'intersection') {
        result = Manifold.intersection(manifoldBox, manifoldIco)
      }
      
      return mesh2geometry(result.getMesh())
      
    } catch (e) {
      console.error('Boolean operation failed:', e)
      error = e.message
      return null
    }
  }

  // Animacja
  useFrame((state, delta) => {
    rotation += delta * 0.5
  })

  // Ładowanie Manifold z NPM
  onMount(async () => {
    try {
      console.log('🔍 Ładowanie Manifold z NPM...')
      
      // Załaduj WASM zgodnie z oficjalną dokumentacją
      const wasm = await Module()
      wasm.setup()
      
      Manifold = wasm.Manifold
      Mesh = wasm.Mesh
      
      console.log('✅ Manifold i Mesh dostępne')
      
      // Set up Manifold IDs dla materiałów
      firstID = Manifold.reserveIDs(materials.length)
      ids = [...Array(materials.length)].map((_, idx) => firstID + idx)
      id2matIndex = new Map()
      ids.forEach((id, idx) => id2matIndex.set(id, idx))
      
      console.log('✅ Material IDs skonfigurowane:', ids)
      
      manifoldReady = true
      resultGeometry = performBooleanOperation(operation)
      
      console.log('✅ Manifold załadowany i gotowy!')
      
    } catch (e) {
      console.error('❌ Błąd ładowania Manifold:', e)
      error = `Błąd: ${e.message}`
    }
  })

  // Reaguj na zmianę operacji
  $: if (manifoldReady && operation) {
    resultGeometry = performBooleanOperation(operation)
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

<!-- Wynik operacji boolean -->
{#if manifoldReady && resultGeometry}
  <T.Mesh geometry={resultGeometry} material={materials} rotation.y={rotation}>
  </T.Mesh>
{:else if !error}
  <!-- Placeholder podczas ładowania -->
  <T.Mesh>
    <T.BoxGeometry args={[1, 1, 1]} />
    <T.MeshStandardMaterial color="orange" />
  </T.Mesh>
{/if}

<!-- Podłoga -->
<T.Mesh rotation.x={-Math.PI/2} position.y={-1.5} receiveShadow>
  <T.CircleGeometry args={[5, 32]}/>
  <T.MeshStandardMaterial color="white" />
</T.Mesh>

<!-- UI Controls -->
<div class="controls">
  <h2>🎮 Manifold Boolean Operations</h2>
  
  {#if !manifoldReady && !error}
    <p class="status loading">⏳ Ładowanie Manifold z NPM...</p>
  {:else if error}
    <p class="status error">❌ {error}</p>
    <p class="hint">💡 Upewnij się że: npm install manifold-3d</p>
  {:else}
    <p class="status success">✅ Manifold gotowy! (z npm)</p>
  {/if}
  
  <div class="operation-selector">
    <label>
      <input type="radio" bind:group={operation} value="union" />
      <span>Union (∪)</span>
    </label>
    <label>
      <input type="radio" bind:group={operation} value="difference" />
      <span>Difference (−)</span>
    </label>
    <label>
      <input type="radio" bind:group={operation} value="intersection" />
      <span>Intersection (∩)</span>
    </label>
  </div>
  
  <div class="info">
    <p>🎨 <strong>Box</strong>: składany ze ścianek (materiały 0,1,2)</p>
    <p>🔷 <strong>Ikosahedron</strong>: 2 kolory (materiały 0,2)</p>
    <p>⚙️ <strong>Konwersja</strong>: Three.js ↔ Manifold</p>
    <p>📦 <strong>Źródło</strong>: npm package manifold-3d</p>
  </div>
</div>

<style>
  :global(.controls) {
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-width: 320px;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  :global(.controls h2) {
    margin: 0 0 15px 0;
    font-size: 20px;
    font-weight: 600;
  }

  :global(.controls .status) {
    padding: 12px;
    border-radius: 8px;
    margin: 12px 0;
    font-weight: 500;
    font-size: 14px;
  }

  :global(.controls .status.loading) {
    background: rgba(255, 230, 109, 0.2);
    color: #ffe66d;
    border: 1px solid rgba(255, 230, 109, 0.3);
  }

  :global(.controls .status.success) {
    background: rgba(78, 205, 196, 0.2);
    color: #4ecdc4;
    border: 1px solid rgba(78, 205, 196, 0.3);
  }

  :global(.controls .status.error) {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.3);
  }

  :global(.controls .hint) {
    font-size: 12px;
    margin-top: 8px;
    opacity: 0.8;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  :global(.controls .operation-selector) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 15px 0;
  }

  :global(.controls .operation-selector label) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.05);
  }

  :global(.controls .operation-selector label:hover) {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(2px);
  }

  :global(.controls .operation-selector input[type="radio"]) {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #4ecdc4;
  }

  :global(.controls .operation-selector span) {
    font-size: 15px;
  }

  :global(.controls .info) {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 13px;
    line-height: 1.8;
  }

  :global(.controls .info p) {
    margin: 6px 0;
  }

  :global(.controls .info strong) {
    color: #4ecdc4;
  }
</style>