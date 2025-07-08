import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // base: '/VdtdpAttendance/', // 👈 use your repo name here
  plugins: [react()],
  base: '/VdtdpAttendance/', // ✅ very important for GitHub Pages
  build: {
        chunkSizeWarningLimit: 2000 // or higher
  }

});
