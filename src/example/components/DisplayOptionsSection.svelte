<script>
  export let autoRotate
  export let showWireframe
  export let showStats
</script>

<div style="padding: 1rem 1.5rem; border-bottom: 1px solid #1f2937;">
  <h3 style="font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem 0;">
    Opcje Wyświetlania
  </h3>
  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(55, 65, 81, 0.5)'" onmouseout="this.style.background='transparent'">
      <input 
        type="checkbox" 
        bind:checked={autoRotate}
        style="width: 1rem; height: 1rem; background: #374151; border: 1px solid #4b5563; border-radius: 0.25rem; cursor: pointer; accent-color: #06b6d4;"
      />
      <span style="font-size: 0.875rem; color: white;">🔄 Auto-rotate</span>
    </label>
    
    <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(55, 65, 81, 0.5)'" onmouseout="this.style.background='transparent'">
      <input 
        type="checkbox" 
        bind:checked={showWireframe}
        style="width: 1rem; height: 1rem; background: #374151; border: 1px solid #4b5563; border-radius: 0.25rem; cursor: pointer; accent-color: #06b6d4;"
      />
      <span style="font-size: 0.875rem; color: white;">🕸️ Wireframe</span>
    </label>
    
    <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(55, 65, 81, 0.5)'" onmouseout="this.style.background='transparent'">
      <input 
        type="checkbox" 
        bind:checked={showStats}
        style="width: 1rem; height: 1rem; background: #374151; border: 1px solid #4b5563; border-radius: 0.25rem; cursor: pointer; accent-color: #06b6d4;"
      />
      <span style="font-size: 0.875rem; color: white;">📊 Statistics</span>
    </label>
  </div>
</div>