<script>
  export let manifoldReady
  export let error
</script>

<div class="px-6 py-4 border-b border-gray-800">
  {#if !manifoldReady && !error}
    <div class="flex items-center gap-3 text-yellow-400">
      <div class="animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent"></div>
      <span class="text-sm font-medium">Ładowanie Manifold...</span>
    </div>
  {:else if error}
    <div class="bg-red-900/30 border border-red-500 rounded-lg p-3">
      <p class="text-red-400 text-sm font-medium">❌ {error}</p>
      <p class="text-red-300 text-xs mt-2">💡 npm install manifold-3d</p>
    </div>
  {:else}
    <div class="flex items-center gap-2 text-green-400">
      <span class="text-lg">✅</span>
      <span class="text-sm font-medium">Gotowy do użycia</span>
    </div>
  {/if}
</div>