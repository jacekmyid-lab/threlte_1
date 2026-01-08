<script>
  export let boxSize
  export let icoRadius
  export let icoDetail
</script>

<div style="padding: 1rem 1.5rem; border-bottom: 1px solid #1f2937;">
  <h3 style="font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem 0;">
    Parametry Geometrii
  </h3>
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
        <label for="box-size" style="color: #d1d5db;">Box Size</label>
        <span style="color: #06b6d4; font-family: monospace;">{boxSize.toFixed(2)}</span>
      </div>
      <input 
        id="box-size"
        type="range" 
        bind:value={boxSize} 
        min="0.5" 
        max="2" 
        step="0.1"
        style="width: 100%; height: 0.5rem; background: #374151; border-radius: 0.5rem; cursor: pointer; accent-color: #06b6d4;"
      />
    </div>
    
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
        <label for="ico-radius" style="color: #d1d5db;">Ico Radius</label>
        <span style="color: #06b6d4; font-family: monospace;">{icoRadius.toFixed(2)}</span>
      </div>
      <input 
        id="ico-radius"
        type="range" 
        bind:value={icoRadius} 
        min="0.3" 
        max="1.5" 
        step="0.1"
        style="width: 100%; height: 0.5rem; background: #374151; border-radius: 0.5rem; cursor: pointer; accent-color: #06b6d4;"
      />
    </div>

    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
        <label for="ico-detail" style="color: #d1d5db;">Ico Detail</label>
        <span style="color: #06b6d4; font-family: monospace;">{icoDetail}</span>
      </div>
      <input 
        id="ico-detail"
        type="range" 
        bind:value={icoDetail} 
        min="0" 
        max="3" 
        step="1"
        style="width: 100%; height: 0.5rem; background: #374151; border-radius: 0.5rem; cursor: pointer; accent-color: #06b6d4;"
      />
    </div>
  </div>
</div>