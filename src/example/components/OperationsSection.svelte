<script>
  export let operation

  const operations = [
    { value: 'union', label: 'Union (∪)', icon: '➕', color: 'cyan' },
    { value: 'difference', label: 'Difference (−)', icon: '➖', color: 'red' },
    { value: 'intersection', label: 'Intersection (∩)', icon: '✖️', color: 'yellow' }
  ]
</script>

<div class="px-6 py-4 border-b border-gray-800">
  <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
    Operacje Boolean
  </h3>
  <div class="space-y-2">
    {#each operations as op}
      <label 
        class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
        class:bg-cyan-500={operation === op.value && op.color === 'cyan'}
        class:bg-red-500={operation === op.value && op.color === 'red'}
        class:bg-yellow-500={operation === op.value && op.color === 'yellow'}
        class:bg-opacity-20={operation === op.value}
        class:ring-2={operation === op.value}
        class:ring-cyan-500={operation === op.value && op.color === 'cyan'}
        class:ring-red-500={operation === op.value && op.color === 'red'}
        class:ring-yellow-500={operation === op.value && op.color === 'yellow'}
        class:bg-gray-800={operation !== op.value}
        class:bg-opacity-50={operation !== op.value}
        class:hover:bg-gray-800={operation !== op.value}
      >
        <input 
          type="radio" 
          bind:group={operation} 
          value={op.value}
          class="w-4 h-4 bg-gray-700 border-gray-600 accent-cyan-500"
        />
        <span class="text-lg">{op.icon}</span>
        <span class="flex-1 text-sm font-medium">{op.label}</span>
      </label>
    {/each}
  </div>
</div>