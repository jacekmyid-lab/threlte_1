<script>
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  
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
</script>

<!-- UI na zewnątrz Canvas -->
<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; font-family: system-ui, -apple-system, sans-serif; pointer-events: none; z-index: 1000;">
  
  <!-- Top Bar -->
  <div style="height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; padding: 0 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); pointer-events: auto;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🎮 Manifold 3D Studio</h1>
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
    
    <!-- Left Sidebar -->
    <div style="width: 300px; background: #1a1a2e; color: white; overflow-y: auto; box-shadow: 2px 0 10px rgba(0,0,0,0.2); pointer-events: auto;">
      
      <div style="padding: 20px; border-bottom: 1px solid #2a2a3e;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Operacje Boolean</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'union' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
            <input type="radio" bind:group={uiState.operation} value="union" style="width: 18px; height: 18px;">
            <span style="font-size: 20px;">➕</span>
            <span>Union</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'difference' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
            <input type="radio" bind:group={uiState.operation} value="difference" style="width: 18px; height: 18px;">
            <span style="font-size: 20px;">➖</span>
            <span>Difference</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: {uiState.operation === 'intersection' ? '#667eea' : '#2a2a3e'}; border-radius: 8px; cursor: pointer;">
            <input type="radio" bind:group={uiState.operation} value="intersection" style="width: 18px; height: 18px;">
            <span style="font-size: 20px;">✖️</span>
            <span>Intersection</span>
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
    </div>

  </div>

  <!-- Bottom Bar -->
  <div style="height: 40px; background: #16213e; color: white; display: flex; align-items: center; padding: 0 24px; font-size: 12px; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); pointer-events: auto;">
    <span>📦 manifold-3d v3.3.2</span>
    <span style="margin-left: 20px;">|</span>
    <span style="margin-left: 20px;">Made with Threlte + Three.js</span>
  </div>
</div>

<!-- Canvas pod UI -->
<Canvas>
  <Scene bind:uiState bind:stats bind:manifoldReady bind:error />
</Canvas>