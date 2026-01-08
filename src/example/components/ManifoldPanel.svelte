<script>
  import StatusSection from './StatusSection.svelte'
  import OperationsSection from './OperationsSection.svelte'
  import GeometryParamsSection from './GeometryParamsSection.svelte'
  import DisplayOptionsSection from './DisplayOptionsSection.svelte'
  import StatsSection from './StatsSection.svelte'

  export let uiState
  export let manifoldReady
  export let error
  export let stats
</script>

<div style="position: fixed; top: 16px; left: 16px; width: 320px; max-height: calc(100vh - 32px); background: #111827; color: white; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow-y: auto; overflow-x: hidden; z-index: 99999;">
  <!-- Header -->
  <div style="background: linear-gradient(to right, #06b6d4, #3b82f6); padding: 1rem 1.5rem;">
    <h2 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
      <span>🎮</span>
      <span>Manifold 3D</span>
    </h2>
    <p style="font-size: 0.875rem; color: #cffafe; margin: 0.25rem 0 0 0;">Boolean Operations Test</p>
  </div>

  <StatusSection {manifoldReady} {error} />
  
  <OperationsSection bind:operation={uiState.operation} />
  
  <GeometryParamsSection 
    bind:boxSize={uiState.boxSize}
    bind:icoRadius={uiState.icoRadius}
    bind:icoDetail={uiState.icoDetail}
  />
  
  <DisplayOptionsSection 
    bind:autoRotate={uiState.autoRotate}
    bind:showWireframe={uiState.showWireframe}
    bind:showStats={uiState.showStats}
  />
  
  {#if uiState.showStats && manifoldReady}
    <StatsSection {stats} />
  {/if}

  <!-- Footer -->
  <div style="padding: 0.75rem 1.5rem; background: linear-gradient(to right, #1f2937, #111827); font-size: 0.75rem; color: #9ca3af;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>📦 manifold-3d @ npm</span>
      <span>🎨 Tailwind UI</span>
    </div>
  </div>
</div>