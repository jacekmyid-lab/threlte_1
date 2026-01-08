<script>
  export let operation

  const operations = [
    { value: 'union', label: 'Union (∪)', icon: '➕', color: '#06b6d4' },
    { value: 'difference', label: 'Difference (−)', icon: '➖', color: '#ef4444' },
    { value: 'intersection', label: 'Intersection (∩)', icon: '✖️', color: '#eab308' }
  ]
</script>

<div style="padding: 1rem 1.5rem; border-bottom: 1px solid #1f2937;">
  <h3 style="font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem 0;">
    Operacje Boolean
  </h3>
  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    {#each operations as op}
      <label 
        style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; background: {operation === op.value ? op.color : '#1f2937'}; opacity: {operation === op.value ? '0.3' : '1'}; border: {operation === op.value ? '2px solid ' + op.color : 'none'};"
      >
        <input 
          type="radio" 
          bind:group={operation} 
          value={op.value}
          style="width: 1rem; height: 1rem; cursor: pointer; accent-color: {op.color};"
        />
        <span style="font-size: 1.125rem;">{op.icon}</span>
        <span style="flex: 1; font-size: 0.875rem; font-weight: 500; color: white;">{op.label}</span>
      </label>
    {/each}
  </div>
</div>