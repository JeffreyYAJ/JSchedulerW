import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    // proxy: {
      
    //   '/api': {
    //     target: 'https://tuberless-acrimoniously-marquis.ngrok-free.dev',
    //     changeOrigin: true,
    //     secure: false,
    //   }
    // }
  }

});