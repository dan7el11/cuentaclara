import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, firebaseConfigForSW, getMessagingIfSupported } from '../firebase'
import { isNativePlatform, enableNativePush } from './nativePush'

// Clave VAPID del par de claves Web Push de Firebase
// (Project settings > Cloud Messaging > Web configuration > Generate key pair).
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export type PushStatus = 'granted' | 'denied' | 'unsupported'

/** URL del service worker con la config de Firebase incrustada como query. */
function swUrl(): string {
  const c = firebaseConfigForSW
  const params = new URLSearchParams({
    apiKey: c.apiKey ?? '',
    authDomain: c.authDomain ?? '',
    projectId: c.projectId ?? '',
    messagingSenderId: c.messagingSenderId ?? '',
    appId: c.appId ?? '',
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

/**
 * Pide permiso de notificaciones, registra el service worker, obtiene el
 * token FCM del dispositivo y lo guarda en la billetera del usuario para que
 * el backend pueda enviarle push al resolver una apuesta.
 */
export async function enablePush(uid: string): Promise<PushStatus> {
  // En la app nativa (Android/iOS) usamos el push de Capacitor, no el web.
  if (isNativePlatform()) return enableNativePush(uid)

  const messaging = await getMessagingIfSupported()
  if (!messaging || !VAPID_KEY || !('serviceWorker' in navigator)) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const registration = await navigator.serviceWorker.register(swUrl())
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (token) {
    await updateDoc(doc(db, 'wallets', uid), { fcmTokens: arrayUnion(token) })
  }
  return 'granted'
}

/** ¿El navegador ya tiene concedido el permiso de notificaciones? */
export function pushAlreadyGranted(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/**
 * Muestra las notificaciones que llegan con la app EN PRIMER PLANO (FCM no
 * las muestra solo en ese caso). Devuelve la función para dejar de escuchar.
 */
export async function listenForegroundPush(): Promise<() => void> {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    const n = payload.notification
    // Guarda: en algunos WebViews la API Notification no existe.
    if (n && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(n.title ?? 'NoBetter', { body: n.body })
    }
  })
}
