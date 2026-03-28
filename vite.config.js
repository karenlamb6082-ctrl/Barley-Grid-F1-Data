import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理 F1 官方 LiveTiming 静态数据，绕过 CORS
      '/f1timing': {
        target: 'https://livetiming.formula1.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/f1timing/, '/static'),
      },
    },
  },
})
