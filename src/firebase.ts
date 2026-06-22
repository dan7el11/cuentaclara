import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

// Todas las claves vienen de variables de entorno (.env.local) — nunca
// se hardcodean. Ver .env.example para la lista completa de variables
// que necesita este proyecto.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// La config del cliente NO es secreta: se pasa al service worker por la URL
// para que pueda inicializar Firebase Messaging en segundo plano.
export const firebaseConfigForSW = firebaseConfig

// Messaging solo existe en navegadores compatibles (no en SSR ni en algunos
// navegadores). Lo cargamos perezosamente y devolvemos null si no se soporta.
let messaging: Messaging | null = null
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (messaging) return messaging
  if (typeof window === 'undefined' || !(await isSupported())) return null
  messaging = getMessaging(app)
  return messaging
}
