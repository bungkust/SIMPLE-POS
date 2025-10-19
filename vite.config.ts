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
    // Enable code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-sheet'],
          supabase: ['@supabase/supabase-js'],
          utils: ['browser-image-compression']
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
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
