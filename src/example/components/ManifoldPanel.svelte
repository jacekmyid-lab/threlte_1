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

<div class="fixed top-4 left-4 w-80 bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden z-50">
  <!-- Header -->
  <div class="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
    <h2 class="text-xl font-bold flex items-center gap-2">
      <span>🎮</span>
      <span>Manifold 3D</span>
    </h2>
    <p class="text-sm text-cyan-100 mt-1">Boolean Operations Test</p>
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
  <div class="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-xs text-gray-400">
    <div class="flex items-center justify-between">
      <span>📦 manifold-3d @ npm</span>
      <span>🎨 Tailwind UI</span>
    </div>
  </div>
</div>