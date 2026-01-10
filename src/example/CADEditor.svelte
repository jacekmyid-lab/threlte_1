<script>
  import SketchModule from './SketchModule.svelte'
  import { extrudeContour, threeGeometryToManifoldMesh } from '../lib/manifold/extrudeModule'
  
  export let onGeometryCreated = (geometry) => {}
  export let Manifold = null
  export let Mesh = null
  export let materialIDs = []
  
  let step = 'sketch' // 'sketch' | 'extrude' | 'preview'
  let contourPoints = []
  let extrudeHeight = 2.0
  let extrudeTwist = 0
  let extrudeScale = 1.0
  let extrudeSteps = 1
  let previewGeometry = null
  let manifoldObject = null
  let error = null
  
  function handleContourComplete(points) {
    contourPoints = points
    step = 'extrude'
    console.log('✓ Kontur zamknięty, punktów:', points.length)
  }
  
  function generateExtrusion() {
    try {
      error = null
      
      // Generuj Three.js geometrię
      previewGeometry = extrudeContour(contourPoints, {
        height: extrudeHeight,
        twist: extrudeTwist,
        scale: extrudeScale,
        steps: extrudeSteps
      })
      
      console.log('✓ Geometria wygenerowana')
      step = 'preview'
      
    } catch (e) {
      console.error('Błąd ekstruzji:', e)
      error = e.message
    }
  }
  
  function createManifold() {
    try {
      error = null
      
      if (!Manifold || !Mesh) {
        error = 'Manifold nie jest załadowany'
        return
      }
      
      console.log('🎯 Tworzenie Manifold z geometrii:', previewGeometry)
      console.log('📊 Vertices:', previewGeometry.attributes.position.count)
      console.log('🔺 Triangles:', previewGeometry.index.count / 3)
      console.log('🎨 Groups:', previewGeometry.groups)
      
      // Konwertuj do Manifold Mesh
      const manifoldMesh = threeGeometryToManifoldMesh(
        previewGeometry, 
        Mesh,
        materialIDs
      )
      
      console.log('✓ Manifold Mesh utworzony')
      
      // Utwórz Manifold
      manifoldObject = new Manifold(manifoldMesh)
      
      console.log('✓ Manifold utworzony:', {
        vertices: manifoldObject.numVert(),
        triangles: manifoldObject.numTri(),
        genus: manifoldObject.genus(),
        isEmpty: manifoldObject.isEmpty()
      })
      
      // Wywołaj callback
      onGeometryCreated({
        geometry: previewGeometry,
        manifold: manifoldObject,
        contour: contourPoints,
        extrusion: {
          height: extrudeHeight,
          twist: extrudeTwist,
          scale: extrudeScale,
          steps: extrudeSteps
        }
      })
      
    } catch (e) {
      console.error('❌ Błąd tworzenia Manifold:', e)
      error = `${e.name}: ${e.message}`
      
      if (e.message.includes('Not manifold')) {
        error += ' - Geometria nie jest zamknięta poprawnie. Spróbuj prostszego kształtu lub zwiększ kroki.'
      }
    }
  }
  
  function reset() {
    step = 'sketch'
    contourPoints = []
    previewGeometry = null
    manifoldObject = null
    error = null
  }
  
  function backToExtrude() {
    step = 'extrude'
    previewGeometry = null
  }
  
  function backToSketch() {
    step = 'sketch'
    contourPoints = []
    previewGeometry = null
  }
</script>

