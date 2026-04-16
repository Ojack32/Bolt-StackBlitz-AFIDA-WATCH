import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        map: resolve(__dirname, 'map.html'),
        geomap: resolve(__dirname, 'geo-map.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        portal: resolve(__dirname, 'portal.html'),
        success: resolve(__dirname, 'success.html')
      }
    }
  }
});
