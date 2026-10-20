import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Long-lived vendor chunks: these libraries change far less often than app code, so
// splitting them out lets returning visitors keep them cached across deploys.
const VENDOR_CHUNKS = {
  'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
  'vendor-firebase': ['firebase', '@firebase'],
  'vendor-motion': ['framer-motion', 'motion-dom', 'motion-utils'],
}

function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  const pkgPath = id.split('node_modules/').pop()
  const pkg = pkgPath.startsWith('@') ? pkgPath.split('/').slice(0, 2).join('/') : pkgPath.split('/')[0]
  for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
    if (pkgs.some(p => pkg === p || pkg.startsWith(p + '/'))) return chunk
  }
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { ignored: ['**/graphify-out/**', '**/.gsd/**', '**/dist/**', '**/.wrangler/**'] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
