/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

// Performance budget plugin
const performanceBudgetPlugin = () => {
  return {
    name: 'performance-budget',
    generateBundle(_options: any, bundle: any) {
      const budgets = {
        totalSize: 2 * 1024 * 1024, // 2MB total
        chunkSize: 500 * 1024, // 500KB per chunk
        assetSize: 100 * 1024, // 100KB per asset
      };

      let totalSize = 0;
      const violations: string[] = [];

      for (const [fileName, chunk] of Object.entries(bundle)) {
        const size = (chunk as any).code?.length || (chunk as any).source?.length || 0;
        totalSize += size;

        // Check individual chunk/asset size
        if (fileName.endsWith('.js') && size > budgets.chunkSize) {
          violations.push(`Chunk ${fileName} exceeds budget: ${(size / 1024).toFixed(1)}KB > ${budgets.chunkSize / 1024}KB`);
        }
        if (!fileName.endsWith('.js') && size > budgets.assetSize) {
          violations.push(`Asset ${fileName} exceeds budget: ${(size / 1024).toFixed(1)}KB > ${budgets.assetSize / 1024}KB`);
        }
      }

      // Check total size
      if (totalSize > budgets.totalSize) {
        violations.push(`Total bundle size exceeds budget: ${(totalSize / 1024 / 1024).toFixed(1)}MB > ${budgets.totalSize / 1024 / 1024}MB`);
      }

      if (violations.length > 0) {
        console.warn('\n⚠️  Performance Budget Violations:');
        violations.forEach(violation => console.warn(`   ${violation}`));
        console.warn('   Consider code splitting or removing unused dependencies\n');
      } else {
        console.log(`✅ Performance budget passed: ${(totalSize / 1024 / 1024).toFixed(1)}MB total`);
      }
    },
  };
};

// https://vite.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      // Enable React optimizations
      babel: {
        plugins: [
          // Remove PropTypes in production
          ...(process.env.NODE_ENV === 'production' ? [['babel-plugin-transform-remove-prop-types', { removeImport: true }]] : []),
          // Optimize React imports
          ['babel-plugin-transform-react-remove-prop-types'],
        ],
      },
    }),
    // Performance budget monitoring
    performanceBudgetPlugin(),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // Better visualization
    }),
    // Enhanced Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      compressionOptions: {
        level: 9, // Maximum compression
      },
    }),
    // Enhanced Brotli compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      compressionOptions: {
        level: 11, // Maximum compression
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw-custom.js',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MemoApp - Personal Knowledge Management',
        short_name: 'MemoApp',
        description: 'A personal knowledge management and learning application with spaced repetition',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@memo-app/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Enhanced chunk splitting strategy
          if (id.includes('node_modules')) {
            // Core React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Routing
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // State management and data fetching
            if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
              return 'query-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            // UI and animations
            if (id.includes('framer-motion') || id.includes('@heroicons') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Charts and data visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }
            // Drag and drop
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Performance and monitoring
            if (id.includes('web-vitals') || id.includes('workbox')) {
              return 'perf-vendor';
            }
            // Other large libraries
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Remaining node_modules
            return 'vendor';
          }
          
          // App chunks based on routes/features
          if (id.includes('/src/components/memos/')) {
            return 'memos-chunk';
          }
          if (id.includes('/src/components/quiz/')) {
            return 'quiz-chunk';
          }
          if (id.includes('/src/components/analytics/')) {
            return 'analytics-chunk';
          }
          if (id.includes('/src/components/auth/')) {
            return 'auth-chunk';
          }
          if (id.includes('/src/services/')) {
            return 'services-chunk';
          }
          
          return undefined;
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (_chunkInfo) => {
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || assetInfo.originalFileNames?.[0] || 'asset';
          const info = fileName.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 800, // Reduced from 1000 for better performance
    // Enhanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets - inline smaller assets
    assetsInlineLimit: 2048, // Reduced from 4096 to reduce bundle size
    // Enable CSS minification
    cssMinify: true,
    // Report compressed size
    reportCompressedSize: true,
    // Enable module preload polyfill
    modulePreload: {
      polyfill: true,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
