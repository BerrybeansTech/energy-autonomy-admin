import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import fs from 'fs'

const frontendDir = fs.existsSync(path.resolve(__dirname, '../Energy-Autonomy/src'))
  ? path.resolve(__dirname, '../Energy-Autonomy/src')
  : path.resolve(__dirname, '../Energy-Autonomy-Frontend/src')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@frontend': frontendDir,
    },
  },
})
