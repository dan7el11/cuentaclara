# NoBetter

MVP del proyecto: simulador de apuestas con dinero ficticio y cuotas reales,
pensado para mostrar las consecuencias financieras reales de apostar, no
para entrenar el hábito. La marca pública es **NoBetter** (el repo conserva
el nombre `cuentaclara` por compatibilidad).

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # completá tus claves de Firebase
npm run dev
```

Sin `VITE_APIFOOTBALL_KEY`, la pestaña "Apuestas" usa dos partidos de
ejemplo (mock) para que puedas probar todo el flujo sin gastar cuota real
de la API. Cuando tengas la clave, las cuotas pasan a ser las reales de
API-Football automáticamente.

## Qué necesitás configurar en Firebase

1. Crear un proyecto en Firebase y habilitar **Authentication** (método
   Email/Contraseña) y **Firestore**.
2. Reglas de seguridad mínimas de Firestore (ajustalas, esto es solo el
   punto de partida — cada usuario solo puede leer/escribir lo suyo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wallets/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /cards/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /bets/{betId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null; // restringir más en producción
    }
    match /transactions/{txId} {
      allow read, create: if request.auth != null;
    }
  }
}
```

## Decisión de diseño: la tarjeta ficticia

La tarjeta (`VirtualCard.tsx`) es **decorativa**: aparece en el perfil y en
el extracto, pero el login es siempre email/contraseña. Deliberadamente no
se usa el número/vencimiento de la tarjeta como credencial — ese patrón
(ingresar número + CVV para "entrar") es exactamente la interacción que
usan las páginas de phishing de tarjetas reales, y no tiene sentido
entrenar ese hábito en usuarios que ya están en una situación financiera
delicada. Si más adelante querés una capa extra de inmersión, una opción
más segura es un código QR o un PIN corto asociado a la tarjeta, nunca el
número completo.

## Qué es real y qué es mock en este MVP

- **Real**: registro/login con Firebase, billetera persistente en
  Firestore, cálculo de probabilidad implícita, costo de oportunidad,
  tasa de acierto histórica, las tres capas de recordatorios (barra
  persistente, chequeo previo, modal post-resultado) y la intervención por
  umbral de deuda.
- **Simulado a propósito**: la resolución de apuestas la dispara el propio
  usuario con un botón ("simular que ganó/perdió"), para poder probar el
  flujo completo sin esperar a que termine un partido real.

## Desplegar las Cloud Functions (cuotas + resolución automática)

```bash
npm install -g firebase-tools     # si no la tenés
firebase login
# Reemplazá el project id en .firebaserc por el real
firebase functions:secrets:set APIFOOTBALL_KEY   # te va a pedir el valor
cd functions && npm install && cd ..
firebase deploy --only functions
```

Una vez desplegada, copiá la URL que te muestra la consola para `getOdds`
y pegala en `.env.local` como `VITE_GETODDS_URL`. A partir de ahí el
cliente deja de usar los fixtures de ejemplo y empieza a pedir cuotas
reales sin que la clave de API-Football quede expuesta en el navegador.

`resolveBets` corre sola cada 30 minutos (no hace falta tocar nada) y
`monthlyStatement` corre el día 1 de cada mes y guarda un resumen en la
colección `statements` — el envío por email todavía es un TODO marcado en
el código, porque no hay ningún proveedor de email conectado.

## Qué es real, qué es mock y qué es TODO en este MVP

- **Real**: registro/login con Firebase, billetera persistente en
  Firestore, cálculo de probabilidad implícita, costo de oportunidad,
  tasa de acierto histórica, las tres capas de recordatorios (barra
  persistente, chequeo previo, modal post-resultado), la intervención por
  umbral de deuda, y — una vez desplegadas las Functions — la resolución
  automática de apuestas y la generación del estado de cuenta mensual.
- **Simulado a propósito**: los dos fixtures de ejemplo (`mock-1`,
  `mock-2`) que aparecen si no configurás `VITE_GETODDS_URL`, y el botón
  "simular que ganó/perdió" en la pantalla de Apuestas — sirven para
  probar la interfaz sin depender de partidos reales.
- **TODO marcado explícitamente en el código**: el envío de email del
  estado de cuenta mensual (`monthlyStatement` en `functions/src/index.ts`,
  campo `emailSent: false`). Hay que elegir un proveedor (Resend, SendGrid,
  etc.) y conectarlo.

## Roadmap sugerido (próximas fases)

1. ~~Resolución automática de apuestas~~ — hecho en `functions/resolveBets`.
2. ~~Sacar la clave de API-Football del cliente~~ — hecho en `functions/getOdds`.
3. **Conectar el envío de email** del estado de cuenta mensual.
4. **Modo en vivo**: si lo sumás, atalo a una versión más frecuente del
   chequeo previo a apostar (Capa 2), no lo dejes exento de los
   recordatorios solo porque es más rápido de jugar.
5. **Encuesta de seguimiento** (`Apoyo.tsx`): conectar a un formulario real
   con almacenamiento separado y anonimizable.
6. **Curaduría de contenido** de la sección de apoyo: artículos, enlaces a
   grupos de ayuda verificados, testimonios.
7. **Code-splitting**: el bundle del cliente pesa ~640 KB sin comprimir,
   sobre todo por el SDK de Firebase completo — antes de publicar conviene
   revisar imports y dividir en chunks.

