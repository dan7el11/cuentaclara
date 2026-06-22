import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  increment,
  onSnapshot,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Bet, BetSelection, Transaction, Wallet } from '../types'
import { combinedOdds, impliedProbability } from '../utils/financialMath'
import { fetchScores } from './oddsApi'

export function subscribeToWallet(
  uid: string,
  cb: (wallet: Wallet | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, 'wallets', uid),
    (snap) => cb(snap.exists() ? (snap.data() as Wallet) : null),
    (error) => onError?.(error)
  )
}

/**
 * Crea la billetera ficticia del usuario si todavía no existe. Sirve para
 * cuentas viejas (creadas antes de tener billetera) o si el documento se
 * perdió: deja a la persona operar sin quedarse en "Cargando…".
 */
export async function ensureWallet(
  uid: string,
  startingBalance = 100,
  debtThreshold = 50
): Promise<void> {
  const ref = doc(db, 'wallets', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    uid,
    balance: startingBalance,
    totalStaked: 0,
    totalLost: 0,
    totalWon: 0,
    debtThreshold: -Math.abs(debtThreshold),
    createdAt: Date.now(),
  })
}

/**
 * Registra una apuesta y descuenta el monto del saldo ficticio.
 * Lanza un error si el monto supera el saldo disponible — igual que un
 * sitio real, pero acá la consecuencia de fondo es educativa, no comercial.
 */
export async function placeBet(
  uid: string,
  selections: BetSelection[],
  stake: number
): Promise<string> {
  const walletRef = doc(db, 'wallets', uid)
  const walletSnap = await getDoc(walletRef)
  if (!walletSnap.exists()) throw new Error('Billetera no encontrada')
  const wallet = walletSnap.data() as Wallet

  if (stake <= 0) throw new Error('El monto debe ser mayor a cero')
  if (stake > wallet.balance) throw new Error('Saldo ficticio insuficiente')

  const odds = combinedOdds(selections)
  const bet: Omit<Bet, 'id'> = {
    uid,
    selections,
    stake,
    combinedOdds: odds,
    impliedProbability: impliedProbability(odds),
    potentialPayout: Math.round(stake * odds * 100) / 100,
    status: 'pending',
    placedAt: Date.now(),
  }

  const betDoc = await addDoc(collection(db, 'bets'), bet)

  await updateDoc(walletRef, {
    balance: increment(-stake),
    totalStaked: increment(stake),
  })

  await addDoc(collection(db, 'transactions'), {
    uid,
    type: 'bet_placed',
    amount: -stake,
    balanceAfter: wallet.balance - stake,
    betId: betDoc.id,
    createdAt: Date.now(),
  })

  return betDoc.id
}

/**
 * Resuelve una apuesta pendiente. Es IDEMPOTENTE: dentro de una transacción
 * comprueba que la apuesta siga `pending` antes de tocar el saldo, así nunca
 * se paga dos veces aunque el cron del servidor la resuelva al mismo tiempo.
 */
export async function resolveBet(betId: string, won: boolean): Promise<void> {
  const betRef = doc(db, 'bets', betId)

  const applied = await runTransaction(db, async (tx) => {
    const betSnap = await tx.get(betRef)
    if (!betSnap.exists()) throw new Error('Apuesta no encontrada')
    const bet = betSnap.data() as Bet
    if (bet.status !== 'pending') return null // ya resuelta (p. ej. por el cron)

    const walletRef = doc(db, 'wallets', bet.uid)
    const payout = won ? bet.potentialPayout : 0
    const netResult = payout - bet.stake

    tx.update(betRef, { status: won ? 'won' : 'lost', resolvedAt: Date.now() })
    tx.update(walletRef, {
      balance: increment(payout),
      totalWon: increment(won ? netResult : 0),
      totalLost: increment(won ? 0 : bet.stake),
    })
    return { uid: bet.uid, payout }
  })

  if (!applied) return

  const walletSnap = await getDoc(doc(db, 'wallets', applied.uid))
  const balanceAfter = (walletSnap.data() as Wallet).balance

  await addDoc(collection(db, 'transactions'), {
    uid: applied.uid,
    type: won ? 'bet_won' : 'bet_lost',
    amount: won ? applied.payout : 0,
    balanceAfter,
    betId,
    createdAt: Date.now(),
  })
}

/**
 * Resuelve automáticamente las apuestas pendientes contra los resultados
 * REALES de los partidos (endpoint /scores). Una combinada gana solo si
 * TODAS sus selecciones aciertan; si a alguna selección todavía le falta el
 * resultado, la apuesta queda pendiente. Devuelve los ids resueltos en esta
 * pasada (para poder mostrar el análisis al usuario).
 */
export async function resolvePendingBets(uid: string): Promise<string[]> {
  const bets = await getBetHistory(uid)
  const pending = bets.filter((b) => b.status === 'pending')
  if (pending.length === 0) return []

  // Solo apuestas con resultado real consultable (tienen `sport`; las de
  // ejemplo/mock no, y se resuelven a mano desde la pantalla de apuestas).
  const sports = [
    ...new Set(
      pending.flatMap((b) => b.selections.map((s) => s.sport)).filter((s): s is string => !!s)
    ),
  ]
  if (sports.length === 0) return []

  const outcomeByFixture = new Map<string, BetSelection['outcomeCode']>()
  for (const sport of sports) {
    try {
      const results = await fetchScores(sport)
      for (const r of results) outcomeByFixture.set(r.fixtureId, r.outcome)
    } catch {
      // Si una competición falla, seguimos con las demás; sus apuestas
      // simplemente quedan pendientes hasta la próxima pasada.
    }
  }

  const resolvedIds: string[] = []
  for (const bet of pending) {
    const outcomes = bet.selections.map((s) => outcomeByFixture.get(s.fixtureId))
    if (outcomes.some((o) => o === undefined)) continue // falta algún resultado
    const won = bet.selections.every((s, i) => outcomes[i] === s.outcomeCode)
    await resolveBet(bet.id, won)
    resolvedIds.push(bet.id)
  }
  return resolvedIds
}

export async function getBetHistory(uid: string): Promise<Bet[]> {
  // Filtramos solo por uid (índice automático de un solo campo) y ordenamos
  // en el cliente. Así no exigimos un índice compuesto de Firestore, que de
  // otro modo haría fallar esta consulta en producción.
  const q = query(collection(db, 'bets'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Bet, 'id'>) }))
    .sort((a, b) => b.placedAt - a.placedAt)
}

/** Movimientos recientes de la cuenta (recargas, apuestas, pagos). */
export async function getRecentTransactions(uid: string, max = 8): Promise<Transaction[]> {
  const q = query(collection(db, 'transactions'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, max)
}

/**
 * Recarga el saldo ficticio. Lo registramos como un movimiento más
 * (`deposit_sim`) para que el extracto sea honesto: en una casa real, este
 * es justo el momento en que alguien que ya iba perdiendo "vuelve a cargar".
 */
export async function deposit(uid: string, amount: number): Promise<void> {
  if (!(amount > 0)) throw new Error('El monto debe ser mayor a cero')
  const walletRef = doc(db, 'wallets', uid)

  const balanceAfter = await runTransaction(db, async (tx) => {
    const snap = await tx.get(walletRef)
    if (!snap.exists()) throw new Error('Billetera no encontrada')
    const w = snap.data() as Wallet
    tx.update(walletRef, { balance: increment(amount) })
    return w.balance + amount
  })

  await addDoc(collection(db, 'transactions'), {
    uid,
    type: 'deposit_sim',
    amount,
    balanceAfter,
    createdAt: Date.now(),
  })
}
