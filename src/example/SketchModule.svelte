<script>
  import { onMount } from 'svelte'
  
  export let onContourComplete = (points) => {}
  export let gridSize = 0.5
  export let snapToGrid = true
  
  let canvas
  let ctx
  let points = []
  let currentPoint = null
  let closed = false
  let hovering = false
  
  const POINT_RADIUS = 5
  const HOVER_RADIUS = 10
  const CANVAS_WIDTH = 380
  const CANVAS_HEIGHT = 380
  const ORIGIN_X = CANVAS_WIDTH / 2
  const ORIGIN_Y = CANVAS_HEIGHT / 2
  const SCALE = 40 // pixels per unit
  
  onMount(() => {
    ctx = canvas.getContext('2d')
    draw()
  })
  
  function screenToWorld(screenX, screenY) {
    let x = (screenX - ORIGIN_X) / SCALE
    let y = -(screenY - ORIGIN_Y) / SCALE // Flip Y
    
    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
    }
    
    return { x, y }
  }
  
  function worldToScreen(x, y) {
    return {
      x: x * SCALE + ORIGIN_X,
      y: -y * SCALE + ORIGIN_Y
    }
  }
  
  function isNearFirstPoint(screenX, screenY) {
    if (points.length < 3) return false
    const first = worldToScreen(points[0].x, points[0].y)
    const dx = screenX - first.x
    const dy = screenY - first.y
    return Math.sqrt(dx * dx + dy * dy) < HOVER_RADIUS
  }
  
  function handleMouseMove(e) {
    if (closed) return
    
    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    
    hovering = isNearFirstPoint(screenX, screenY)
    currentPoint = screenToWorld(screenX, screenY)
    draw()
  }
  
  function handleClick(e) {
    if (closed) return
    
    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    
    // Zamknij kontur jeśli kliknięto blisko pierwszego punktu
    if (isNearFirstPoint(screenX, screenY)) {
      closeContour()
      return
    }
    
    const worldPoint = screenToWorld(screenX, screenY)
    points = [...points, worldPoint]
    draw()
  }
  
  function closeContour() {
    if (points.length < 3) return
    closed = true
    currentPoint = null
    onContourComplete(points)
    draw()
  }
  
  function reset() {
    points = []
    currentPoint = null
    closed = false
    hovering = false
    draw()
  }
  
  function undo() {
    if (points.length > 0) {
      points = points.slice(0, -1)
      draw()
    }
  }
  
  function draw() {
    if (!ctx) return
    
    // Clear
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Grid
    if (snapToGrid) {
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      
      for (let x = 0; x <= CANVAS_WIDTH; x += gridSize * SCALE) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      
      for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize * SCALE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }
    }
    
    // Axes
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ORIGIN_X, 0)
    ctx.lineTo(ORIGIN_X, CANVAS_HEIGHT)
    ctx.moveTo(0, ORIGIN_Y)
    ctx.lineTo(CANVAS_WIDTH, ORIGIN_Y)
    ctx.stroke()
    
    // Lines
    if (points.length > 0) {
      ctx.strokeStyle = closed ? '#4ecdc4' : '#667eea'
      ctx.lineWidth = 3
      ctx.beginPath()
      
      const first = worldToScreen(points[0].x, points[0].y)
      ctx.moveTo(first.x, first.y)
      
      for (let i = 1; i < points.length; i++) {
        const p = worldToScreen(points[i].x, points[i].y)
        ctx.lineTo(p.x, p.y)
      }
      
      // Preview line to current point
      if (!closed && currentPoint) {
        const curr = worldToScreen(currentPoint.x, currentPoint.y)
        ctx.lineTo(curr.x, curr.y)
        
        // Line back to start if hovering
        if (hovering) {
          ctx.lineTo(first.x, first.y)
        }
      }
      
      // Close shape if closed
      if (closed) {
        ctx.closePath()
        ctx.fillStyle = 'rgba(78, 205, 196, 0.2)'
        ctx.fill()
      }
      
      ctx.stroke()
    }
    
    // Points
    for (let i = 0; i < points.length; i++) {
      const p = worldToScreen(points[i].x, points[i].y)
      
      ctx.fillStyle = i === 0 ? '#ff6b6b' : '#667eea'
      ctx.beginPath()
      ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      
      // Highlight first point when hovering
      if (i === 0 && hovering && !closed) {
        ctx.strokeStyle = '#ff6b6b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, HOVER_RADIUS, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // Labels
      ctx.fillStyle = '#333'
      ctx.font = '12px monospace'
      ctx.fillText(`(${points[i].x.toFixed(2)}, ${points[i].y.toFixed(2)})`, p.x + 10, p.y - 10)
    }
    
    // Current point preview
    if (!closed && currentPoint) {
      const curr = worldToScreen(currentPoint.x, currentPoint.y)
      ctx.fillStyle = 'rgba(102, 126, 234, 0.5)'
      ctx.beginPath()
      ctx.arc(curr.x, curr.y, POINT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Info
    ctx.fillStyle = '#333'
    ctx.font = '14px sans-serif'
    ctx.fillText(`Points: ${points.length}`, 10, 20)
    if (closed) {
      ctx.fillText('✓ Closed', 10, 40)
    } else if (points.length >= 3) {
      ctx.fillText('Click first point to close', 10, 40)
    }
  }
  
  $: if (ctx) draw()
</script>

<div style="display: flex; flex-direction: column; gap: 12px;">
  <div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <canvas
      bind:this={canvas}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      on:mousemove={handleMouseMove}
      on:click={handleClick}
      style="border: 2px solid #ddd; border-radius: 4px; cursor: crosshair; display: block;"
    />
  </div>
  
  <div style="display: flex; gap: 8px;">
    <button
      on:click={undo}
      disabled={points.length === 0 || closed}
      style="flex: 1; padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; opacity: {points.length === 0 || closed ? 0.5 : 1};"
    >
      ↶ Undo
    </button>
    
    <button
      on:click={closeContour}
      disabled={points.length < 3 || closed}
      style="flex: 1; padding: 10px; background: #4ecdc4; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; opacity: {points.length < 3 || closed ? 0.5 : 1};"
    >
      ✓ Close Contour
    </button>
    
    <button
      on:click={reset}
      style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
    >
      ⟲ Reset
    </button>
  </div>
  
  <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f5f5f5; border-radius: 6px;">
    <input type="checkbox" bind:checked={snapToGrid} style="width: 18px; height: 18px;">
    <span style="font-size: 14px;">Snap to Grid ({gridSize})</span>
  </label>
</div>