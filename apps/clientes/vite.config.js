import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Mantiene los bundles separados para que el cliente no descargue
    // código de socios/Excel antes de necesitarlo.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/xlsx/')) return 'xlsx';
          if (id.includes('/@supabase/') || id.includes('/@supabase\\')) return 'supabase';
          if (id.includes('/@mui/icons-material/') || id.includes('/@mui\\icons-material\\')) return 'mui-icons';
          if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui-core';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react-vendor';
        }
      }
    }
  }
});
