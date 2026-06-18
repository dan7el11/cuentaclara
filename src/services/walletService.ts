import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  increment,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Bet, BetSelection, Wallet } from '../types'
import { combinedOdds, impliedProbability } from '../utils/financialMath'

export function subscribeToWallet(uid: string, cb: (wallet: Wallet | null) => void) {
  return onSnapshot(doc(db, 'wallets', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as Wallet) : null)
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
 * Resuelve una apuesta pendiente. En el MVP esto se dispara manualmente
 * o desde un cron que consulta resultados reales; más adelante conviene
 * moverlo a una Cloud Function para que no dependa del cliente.
 */
export async function resolveBet(betId: string, won: boolean): Promise<void> {
  const betRef = doc(db, 'bets', betId)
  const betSnap = await getDoc(betRef)
  if (!betSnap.exists()) throw new Error('Apuesta no encontrada')
  const bet = betSnap.data() as Bet

  const walletRef = doc(db, 'wallets', bet.uid)
  const payout = won ? bet.potentialPayout : 0
  const netResult = payout - bet.stake

  await updateDoc(betRef, {
    status: won ? 'won' : 'lost',
    resolvedAt: Date.now(),
  })

  await updateDoc(walletRef, {
    balance: increment(payout),
    totalWon: increment(won ? netResult : 0),
    totalLost: increment(won ? 0 : bet.stake),
  })

  const walletSnap = await getDoc(walletRef)
  const balanceAfter = (walletSnap.data() as Wallet).balance

  await addDoc(collection(db, 'transactions'), {
    uid: bet.uid,
    type: won ? 'bet_won' : 'bet_lost',
    amount: won ? payout : 0,
    balanceAfter,
    betId,
    createdAt: Date.now(),
  })
}

export async function getBetHistory(uid: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('uid', '==', uid),
    orderBy('placedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Bet, 'id'>) }))
}
