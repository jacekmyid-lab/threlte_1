<script>
  export let stats
</script>

<div style="padding: 1.5rem; background: rgba(31, 41, 55, 0.5);">
  <h3 style="font-size: 0.875rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem 0;">
    Statystyki Modelu
  </h3>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.75rem;">
    <div style="background: #111827; border-radius: 0.5rem; padding: 0.5rem;">
      <div style="color: #6b7280; margin-bottom: 0.25rem;">Vertices</div>
      <div style="color: #06b6d4; font-family: monospace; font-weight: 600;">{stats.vertices}</div>
    </div>
    <div style="background: #111827; border-radius: 0.5rem; padding: 0.5rem;">
      <div style="color: #6b7280; margin-bottom: 0.25rem;">Triangles</div>
      <div style="color: #06b6d4; font-family: monospace; font-weight: 600;">{stats.triangles}</div>
    </div>
    <div style="background: #111827; border-radius: 0.5rem; padding: 0.5rem;">
      <div style="color: #6b7280; margin-bottom: 0.25rem;">Genus</div>
      <div style="color: #06b6d4; font-family: monospace; font-weight: 600;">{stats.genus}</div>
    </div>
    <div style="background: #111827; border-radius: 0.5rem; padding: 0.5rem;">
      <div style="color: #6b7280; margin-bottom: 0.25rem;">Volume</div>
      <div style="color: #06b6d4; font-family: monospace; font-weight: 600;">{stats.volume}</div>
    </div>
    <div style="background: #111827; border-radius: 0.5rem; padding: 0.5rem; grid-column: span 2;">
      <div style="color: #6b7280; margin-bottom: 0.25rem;">Surface Area</div>
      <div style="color: #06b6d4; font-family: monospace; font-weight: 600;">{stats.surfaceArea}</div>
    </div>
  </div>
</div>