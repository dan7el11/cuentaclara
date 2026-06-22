// Función PROGRAMADA de Netlify: cada 30 minutos resuelve las apuestas
// pendientes contra los resultados reales (The Odds API /scores) y envía
// una notificación push (FCM) al usuario cuando gana o pierde.
//
// Corre en el servidor, así que la push llega aunque la app esté cerrada.
//
// Requiere dos variables de entorno en Netlify:
//   ODDS_API_KEY            -> la misma clave de The Odds API
//   FIREBASE_SERVICE_ACCOUNT-> JSON de la cuenta de servicio de Firebase
//                              (Project settings > Service accounts > Generate
//                              new private key). Pegá el JSON completo.

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

const BASE_URL = 'https://api.the-odds-api.com/v4'

type Outcome = 'home' | 'draw' | 'away'

function initAdmin() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT en Netlify.')
    initializeApp({ credential: cert(JSON.parse(raw)) })
  }
  return getFirestore()
}

/** Resultado (home/draw/away) a partir del marcador de un partido terminado. */
function outcomeFromGame(game: any): Outcome | null {
  if (!game?.completed || !Array.isArray(game.scores)) return null
  const home = game.scores.find((s: any) => s.name === game.home_team)
  const away = game.scores.find((s: any) => s.name === game.away_team)
  if (!home || !away) return null
  const hs = Number(home.score)
  const as = Number(away.score)
  if (Number.isNaN(hs) || Number.isNaN(as)) return null
  return hs > as ? 'home' : as > hs ? 'away' : 'draw'
}

const money = (n: number) =>
  n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })

export default async () => {
  const key = process.env.ODDS_API_KEY
  if (!key) return new Response('Falta ODDS_API_KEY', { status: 500 })

  const db = initAdmin()

  // Para cuidar la cuota de The Odds API (500/mes), primero consultamos
  // Firestore (lecturas baratas) y SOLO llamamos a la API de resultados si
  // de verdad hay apuestas pendientes. Si no hay, salimos sin gastar nada.
  const pendingSnap = await db.collection('bets').where('status', '==', 'pending').limit(300).get()
  if (pendingSnap.empty) return new Response('Sin apuestas pendientes')

  // Competiciones involucradas (las mock no tienen `sport`: se ignoran acá).
  const sports = new Set<string>()
  pendingSnap.forEach((doc) => {
    const selections = (doc.data().selections ?? []) as { sport?: string }[]
    selections.forEach((s) => s.sport && sports.add(s.sport))
  })

  // Resultado real por fixtureId.
  const outcomeByFixture = new Map<string, Outcome>()
  for (const sport of sports) {
    try {
      const res = await fetch(`${BASE_URL}/sports/${sport}/scores/?apiKey=${key}&daysFrom=3`)
      if (!res.ok) continue
      const games: any[] = await res.json()
      for (const g of games) {
        const o = outcomeFromGame(g)
        if (o) outcomeByFixture.set(String(g.id), o)
      }
    } catch {
      // Si una competición falla, seguimos; sus apuestas quedan pendientes.
    }
  }

  let settled = 0
  for (const betDoc of pendingSnap.docs) {
    const bet = betDoc.data() as any
    const selections = (bet.selections ?? []) as { fixtureId: string; outcomeCode: Outcome }[]
    const outcomes = selections.map((s) => outcomeByFixture.get(s.fixtureId))
    if (outcomes.length === 0 || outcomes.some((o) => o === undefined)) continue

    const won = selections.every((s, i) => outcomes[i] === s.outcomeCode)
    const did = await settleBet(db, betDoc.id, bet, won)
    if (did) {
      settled++
      await notify(db, bet.uid, won, bet)
    }
  }

  return new Response(`Resueltas ${settled} apuesta(s).`)
}

/**
 * Liquida una apuesta de forma idempotente: dentro de una transacción
 * comprueba que siga pendiente antes de tocar el saldo, para que no se pague
 * dos veces aunque el cliente también la haya resuelto.
 */
async function settleBet(db: any, betId: string, bet: any, won: boolean): Promise<boolean> {
  const betRef = db.collection('bets').doc(betId)
  const walletRef = db.collection('wallets').doc(bet.uid)

  const applied = await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(betRef)
    if (!snap.exists || snap.data().status !== 'pending') return false
    const payout = won ? bet.potentialPayout : 0
    const netResult = payout - bet.stake
    tx.update(betRef, { status: won ? 'won' : 'lost', resolvedAt: Date.now() })
    tx.update(walletRef, {
      balance: FieldValue.increment(payout),
      totalWon: FieldValue.increment(won ? netResult : 0),
      totalLost: FieldValue.increment(won ? 0 : bet.stake),
    })
    return true
  })

  if (applied) {
    const walletSnap = await walletRef.get()
    await db.collection('transactions').add({
      uid: bet.uid,
      type: won ? 'bet_won' : 'bet_lost',
      amount: won ? bet.potentialPayout : 0,
      balanceAfter: walletSnap.data()?.balance ?? 0,
      betId,
      createdAt: Date.now(),
    })
  }
  return applied
}

/** Envía la push a todos los dispositivos registrados del usuario. */
async function notify(db: any, uid: string, won: boolean, bet: any) {
  const walletSnap = await db.collection('wallets').doc(uid).get()
  const tokens: string[] = walletSnap.data()?.fcmTokens ?? []
  if (tokens.length === 0) return

  const title = won ? 'Ganaste tu apuesta ficticia' : 'Perdiste tu apuesta ficticia'
  const body = won
    ? `Cobraste ${money(bet.potentialPayout)} ficticios. La cuota ya descontaba lo improbable que era.`
    : `Perdiste ${money(bet.stake)} ficticios. Mirá cuánto llevás perdido en tu historial.`

  try {
    const resp = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link: '/apuestas' } },
    })
    // Limpiar tokens inválidos para no acumular basura.
    const invalid: string[] = []
    resp.responses.forEach((r, i) => {
      if (!r.success) invalid.push(tokens[i])
    })
    if (invalid.length) {
      await db
        .collection('wallets')
        .doc(uid)
        .update({ fcmTokens: FieldValue.arrayRemove(...invalid) })
    }
  } catch {
    // La resolución ya quedó hecha; un fallo de push no la revierte.
  }
}

// Netlify ejecuta esta función cada 15 minutos. No pasa nada por correr
// seguido: si no hay apuestas pendientes, no llama a The Odds API y no
// consume cuota (solo una lectura barata de Firestore).
export const config = { schedule: '*/15 * * * *' }
