import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  
  optimizeDeps: {
    exclude: ['manifold-3d'], // Wyłącz manifold-3d z pre-bundling Vite
  },
  
  server: {
    fs: {
      // Pozwól na dostęp do plików WASM
      allow: ['..']
    }
  },
  
  build: {
    target: 'esnext', // Nowoczesny target dla lepszej obsługi WASM
  }
})
