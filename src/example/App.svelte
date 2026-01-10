<script>
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  import CADEditor from './CADEditor.svelte'
  import * as THREE from 'three'
  
  let mode = 'boolean' // 'boolean' | 'cad'
  
  let uiState = {
    operation: 'union',
    showWireframe: false,
    showStats: true,
    showEdges: true
  }
  
  let stats = {
    vertices: 0,
    triangles: 0,
    genus: 0,
    volume: 'N/A',
    surfaceArea: 'N/A'
  }
  
  let manifoldReady = false
  let error = null
  let Manifold = null
  let Mesh = null
  let materialIDs = []
  
  // System obiektów
  let objects = []
  let selectedObjects = []
  let draggedObject = null
  
  // CAD geometry (tymczasowe)
  let cadGeometry = null
  let showCADGeometry = false
  
  // Paleta kolorów dla różnych typów obiektów
  const colorPalette = {
    extrude: '#4ecdc4',
    union: '#667eea',
    difference: '#ff6b6b',
    intersection: '#ffa502',
    trim: '#26de81',
    split: '#a29bfe',
    boolean_result: '#fd79a8'
  }
  
  function getColorForType(type, operation = null) {
    if (type === 'boolean_result' && operation) {
      return colorPalette[operation] || colorPalette.boolean_result
    }
    return colorPalette[type] || '#95afc0'
  }
  
  // Konwersja Manifold → Three.js Geometry
  function manifoldToGeometry(manifoldObj) {
    if (!manifoldObj || !Mesh) return null
    
    try {
      const mesh = manifoldObj.getMesh()
      
      const geometry = new THREE.BufferGeometry()
      
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(mesh.vertProperties, 3)
      )
      geometry.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1))
      
      let id = mesh.runOriginalID[0]
      let start = mesh.runIndex[0]
      
      const id2matIndex = new Map()
      materialIDs.forEach((id, idx) => id2matIndex.set(id, idx))
      
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
      geometry.computeVertexNormals()
      
      return geometry
      
    } catch (e) {
      console.error('❌ Błąd konwersji Manifold→Geometry:', e)
      return null
    }
  }
  
  function handleCADGeometryCreated(data) {
    console.log('🎯 CAD Geometry created:', data)
    
    const newObject = {
      id: `obj_${Date.now()}`,
      name: `Extrude ${objects.length + 1}`,
      type: 'extrude',
      geometry: data.geometry,
      manifold: data.manifold,
      contour: data.contour,
      extrusion: data.extrusion,
      position: [objects.length * 2.5, 0, 0],
      visible: true,
      color: getColorForType('extrude')
    }
    
    objects = [...objects, newObject]
    
    if (data.manifold) {
      stats.vertices = data.manifold.numVert()
      stats.triangles = data.manifold.numTri()
      stats.genus = data.manifold.genus()
    }
    
    cadGeometry = null
    console.log('✓ Obiekt dodany do sceny:', newObject)
  }
  
  function toggleObjectSelection(objId) {
    if (selectedObjects.includes(objId)) {
      selectedObjects = selectedObjects.filter(id => id !== objId)
    } else {
      selectedObjects = [...selectedObjects, objId]
    }
  }
  
  function toggleObjectVisibility(objId) {
    objects = objects.map(obj => 
      obj.id === objId ? { ...obj, visible: !obj.visible } : obj
    )
  }
  
  function deleteObject(objId) {
    objects = objects.filter(obj => obj.id !== objId)
    selectedObjects = selectedObjects.filter(id => id !== objId)
  }
  
  function moveObject(objId, axis, delta) {
    objects = objects.map(obj => {
      if (obj.id === objId) {
        const newPos = [...obj.position]
        if (axis === 'x') newPos[0] += delta
        if (axis === 'y') newPos[1] += delta
        if (axis === 'z') newPos[2] += delta
        return { ...obj, position: newPos }
      }
      return obj
    })
  }
  
  function performBooleanOnSelected() {
    if (selectedObjects.length !== 2) {
      alert('Wybierz dokładnie 2 obiekty do operacji Boolean')
      return
    }
    
    const obj1 = objects.find(o => o.id === selectedObjects[0])
    const obj2 = objects.find(o => o.id === selectedObjects[1])
    
    if (!obj1?.manifold || !obj2?.manifold) {
      alert('Obiekty nie mają danych Manifold')
      return
    }
    
    try {
      // Przesunięcie manifoldów zgodnie z pozycją obiektów
      const m1 = obj1.manifold.translate(obj1.position)
      const m2 = obj2.manifold.translate(obj2.position)
      
      let result
      let resultName = ''
      let operation = uiState.operation
      
      if (operation === 'union') {
        result = m1.add(m2)
        resultName = `${obj1.name} ∪ ${obj2.name}`
        
      } else if (operation === 'difference') {
        result = m1.subtract(m2)
        resultName = `${obj1.name} ∖ ${obj2.name}`
        
      } else if (operation === 'intersection') {
        result = m1.intersect(m2)
        resultName = `${obj1.name} ∩ ${obj2.name}`
        
      } else if (operation === 'trim') {
        result = m1.trimByPlane([0, 0, 1], 0)
        resultName = `${obj1.name} (trimmed)`
        
      } else if (operation === 'split') {
        const parts = m1.split(m2)
        
        if (parts && parts.length === 2) {
          const [part1, part2] = parts
          
          if (part1 && !part1.isEmpty()) {
            addResultObject(part1, `${obj1.name} (część 1)`, [0, 0, 0], 'split')
          }
          if (part2 && !part2.isEmpty()) {
            addResultObject(part2, `${obj1.name} (część 2)`, [2.5, 0, 0], 'split')
          }
        }
        
        selectedObjects = []
        return
      }
      
      if (!result) {
        alert('Operacja nie zwróciła wyniku')
        return
      }
      
      if (result.isEmpty()) {
        alert('Operacja zwróciła pusty wynik')
        return
      }
      
      addResultObject(result, resultName, [0, 0, 0], operation)
      selectedObjects = []
      
    } catch (e) {
      console.error('❌ Błąd operacji Boolean:', e)
      alert(`Błąd: ${e.message}`)
    }
  }
  
  function addResultObject(manifold, name, position, operation) {
    try {
      const geometry = manifoldToGeometry(manifold)
      
      if (!geometry) {
        alert('Nie udało się skonwertować wyniku na geometrię')
        return
      }
      
      const newObject = {
        id: `obj_${Date.now()}`,
        name: name,
        type: 'boolean_result',
        operation: operation,
        geometry: geometry,
        manifold: manifold,
        position: position,
        visible: true,
        color: getColorForType('boolean_result', operation)
      }
      
      objects = [...objects, newObject]
      
      stats.vertices = manifold.numVert()
      stats.triangles = manifold.numTri()
      stats.genus = manifold.genus()
      
      console.log('✅ Wynik Boolean dodany:', {
        name: newObject.name,
        vertices: stats.vertices,
        triangles: stats.triangles,
        color: newObject.color
      })
      
    } catch (e) {
      console.error('❌ Błąd dodawania wyniku:', e)
      alert(`Błąd: ${e.message}`)
    }
  }
  
  $: showCADGeometry = false
