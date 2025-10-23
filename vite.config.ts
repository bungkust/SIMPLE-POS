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
  esbuild: {
    define: {
      global: 'globalThis',
    },
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
    // Optimized build config for better performance
    rollupOptions: {
      external: (id) => {
        // Don't externalize React in production builds
        return false;
      },
      output: {
        // Ensure proper chunk loading order
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        manualChunks: (id) => {
          // Vendor chunks - simplified to avoid circular dependencies
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-libs';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-libs';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-lib';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
          
          // App chunks - simplified to avoid circular dependencies
          if (id.includes('src/pages/')) {
            return 'pages';
          }
          if (id.includes('src/components/')) {
            return 'components';
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
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        // Avoid hoisting issues
        hoist_funs: false,
        hoist_vars: false,
      },
      mangle: {
        toplevel: true,
        // Avoid mangling that could cause initialization issues
        keep_fnames: true,
      },
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
