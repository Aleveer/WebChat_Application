import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const DEFAULT_API_BASE = 'http://webchat-app-dev-alb-783296763.ap-southeast-2.elb.amazonaws.com/api'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: DEFAULT_API_BASE,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
