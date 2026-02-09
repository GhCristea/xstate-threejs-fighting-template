import { defineConfig } from 'vite'

export default defineConfig({ publicDir: 'static', server: { port: 5173, strictPort: true, hmr: { port: 5173 } } })
