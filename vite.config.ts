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
    // Optimized build config for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('src/pages/AdminDashboardNew') || id.includes('src/pages/SuperAdminDashboardNew')) {
            return 'admin-pages';
          }
          if (id.includes('src/pages/CheckoutPageNew') || id.includes('src/pages/OrderSuccessPageNew')) {
            return 'checkout-pages';
          }
          if (id.includes('src/components/admin/')) {
            return 'admin-components';
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
      },
      mangle: {
        toplevel: true,
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
