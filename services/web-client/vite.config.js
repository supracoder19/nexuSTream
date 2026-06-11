
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    port: process.env.PORT||9060,
    strictPort: true,     // Force Vite to fail if 4000 is taken (avoids port hopping)
    watch: {
      usePolling: process.env.USEPOLLING,   // You've clearly got this working already!
      interval: 1000
    },
    allowedHosts: process.env.ALLOWED_HOSTS 
      ? process.env.ALLOWED_HOSTS.split(',') 
      : ['localhost'],
    hmr:{
      clientPort: 8081
    }
  },
})