</script>

<!-- Mode Toggle -->
<div style="position: fixed; top: 70px; right: 20px; z-index: 2000; display: flex; gap: 8px; background: white; padding: 8px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <button
    on:click={() => mode = 'boolean'}
    style="padding: 10px 20px; background: {mode === 'boolean' ? '#667eea' : 'white'}; color: {mode === 'boolean' ? 'white' : '#333'}; border: 2px solid #667eea; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;"
  >
    🔷 Boolean Ops
  </button>
  <button
    on:click={() => mode = 'cad'}
    style="padding: 10px 20px; background: {mode === 'cad' ? '#4ecdc4' : 'white'}; color: {mode === 'cad' ? 'white' : '#333'}; border: 2px solid #4ecdc4; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;"
  >
    🎨 CAD Editor
  </button>
</div>

<!-- UI Container -->
<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; font-family: system-ui, -apple-system, sans-serif; pointer-events: none; z-index: 1000;">
  
  <!-- Top Bar -->
  <div style="height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; padding: 0 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); pointer-events: auto;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
      🎮 Manifold 3D Studio
      {#if mode === 'cad'}
        <span style="font-size: 16px; opacity: 0.8; margin-left: 12px;">/ CAD Editor</span>
      {/if}
    </h1>
    <div style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
      {#if !manifoldReady && !error}
        <span style="font-size: 14px;">⏳ Ładowanie...</span>
      {:else if error}
        <span style="font-size: 14px;">❌ Błąd</span>
      {:else}
        <span style="font-size: 14px;">✅ Gotowy</span>
      {/if}
    </div>
  </div>

  <div style="flex: 1; display: flex; overflow: hidden;">
    
    <!-- Left Sidebar - Boolean Mode -->
    {#if mode === 'boolean'}
      <div style="width: 320px; background: #1a1a2e; color: white; overflow-y: auto; box-shadow: 2px 0 10px rgba(0,0,0,0.2); pointer-events: auto;">
        
        <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Operacje Boolean</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'union' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="union" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">➕</span>
              <span>Union (A ∪ B)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'difference' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="difference" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">➖</span>
              <span>Difference (A - B)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'intersection' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="intersection" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">✖️</span>
              <span>Intersection (A ∩ B)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'trim' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="trim" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">✂️</span>
              <span>Trim (płaszczyzna)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'split' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="split" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">🔪</span>
              <span>Split (podziel)</span>
            </label>
          </div>
        </div>

        <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Wyświetlanie</h3>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.showWireframe} style="width: 18px; height: 18px;">
            <span>🕸️ Wireframe</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.showEdges} style="width: 18px; height: 18px;">
            <span>📐 Krawędzie</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.showStats} style="width: 18px; height: 18px;">
            <span>📊 Statystyki</span>
          </label>
        </div>

        {#if uiState.showStats && manifoldReady}
          <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Statystyki</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div style="background: #2a2a3e; padding: 12px; border-radius: 6px;">
                <div style="color: #888; margin-bottom: 4px;">Vertices</div>
                <div style="color: #667eea; font-weight: 700; font-size: 18px;">{stats.vertices}</div>
              </div>
              <div style="background: #2a2a3e; padding: 12px; border-radius: 6px;">
                <div style="color: #888; margin-bottom: 4px;">Triangles</div>
                <div style="color: #667eea; font-weight: 700; font-size: 18px;">{stats.triangles}</div>
              </div>
              <div style="background: #2a2a3e; padding: 12px; border-radius: 6px;">
                <div style="color: #888; margin-bottom: 4px;">Genus</div>
                <div style="color: #667eea; font-weight: 700; font-size: 18px;">{stats.genus}</div>
              </div>
              <div style="background: #2a2a3e; padding: 12px; border-radius: 6px;">
                <div style="color: #888; margin-bottom: 4px;">Obiekty</div>
                <div style="color: #667eea; font-weight: 700; font-size: 18px;">{objects.length}</div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Lista obiektów -->
        {#if objects.length > 0}
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Obiekty ({objects.length})</h3>
            
            <div style="margin-bottom: 12px; max-height: 400px; overflow-y: auto;">
              {#each objects as obj}
                <div style="background: {selectedObjects.includes(obj.id) ? 'rgba(102, 126, 234, 0.2)' : '#2a2a3e'}; padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 2px solid {selectedObjects.includes(obj.id) ? '#667eea' : 'transparent'}; opacity: {obj.visible ? 1 : 0.5};">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <input 
                      type="checkbox" 
                      checked={selectedObjects.includes(obj.id)}
                      on:change={() => toggleObjectSelection(obj.id)}
                      style="width: 18px; height: 18px; cursor: pointer;"
                    />
                    
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: {obj.color}; flex-shrink: 0;"></div>
                    
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 13px;">{obj.name}</div>
                      <div style="font-size: 11px; color: #888; margin-top: 2px;">
                        V:{obj.manifold?.numVert() || '?'} T:{obj.manifold?.numTri() || '?'}
                      </div>
                    </div>
                    
                    <button
                      on:click={() => toggleObjectVisibility(obj.id)}
                      style="padding: 6px 10px; background: {obj.visible ? '#4ecdc4' : '#555'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;"
                      title={obj.visible ? 'Ukryj' : 'Pokaż'}
                    >
                      {obj.visible ? '👁️' : '🚫'}
                    </button>
                    
                    <button
                      on:click={() => deleteObject(obj.id)}
                      style="padding: 6px 10px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <!-- Kontrolki przesuwania -->
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px;">
                    <div>
                      <div style="color: #888; margin-bottom: 2px;">X: {obj.position[0].toFixed(1)}</div>
                      <div style="display: flex; gap: 2px;">
                        <button on:click={() => moveObject(obj.id, 'x', -0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">◀</button>
                        <button on:click={() => moveObject(obj.id, 'x', 0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">▶</button>
                      </div>
                    </div>
                    <div>
                      <div style="color: #888; margin-bottom: 2px;">Y: {obj.position[1].toFixed(1)}</div>
                      <div style="display: flex; gap: 2px;">
                        <button on:click={() => moveObject(obj.id, 'y', -0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">▼</button>
                        <button on:click={() => moveObject(obj.id, 'y', 0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">▲</button>
                      </div>
                    </div>
                    <div>
                      <div style="color: #888; margin-bottom: 2px;">Z: {obj.position[2].toFixed(1)}</div>
                      <div style="display: flex; gap: 2px;">
                        <button on:click={() => moveObject(obj.id, 'z', -0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">◀</button>
                        <button on:click={() => moveObject(obj.id, 'z', 0.5)} style="flex: 1; padding: 4px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">▶</button>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            
            {#if selectedObjects.length === 2}
              <button
                on:click={performBooleanOnSelected}
                style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;"
              >
                🔷 Wykonaj {uiState.operation}
              </button>
            {:else}
              <div style="padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; text-align: center; font-size: 12px; color: #888;">
                Zaznacz 2 obiekty do operacji Boolean
              </div>
            {/if}
          </div>
        {:else}
          <div style="padding: 20px; text-align: center; color: #888;">
            <p>Brak obiektów</p>
            <p style="font-size: 12px;">Przejdź do CAD Editor aby stworzyć obiekty</p>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- CAD Editor Mode -->
    {#if mode === 'cad'}
      <div style="width: 420px; background: #f5f5f5; overflow-y: auto; box-shadow: 2px 0 10px rgba(0,0,0,0.2); pointer-events: auto; padding: 20px;">
        <CADEditor 
          onGeometryCreated={handleCADGeometryCreated}
          {Manifold}
          {Mesh}
          {materialIDs}
        />
        
        {#if cadGeometry}
          <div style="margin-top: 20px; padding: 16px; background: white; border-radius: 8px; border: 2px solid #4ecdc4;">
            <h4 style="margin: 0 0 8px 0; color: #4ecdc4;">✓ Obiekt w scenie 3D</h4>
            <p style="margin: 0; font-size: 13px; color: #666;">
              Przełącz na tryb Boolean Ops aby zobaczyć wszystkie obiekty razem.
            </p>
          </div>
        {/if}
      </div>
    {/if}

  </div>

  <!-- Bottom Bar -->
  <div style="height: 40px; background: #16213e; color: white; display: flex; align-items: center; padding: 0 24px; font-size: 12px; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); pointer-events: auto;">
    <span>📦 manifold-3d v3.3.2</span>
    <span style="margin-left: 20px;">|</span>
    <span style="margin-left: 20px;">Mode: {mode === 'boolean' ? 'Boolean Operations' : 'CAD Editor'}</span>
    <span style="margin-left: 20px;">|</span>
    <span style="margin-left: 20px;">Obiekty: {objects.length}</span>
  </div>
</div>

<!-- Canvas pod UI -->
<Canvas>
  <Scene 
    bind:uiState 
    bind:stats 
    bind:manifoldReady 
    bind:error 
    bind:Manifold
    bind:Mesh
    bind:materialIDs
    {cadGeometry}
    {showCADGeometry}
    {objects}
    {selectedObjects}
  />
</Canvas>