<div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <!-- Header z krokami -->
  <div style="margin-bottom: 20px;">
    <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #333;">
      🎨 CAD Editor - Extrude Tool
    </h2>
    
    <div style="display: flex; gap: 8px; align-items: center;">
      <div style="flex: 1; height: 4px; background: {step === 'sketch' || step === 'extrude' || step === 'preview' ? '#667eea' : '#ddd'}; border-radius: 2px;"></div>
      <span style="font-size: 12px; font-weight: 600; color: {step === 'sketch' || step === 'extrude' || step === 'preview' ? '#667eea' : '#999'};">1. SKETCH</span>
      
      <div style="flex: 1; height: 4px; background: {step === 'extrude' || step === 'preview' ? '#667eea' : '#ddd'}; border-radius: 2px;"></div>
      <span style="font-size: 12px; font-weight: 600; color: {step === 'extrude' || step === 'preview' ? '#667eea' : '#999'};">2. EXTRUDE</span>
      
      <div style="flex: 1; height: 4px; background: {step === 'preview' ? '#667eea' : '#ddd'}; border-radius: 2px;"></div>
      <span style="font-size: 12px; font-weight: 600; color: {step === 'preview' ? '#667eea' : '#999'};">3. PREVIEW</span>
    </div>
  </div>
  
  {#if error}
    <div style="background: #fee; border: 2px solid #f88; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #c33;">
      <strong>❌ Błąd:</strong> {error}
    </div>
  {/if}
  
  <!-- Krok 1: Sketch -->
  {#if step === 'sketch'}
    <div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #667eea;">📐 Narysuj kontur</h3>
      <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
        Kliknij aby dodać punkty. Kliknij na pierwszy punkt aby zamknąć kontur.
      </p>
      
      <SketchModule onContourComplete={handleContourComplete} />
    </div>
  {/if}
  
  <!-- Krok 2: Extrude -->
  {#if step === 'extrude'}
    <div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #667eea;">⬆️ Parametry ekstruzji</h3>
      <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
        Kontur: {contourPoints.length} punktów
      </p>
      
      <div style="display: grid; gap: 20px; margin-bottom: 20px;">
        <!-- Height -->
        <div>
          <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; color: #333;">
            <span>Wysokość (Height)</span>
            <span style="color: #667eea; font-family: monospace;">{extrudeHeight.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            bind:value={extrudeHeight} 
            min="0.1" 
            max="5" 
            step="0.1"
            style="width: 100%; height: 8px; background: #ddd; border-radius: 4px; cursor: pointer;"
          />
        </div>
        
        <!-- Twist -->
        <div>
          <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; color: #333;">
            <span>Skręcenie (Twist)</span>
            <span style="color: #667eea; font-family: monospace;">{extrudeTwist}°</span>
          </label>
          <input 
            type="range" 
            bind:value={extrudeTwist} 
            min="-180" 
            max="180" 
            step="5"
            style="width: 100%; height: 8px; background: #ddd; border-radius: 4px; cursor: pointer;"
          />
        </div>
        
        <!-- Scale -->
        <div>
          <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; color: #333;">
            <span>Skalowanie (Scale)</span>
            <span style="color: #667eea; font-family: monospace;">{extrudeScale.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            bind:value={extrudeScale} 
            min="0.1" 
            max="2" 
            step="0.05"
            style="width: 100%; height: 8px; background: #ddd; border-radius: 4px; cursor: pointer;"
          />
        </div>
        
        <!-- Steps -->
        <div>
          <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; color: #333;">
            <span>Kroki (Steps)</span>
            <span style="color: #667eea; font-family: monospace;">{extrudeSteps}</span>
          </label>
          <input 
            type="range" 
            bind:value={extrudeSteps} 
            min="1" 
            max="20" 
            step="1"
            style="width: 100%; height: 8px; background: #ddd; border-radius: 4px; cursor: pointer;"
          />
        </div>
      </div>
      
      <div style="display: flex; gap: 8px;">
        <button
          on:click={backToSketch}
          style="flex: 1; padding: 12px; background: #ddd; color: #333; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          ← Wróć do szkicu
        </button>
        <button
          on:click={generateExtrusion}
          style="flex: 2; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          Generuj podgląd →
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Krok 3: Preview -->
  {#if step === 'preview'}
    <div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #4ecdc4;">✓ Podgląd gotowy</h3>
      
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Informacje o geometrii:</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
          <div>
            <span style="color: #999;">Punkty konturu:</span>
            <strong style="color: #333; margin-left: 8px;">{contourPoints.length}</strong>
          </div>
          <div>
            <span style="color: #999;">Wysokość:</span>
            <strong style="color: #333; margin-left: 8px;">{extrudeHeight.toFixed(2)}</strong>
          </div>
          <div>
            <span style="color: #999;">Skręcenie:</span>
            <strong style="color: #333; margin-left: 8px;">{extrudeTwist}°</strong>
          </div>
          <div>
            <span style="color: #999;">Skalowanie:</span>
            <strong style="color: #333; margin-left: 8px;">{extrudeScale.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      {#if manifoldObject}
        <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <strong style="color: #2e7d32;">✓ Manifold utworzony pomyślnie!</strong>
          <div style="margin-top: 8px; font-size: 13px; color: #555;">
            Vertices: {manifoldObject.numVert()} | 
            Triangles: {manifoldObject.numTri()} | 
            Genus: {manifoldObject.genus()}
          </div>
        </div>
      {/if}
      
      <div style="display: flex; gap: 8px;">
        <button
          on:click={backToExtrude}
          style="flex: 1; padding: 12px; background: #ddd; color: #333; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          ← Edytuj parametry
        </button>
        
        {#if !manifoldObject}
          <button
            on:click={createManifold}
            disabled={!Manifold || !Mesh}
            style="flex: 2; padding: 12px; background: {Manifold && Mesh ? '#4ecdc4' : '#ccc'}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; opacity: {Manifold && Mesh ? 1 : 0.6};"
          >
            🎯 Utwórz Manifold
          </button>
        {:else}
          <button
            on:click={reset}
            style="flex: 2; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;"
          >
            ✨ Nowy obiekt
          </button>
        {/if}
      </div>
      
      <!-- Debug info -->
      {#if previewGeometry && !manifoldObject}
        <div style="margin-top: 12px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; font-size: 12px;">
          <strong>🔍 Debug Info:</strong><br>
          Vertices: {previewGeometry.attributes.position.count}<br>
          Triangles: {previewGeometry.index ? previewGeometry.index.count / 3 : previewGeometry.attributes.position.count / 3}<br>
          Groups: {previewGeometry.groups.length}<br>
          Indexed: {previewGeometry.index ? 'Yes' : 'No'}<br>
          <details style="margin-top: 8px;">
            <summary style="cursor: pointer; font-weight: 600;">Zobacz szczegóły</summary>
            <pre style="margin-top: 8px; font-size: 10px; overflow: auto; max-height: 200px;">{JSON.stringify(previewGeometry.groups, null, 2)}</pre>
          </details>
        </div>
      {/if}
    </div>
  {/if}
</div>