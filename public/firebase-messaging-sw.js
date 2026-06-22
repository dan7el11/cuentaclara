/* Service worker de Firebase Cloud Messaging.
 *
 * Maneja las notificaciones push cuando la app está cerrada o en segundo
 * plano. La config de Firebase (que NO es secreta) llega como parámetros de
 * la URL con la que se registra este worker (ver src/services/push.ts).
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

const params = new URL(self.location).searchParams

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  self.registration.showNotification(notification.title || 'CuentaClara', {
    body: notification.body || '',
    icon: '/icon.png',
    data: { link: (payload.fcmOptions && payload.fcmOptions.link) || '/apuestas' },
  })
})

// Al tocar la notificación, abrir (o enfocar) la app en la pantalla indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || '/apuestas'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(link)
    })
  )
})
