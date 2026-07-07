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
- **Notificaciones push (nativo)**: ya está integrado `@capacitor/push-notifications`.
  `enablePush()` detecta la plataforma: en web usa FCM web, en nativo registra el
  dispositivo y guarda el token FCM en `wallets/{uid}.fcmTokens` (mismo array que web),
  así el backend envía igual a ambos. Para que funcione en Android falta **tu** config
  de Firebase:
  1. En Firebase Console, agregá una app **Android** con el package `com.nobetter.app`.
  2. Descargá `google-services.json` y ponelo en `android/app/google-services.json`.
     (El `app/build.gradle` ya aplica el plugin gms sólo si el archivo existe; sin él,
     compila igual pero el push nativo queda inactivo.)
  3. En backend, seguí enviando por token FCM como ya hacés para web.
- **Rutas**: la app usa `BrowserRouter`; dentro del WebView la navegación por enlaces
  funciona. Si en el futuro hiciera falta, se puede pasar a `HashRouter` para recargas
  de rutas profundas.
- **Variables de entorno** (`VITE_GETODDS_URL`, Firebase, etc.) se hornean en el bundle
  al hacer `vite build`; definilas antes del `android:sync`.
- **Publicar**: para la Play Store se genera un **AAB** firmado
  (`./gradlew bundleRelease`) con tu keystore.

## CI (GitHub Actions)

`.github/workflows/android.yml` compila un **APK de debug** en cada push a `main`,
en tags `v*`, o a mano (workflow_dispatch), y lo sube como artefacto
`nobetter-debug-apk`.

Secrets opcionales del repo (Settings → Secrets → Actions):

- `VITE_GETODDS_URL`, `VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY` — se hornean en el
  bundle. Sin ellos, el APK corre en modo demo (mock).
- `GOOGLE_SERVICES_JSON` — el `google-services.json` en **base64**
  (`base64 -w0 google-services.json`). Si está, el CI lo escribe y habilita el push
  nativo en ese build.

El APK de CI es **de debug** (sin firmar para producción). Para la Play Store, firmá
un AAB de release con tu keystore (idealmente en otro workflow con secrets de firma).
