import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identificador provisório: confirmar domínio institucional antes de assinar/publicar.
  appId: 'com.gustavosnow.catracatroia',
  appName: 'Catraca de Tróia — Responsáveis',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
