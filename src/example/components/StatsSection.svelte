<script>
  export let stats
</script>

<div class="px-6 py-4 bg-gray-800/50">
  <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
    Statystyki Modelu
  </h3>
  <div class="grid grid-cols-2 gap-3 text-xs">
    <div class="bg-gray-900 rounded-lg p-2">
      <div class="text-gray-500 mb-1">Vertices</div>
      <div class="text-cyan-400 font-mono font-semibold">{stats.vertices}</div>
    </div>
    <div class="bg-gray-900 rounded-lg p-2">
      <div class="text-gray-500 mb-1">Triangles</div>
      <div class="text-cyan-400 font-mono font-semibold">{stats.triangles}</div>
    </div>
    <div class="bg-gray-900 rounded-lg p-2">
      <div class="text-gray-500 mb-1">Genus</div>
      <div class="text-cyan-400 font-mono font-semibold">{stats.genus}</div>
    </div>
    <div class="bg-gray-900 rounded-lg p-2">
      <div class="text-gray-500 mb-1">Volume</div>
      <div class="text-cyan-400 font-mono font-semibold">{stats.volume}</div>
    </div>
    <div class="bg-gray-900 rounded-lg p-2 col-span-2">
      <div class="text-gray-500 mb-1">Surface Area</div>
      <div class="text-cyan-400 font-mono font-semibold">{stats.surfaceArea}</div>
    </div>
  </div>
</div>