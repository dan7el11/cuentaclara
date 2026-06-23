// Función PROGRAMADA de Netlify: cada 15 minutos resuelve las apuestas
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

type LegResult = 'won' | 'lost' | 'void'
interface FixtureScore {
  homeScore: number
  awayScore: number
}

function initAdmin() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT en Netlify.')
    initializeApp({ credential: cert(JSON.parse(raw)) })
  }
  return getFirestore()
}

/** Marcador final (h/a) de un partido terminado, o null si aún no aplica. */
function scoresFromGame(game: any): FixtureScore | null {
  if (!game?.completed || !Array.isArray(game.scores)) return null
  const home = game.scores.find((s: any) => s.name === game.home_team)
  const away = game.scores.find((s: any) => s.name === game.away_team)
  if (!home || !away) return null
  const hs = Number(home.score)
  const as = Number(away.score)
  if (Number.isNaN(hs) || Number.isNaN(as)) return null
  return { homeScore: hs, awayScore: as }
}

// Liquidación por mercado (replica de src/utils/settlement.ts).
function settleSelection(marketKey: string, code: string, point: number | undefined, h: number, a: number): LegResult {
  const total = h + a
  switch (marketKey) {
    case 'h2h': {
      const winner = h > a ? 'home' : a > h ? 'away' : 'draw'
      return code === winner ? 'won' : 'lost'
    }
    case 'double_chance':
      if (code === '1X') return h >= a ? 'won' : 'lost'
      if (code === '12') return h !== a ? 'won' : 'lost'
      if (code === 'X2') return a >= h ? 'won' : 'lost'
      return 'lost'
    case 'totals':
      if (point == null) return 'lost'
      if (total === point) return 'void'
      if (code === 'over') return total > point ? 'won' : 'lost'
      return total < point ? 'won' : 'lost'
    case 'btts': {
      const both = h > 0 && a > 0
      return code === 'yes' ? (both ? 'won' : 'lost') : both ? 'lost' : 'won'
    }
    case 'spreads': {
      if (point == null) return 'lost'
      const adjusted = (code === 'home' ? h : a) + point
      const other = code === 'home' ? a : h
      if (adjusted === other) return 'void'
      return adjusted > other ? 'won' : 'lost'
    }
    default:
      return 'lost'
  }
}

function settleBetLegs(legs: any[], scores: Map<string, FixtureScore>): LegResult | null {
  const results: LegResult[] = []
  for (const leg of legs) {
    const s = scores.get(leg.fixtureId)
    if (!s) return null
    const marketKey = leg.marketKey ?? 'h2h' // apuestas viejas eran 1X2
    const code = leg.selectionCode ?? leg.outcomeCode ?? ''
    results.push(settleSelection(marketKey, code, leg.point, s.homeScore, s.awayScore))
  }
  if (results.length === 0) return null
  if (results.some((r) => r === 'lost')) return 'lost'
  if (results.every((r) => r === 'won')) return 'won'
  return 'void'
}

const money = (n: number) => n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })

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

  // Marcador real por fixtureId.
  const scores = new Map<string, FixtureScore>()
  for (const sport of sports) {
    try {
      const res = await fetch(`${BASE_URL}/sports/${sport}/scores/?apiKey=${key}&daysFrom=3`)
      if (!res.ok) continue
      const games: any[] = await res.json()
      for (const g of games) {
        const s = scoresFromGame(g)
        if (s) scores.set(String(g.id), s)
      }
    } catch {
      // Si una competición falla, seguimos; sus apuestas quedan pendientes.
    }
  }

  let settled = 0
  for (const betDoc of pendingSnap.docs) {
    const bet = betDoc.data() as any
    const result = settleBetLegs(bet.selections ?? [], scores)
    if (!result) continue
    const did = await settleBet(db, betDoc.id, bet, result)
    if (did) {
      settled++
      await notify(db, bet.uid, result, bet)
    }
  }

  return new Response(`Resueltas ${settled} apuesta(s).`)
}

/**
 * Liquida una apuesta de forma idempotente (won/lost/void). "void" devuelve
 * lo apostado. Comprueba dentro de la transacción que siga pendiente, para no
 * pagar dos veces aunque el cliente también la resuelva.
 */
async function settleBet(db: any, betId: string, bet: any, result: LegResult): Promise<boolean> {
  const betRef = db.collection('bets').doc(betId)
  const walletRef = db.collection('wallets').doc(bet.uid)

  const applied = await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(betRef)
    if (!snap.exists || snap.data().status !== 'pending') return false
    const payout = result === 'won' ? bet.potentialPayout : result === 'void' ? bet.stake : 0
    const netResult = bet.potentialPayout - bet.stake
    tx.update(betRef, { status: result, resolvedAt: Date.now() })
    tx.update(walletRef, {
      balance: FieldValue.increment(payout),
      totalWon: FieldValue.increment(result === 'won' ? netResult : 0),
      totalLost: FieldValue.increment(result === 'lost' ? bet.stake : 0),
    })
    return true
  })

  if (applied) {
    const walletSnap = await walletRef.get()
    const payout = result === 'won' ? bet.potentialPayout : result === 'void' ? bet.stake : 0
    await db.collection('transactions').add({
      uid: bet.uid,
      type: result === 'won' ? 'bet_won' : result === 'void' ? 'bet_void' : 'bet_lost',
      amount: payout,
      balanceAfter: walletSnap.data()?.balance ?? 0,
      betId,
      createdAt: Date.now(),
    })
  }
  return applied
}

/** Envía la push a todos los dispositivos registrados del usuario. */
async function notify(db: any, uid: string, result: LegResult, bet: any) {
  const walletSnap = await db.collection('wallets').doc(uid).get()
  const tokens: string[] = walletSnap.data()?.fcmTokens ?? []
  if (tokens.length === 0) return

  let title: string
  let body: string
  if (result === 'won') {
    title = 'Ganaste tu apuesta ficticia'
    body = `Cobraste ${money(bet.potentialPayout)} ficticios. La cuota ya descontaba lo improbable que era.`
  } else if (result === 'void') {
    title = 'Tu apuesta ficticia fue anulada'
    body = `Se devolvieron ${money(bet.stake)} ficticios (empate contra la línea).`
  } else {
    title = 'Perdiste tu apuesta ficticia'
    body = `Perdiste ${money(bet.stake)} ficticios. Mirá cuánto llevás perdido en tu historial.`
  }

  try {
    const resp = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link: '/apuestas' } },
    })
    const invalid: string[] = []
    resp.responses.forEach((r, i) => {
      if (!r.success) invalid.push(tokens[i])
    })
    if (invalid.length) {
      await db.collection('wallets').doc(uid).update({ fcmTokens: FieldValue.arrayRemove(...invalid) })
    }
  } catch {
    // La resolución ya quedó hecha; un fallo de push no la revierte.
  }
}

// Netlify ejecuta esta función cada 15 minutos. No pasa nada por correr
// seguido: si no hay apuestas pendientes, no llama a The Odds API y no
// consume cuota (solo una lectura barata de Firestore).
export const config = { schedule: '*/15 * * * *' }
