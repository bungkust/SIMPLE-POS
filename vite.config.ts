import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['lucide-react'],
  },
  define: {
    // Fix for __WS_TOKEN__ undefined error (common in dev environments)
    __WS_TOKEN__: 'undefined',
    // Fix for React useLayoutEffect in SSR
    global: 'globalThis',
    // Ensure React is available globally
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    // Minimal build config to avoid React chunking issues
    rollupOptions: {
      output: {
        manualChunks: undefined // Let Vite handle chunking automatically
      }
    },
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    target: 'es2020'
  },
  // Asset optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    // Enable compression in development
    middlewareMode: false
  },
  // Preview configuration
  preview: {
    port: 4173,
    host: true
  }
});
