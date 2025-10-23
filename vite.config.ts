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
        manualChunks: (id) => {
          // Core React - separate chunks
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-core';
          }
          if (id.includes('react-router')) {
            return 'react-router';
          }
          // UI Components - separate by library
          if (id.includes('lucide-react')) {
            return 'lucide';
          }
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
          // Supabase - separate chunks
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-core';
          }
          if (id.includes('@supabase/auth')) {
            return 'supabase-auth';
          }
          // Utils - separate by function
          if (id.includes('browser-image-compression')) {
            return 'image-utils';
          }
          if (id.includes('utils/') || id.includes('lib/')) {
            return 'app-utils';
          }
          // Admin components
          if (id.includes('admin/')) {
            return 'admin';
          }
          // Pages - separate by route
          if (id.includes('pages/Checkout')) {
            return 'checkout';
          }
          if (id.includes('pages/Admin')) {
            return 'admin-pages';
          }
          if (id.includes('pages/')) {
            return 'pages';
          }
          // Components - separate by type
          if (id.includes('components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('components/')) {
            return 'components';
          }
          // Default chunk
          return 'vendor';
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
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2, // Reduced passes to avoid terser errors
        unsafe: false, // Disable unsafe optimizations
        conditionals: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        loops: true,
        reduce_vars: true,
        sequences: true,
        switches: true,
        toplevel: true,
        unused: true
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false
      }
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    // Target modern browsers
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true
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
