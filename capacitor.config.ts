import type { CapacitorConfig } from '@capacitor/cli'

// Envuelve la app web (Vite) en un proyecto Android nativo. El build web va a
// `dist/` y Capacitor lo empaqueta dentro del APK/AAB.
const config: CapacitorConfig = {
  appId: 'com.nobetter.app',
  appName: 'NoBetter',
  webDir: 'dist',
  backgroundColor: '#0c0d17', // coincide con el tema oscuro por defecto
  android: {
    // Permite el splash sobrio mientras carga el bundle.
    backgroundColor: '#0c0d17',
  },
}

export default config
