import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.FRONTEND_PORT) || 5173,
    strictPort: true,
    host: true,
    /*
    Khi nào cần giữ hmr.host
    Bạn chạy dev trong Docker/VM/WSL2 và truy cập từ máy khác.
    Bạn chạy qua reverse proxy/nginx hoặc domain công khai.
    */
    // hmr: {
    //   protocol: 'ws',
    //   //host: process.env.HMR_HOST || undefined,
    //   port: Number(process.env.FRONTEND_PORT) || 5173,
    // },
    proxy: {
      '/api': {
        target:
          process.env.VITE_API_BASE_URL ||
          (process.env.BACKEND_DOMAIN && process.env.BACKEND_PORT ? `http://${process.env.BACKEND_DOMAIN}:${process.env.BACKEND_PORT}` : 'http://localhost:3000'),
        changeOrigin: true,
      },
    },
  },
})
