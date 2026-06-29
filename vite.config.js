import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuration de l'outil qui transforme notre code en site web.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
