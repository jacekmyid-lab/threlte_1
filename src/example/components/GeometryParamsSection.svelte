<script>
  export let boxSize
  export let icoRadius
  export let icoDetail
</script>

<div class="px-6 py-4 border-b border-gray-800">
  <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
    Parametry Geometrii
  </h3>
  <div class="space-y-4">
    <div>
      <div class="flex items-center justify-between text-sm mb-2">
        <label for="box-size" class="text-gray-300">Box Size</label>
        <span class="text-cyan-400 font-mono">{boxSize.toFixed(2)}</span>
      </div>
      <input 
        id="box-size"
        type="range" 
        bind:value={boxSize} 
        min="0.5" 
        max="2" 
        step="0.1"
        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
    
    <div>
      <div class="flex items-center justify-between text-sm mb-2">
        <label for="ico-radius" class="text-gray-300">Ico Radius</label>
        <span class="text-cyan-400 font-mono">{icoRadius.toFixed(2)}</span>
      </div>
      <input 
        id="ico-radius"
        type="range" 
        bind:value={icoRadius} 
        min="0.3" 
        max="1.5" 
        step="0.1"
        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>

    <div>
      <div class="flex items-center justify-between text-sm mb-2">
        <label for="ico-detail" class="text-gray-300">Ico Detail</label>
        <span class="text-cyan-400 font-mono">{icoDetail}</span>
      </div>
      <input 
        id="ico-detail"
        type="range" 
        bind:value={icoDetail} 
        min="0" 
        max="3" 
        step="1"
        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  </div>
</div>