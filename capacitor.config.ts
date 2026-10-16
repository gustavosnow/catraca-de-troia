import type { CapacitorConfig } from '@capacitor/cli';

const localAndroidDemo = process.env.CAPACITOR_ANDROID_SCHEME === 'http';

const config: CapacitorConfig = {
  // Identificador provisório: confirmar domínio institucional antes de assinar/publicar.
  appId: 'com.gustavosnow.catracatroia',
  appName: 'Catraca de Troia — Responsáveis',
  webDir: 'dist',
  server: {
    // HTTPS permanece o padrão. HTTP existe somente para o APK local de depuração
    // que conversa com a API acadêmica pelo redirecionamento 10.0.2.2 do emulador.
    androidScheme: localAndroidDemo ? 'http' : 'https',
    cleartext: localAndroidDemo,
  },
};

export default config;
