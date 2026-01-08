<script>
  export let autoRotate
  export let showWireframe
  export let showStats
</script>

<div class="px-6 py-4 border-b border-gray-800">
  <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
    Opcje Wyświetlania
  </h3>
  <div class="space-y-2">
    <label class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
      <input 
        type="checkbox" 
        bind:checked={autoRotate}
        class="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
      />
      <span class="text-sm">🔄 Auto-rotate</span>
    </label>
    
    <label class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
      <input 
        type="checkbox" 
        bind:checked={showWireframe}
        class="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
      />
      <span class="text-sm">🕸️ Wireframe</span>
    </label>
    
    <label class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
      <input 
        type="checkbox" 
        bind:checked={showStats}
        class="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
      />
      <span class="text-sm">📊 Statistics</span>
    </label>
  </div>
</div>