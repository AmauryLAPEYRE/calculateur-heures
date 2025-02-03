import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.xlsx'],
  server: {
    fs: {
      // Permettre l'accès aux fichiers en dehors du répertoire racine
      allow: ['..'],
    },
  },
  build: {
    // Configuration pour gérer les fichiers Excel dans le build
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  // Résolution des chemins
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
