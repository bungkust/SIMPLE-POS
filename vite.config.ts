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
    exclude: ['lucide-react'],
  },
  define: {
    // Fix for __WS_TOKEN__ undefined error (common in dev environments)
    __WS_TOKEN__: 'undefined',
  },
  build: {
    // Simplified build config for Netlify compatibility
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Simplified chunking strategy
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
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
