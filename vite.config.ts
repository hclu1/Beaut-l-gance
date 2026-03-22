import react from '@vitejs/plugin-react-swc'
import { defineConfig, UserConfig } from 'vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig['build'], esbuild: UserConfig['esbuild'], define: UserConfig['define']

  if (mode === 'development') {
    build = {
      minify: false,
    }

    esbuild = {
      jsxDev: true,
    }

    define = {
      'process.env.NODE_ENV': '"development"',
      __DEV__: 'true',
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(pkg.version),
    }
  } else {
    // Configuration pour production
    build = {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    }

    define = {
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(pkg.version),
    }
  }

  return {
    plugins: [react()],
    build,
    esbuild,
    define,
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  }
})