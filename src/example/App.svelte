<script>
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  import CADEditor from './CADEditor.svelte'
  
  let mode = 'boolean' // 'boolean' | 'cad'
  
  let uiState = {
    operation: 'union',
    autoRotate: true,
    showWireframe: false,
    showStats: true,
    boxSize: 1.0,
    icoRadius: 0.6,
    icoDetail: 0
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
  let objects = [] // Lista wszystkich obiektów Manifold
  let selectedObjects = [] // Zaznaczone obiekty do operacji
  
  // CAD geometry (tymczasowe)
  let cadGeometry = null
  let showCADGeometry = false
  
  function handleCADGeometryCreated(data) {
    console.log('🎯 CAD Geometry created:', data)
    
    // Dodaj do listy obiektów
    const newObject = {
      id: `obj_${Date.now()}`,
      name: `Extrude ${objects.length + 1}`,
      type: 'extrude',
      geometry: data.geometry,
      manifold: data.manifold,
      contour: data.contour,
      extrusion: data.extrusion,
      position: [objects.length * 2.5, 0, 0], // Rozmieść obiekty
      visible: true
    }
    
    objects = [...objects, newObject]
    
    // Aktualizuj statystyki z tego obiektu
    if (data.manifold) {
      stats.vertices = data.manifold.numVert()
      stats.triangles = data.manifold.numTri()
      stats.genus = data.manifold.genus()
    }
    
    cadGeometry = null // Wyczyść tymczasowy obiekt
    console.log('✓ Obiekt dodany do sceny:', newObject)
  }
  
  function toggleObjectSelection(objId) {
    if (selectedObjects.includes(objId)) {
      selectedObjects = selectedObjects.filter(id => id !== objId)
    } else {
      selectedObjects = [...selectedObjects, objId]
    }
  }
  
  function deleteObject(objId) {
    objects = objects.filter(obj => obj.id !== objId)
    selectedObjects = selectedObjects.filter(id => id !== objId)
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
      let result
      let resultName = ''
      
      if (uiState.operation === 'union') {
        result = obj1.manifold.add(obj2.manifold)
        resultName = `${obj1.name} ∪ ${obj2.name}`
      } else if (uiState.operation === 'difference') {
        result = obj1.manifold.subtract(obj2.manifold)
        resultName = `${obj1.name} − ${obj2.name}`
      } else if (uiState.operation === 'intersection') {
        result = obj1.manifold.intersect(obj2.manifold)
        resultName = `${obj1.name} ∩ ${obj2.name}`
      } else if (uiState.operation === 'trim') {
        result = obj1.manifold.trimByPlane([0, 0, 1], 0)
        resultName = `${obj1.name} (trimmed)`
      } else if (uiState.operation === 'split') {
        const [part1, part2] = obj1.manifold.split(obj2.manifold)
        // Dla split dodajemy obie części
        if (part1 && !part1.isEmpty()) {
          addResultObject(part1, `${obj1.name} (część 1)`, obj1.position)
        }
        if (part2 && !part2.isEmpty()) {
          addResultObject(part2, `${obj1.name} (część 2)`, [obj1.position[0] + 1.5, obj1.position[1], obj1.position[2]])
        }
        selectedObjects = []
        return
      }
      
      if (result && !result.isEmpty()) {
        addResultObject(result, resultName, [(obj1.position[0] + obj2.position[0]) / 2, 0, 0])
        console.log('✓ Boolean operation result:', result)
      } else {
        alert('Operacja zwróciła pusty wynik')
      }
      
      selectedObjects = []
      
    } catch (e) {
      console.error('Błąd operacji Boolean:', e)
      alert(`Błąd: ${e.message}`)
    }
  }
  
  function addResultObject(manifold, name, position) {
    // Musimy przekonwertować Manifold z powrotem na geometrię
    // Na razie tworzymy placeholder
    const newObject = {
      id: `obj_${Date.now()}`,
      name: name,
      type: 'boolean_result',
      geometry: null, // TODO: Konwersja manifold -> geometry
      manifold: manifold,
      position: position,
      visible: true
    }
    
    objects = [...objects, newObject]
    console.log('✓ Wynik dodany:', newObject)
  }
  
  $: showCADGeometry = false // CAD geometry jest tylko tymczasowe
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
      <div style="width: 300px; background: #1a1a2e; color: white; overflow-y: auto; box-shadow: 2px 0 10px rgba(0,0,0,0.2); pointer-events: auto;">
        
        <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Operacje Boolean</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'union' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="union" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">➕</span>
              <span>Union (∪)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'difference' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="difference" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">➖</span>
              <span>Difference (−)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'intersection' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="intersection" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">✖️</span>
              <span>Intersection (∩)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'trim' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="trim" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">✂️</span>
              <span>Trim</span>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'split' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
              <input type="radio" bind:group={uiState.operation} value="split" style="width: 18px; height: 18px;">
              <span style="font-size: 20px;">🔪</span>
              <span>Split</span>
            </label>
          </div>
        </div>

        <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Parametry</h3>
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px;">Box Size</span>
              <span style="font-size: 13px; color: #667eea; font-weight: 600;">{uiState.boxSize.toFixed(2)}</span>
            </div>
            <input type="range" bind:value={uiState.boxSize} min="0.5" max="2" step="0.1" 
              style="width: 100%; height: 6px; background: #2a2a3e; border-radius: 3px; cursor: pointer;">
          </div>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px;">Ico Radius</span>
              <span style="font-size: 13px; color: #667eea; font-weight: 600;">{uiState.icoRadius.toFixed(2)}</span>
            </div>
            <input type="range" bind:value={uiState.icoRadius} min="0.3" max="1.5" step="0.1"
              style="width: 100%; height: 6px; background: #2a2a3e; border-radius: 3px; cursor: pointer;">
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px;">Ico Detail</span>
              <span style="font-size: 13px; color: #667eea; font-weight: 600;">{uiState.icoDetail}</span>
            </div>
            <input type="range" bind:value={uiState.icoDetail} min="0" max="3" step="1"
              style="width: 100%; height: 6px; background: #2a2a3e; border-radius: 3px; cursor: pointer;">
          </div>
        </div>

        <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Wyświetlanie</h3>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.autoRotate} style="width: 18px; height: 18px;">
            <span>🔄 Auto-rotate</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.showWireframe} style="width: 18px; height: 18px;">
            <span>🕸️ Wireframe</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer;">
            <input type="checkbox" bind:checked={uiState.showStats} style="width: 18px; height: 18px;">
            <span>📊 Statistics</span>
          </label>
        </div>

        {#if uiState.showStats && manifoldReady}
          <div style="padding: 20px;">
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
                <div style="color: #888; margin-bottom: 4px;">Volume</div>
                <div style="color: #667eea; font-weight: 700; font-size: 16px;">{stats.volume}</div>
              </div>
            </div>
          </div>
        {/if}
        
        {#if cadGeometry}
          <div style="padding: 20px; border-top: 1px solid #2a2a3e;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Obiekt CAD</h3>
            <div style="background: #2a2a3e; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <div style="color: #4ecdc4; font-weight: 600; margin-bottom: 8px;">✓ W scenie 3D</div>
              <div style="font-size: 12px; color: #888;">
                Punkty konturu: {cadGeometry.contour.length}<br>
                Wysokość: {cadGeometry.extrusion.height}
              </div>
            </div>
            <button
              on:click={() => cadGeometry = null}
              style="width: 100%; padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;"
            >
              🗑️ Usuń obiekt CAD
            </button>
          </div>
        {/if}
        
        <!-- Lista obiektów -->
        {#if objects.length > 0}
          <div style="padding: 20px; border-top: 1px solid #2a2a3e;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Obiekty ({objects.length})</h3>
            
            <div style="margin-bottom: 12px;">
              {#each objects as obj}
                <div style="background: {selectedObjects.includes(obj.id) ? 'rgba(102, 126, 234, 0.2)' : '#2a2a3e'}; padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 2px solid {selectedObjects.includes(obj.id) ? '#667eea' : 'transparent'};">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input 
                      type="checkbox" 
                      checked={selectedObjects.includes(obj.id)}
                      on:change={() => toggleObjectSelection(obj.id)}
                      style="width: 18px; height: 18px; cursor: pointer;"
                    />
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 13px;">{obj.name}</div>
                      <div style="font-size: 11px; color: #888; margin-top: 2px;">
                        {obj.type} • V:{obj.manifold?.numVert() || '?'} T:{obj.manifold?.numTri() || '?'}
                      </div>
                    </div>
                    <button
                      on:click={() => deleteObject(obj.id)}
                      style="padding: 6px 10px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;"
                    >
                      🗑️
                    </button>
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
    <span style="margin-left: 20px;">Made with Threlte + Three.js</span>
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