import { Capacitor } from '@capacitor/core'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import type { PushStatus } from './push'

/** ¿Corriendo dentro de la app nativa (Android/iOS) y no en el navegador? */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Push nativo vía @capacitor/push-notifications. Pide permiso, registra el
 * dispositivo en FCM y guarda el token en `wallets/{uid}.fcmTokens` — el mismo
 * array que usa el push web, así el backend envía igual a web y a nativo.
 *
 * Requiere que el proyecto Android tenga configurado Firebase
 * (google-services.json + plugin gms). Ver ANDROID.md.
 */
export async function enableNativePush(uid: string): Promise<PushStatus> {
  const { PushNotifications } = await import('@capacitor/push-notifications')

  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') return 'denied'

  // El token llega de forma asíncrona por el listener 'registration'.
  await PushNotifications.addListener('registration', async (token) => {
    try {
      await updateDoc(doc(db, 'wallets', uid), { fcmTokens: arrayUnion(token.value) })
    } catch {
      /* la billetera todavía no existe: se reintenta al reactivar */
    }
  })
  await PushNotifications.addListener('registrationError', () => {
    /* sin Firebase configurado en el proyecto nativo el registro falla */
  })

  await PushNotifications.register()
  return 'granted'
}
