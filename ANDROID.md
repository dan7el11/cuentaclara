# NoBetter — versión Android (Capacitor)

La app Android envuelve la misma app web (Vite/React) en un WebView nativo con
[Capacitor](https://capacitorjs.com). No hay código duplicado: se compila la web
y Capacitor la empaqueta en un APK/AAB.

## Requisitos (en tu máquina, no en este repo)

- Node 18+ (ya lo usás para la web).
- **JDK 17**.
- **Android Studio** (incluye Android SDK + Gradle). Definí `ANDROID_HOME`.

## Estructura

- `capacitor.config.ts` — appId `com.nobetter.app`, appName `NoBetter`, `webDir: dist`.
- `android/` — proyecto Gradle nativo (generado con `npx cap add android`). Se versiona.
  Los assets web copiados (`android/app/src/main/assets/public/`) **no** se versionan:
  se regeneran con `cap sync`.

## Flujo

```bash
# 1. Compilar la web y copiarla al proyecto Android
npm run android:sync        # = vite build && cap sync android

# 2a. Abrir en Android Studio (recomendado para firmar/emular)
npm run android:open

# 2b. …o generar un APK de debug por línea de comandos
npm run android:apk         # genera android/app/build/outputs/apk/debug/app-debug.apk
```

## Notas

- **Íconos de launcher**: hoy usa los de Capacitor por defecto. Para poner el sello
  NoBetter, agregá un PNG fuente y corré `@capacitor/assets`
  (`npx @capacitor/assets generate --android`).
- **Notificaciones push**: la web usa Firebase Cloud Messaging para web; en nativo hay
  que sumar `@capacitor/push-notifications` (o el plugin de FCM) y configurar
  `google-services.json`. Pendiente.
- **Rutas**: la app usa `BrowserRouter`; dentro del WebView la navegación por enlaces
  funciona. Si en el futuro hiciera falta, se puede pasar a `HashRouter` para recargas
  de rutas profundas.
- **Variables de entorno** (`VITE_GETODDS_URL`, Firebase, etc.) se hornean en el bundle
  al hacer `vite build`; definilas antes del `android:sync`.
- **Publicar**: para la Play Store se genera un **AAB** firmado
  (`./gradlew bundleRelease`) con tu keystore.
