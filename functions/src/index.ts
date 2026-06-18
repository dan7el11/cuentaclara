import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import * as logger from 'firebase-functions/logger'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { estimateOpportunityCost } from './financialMath.js'

initializeApp()
const db = getFirestore()

const apiFootballKey = defineSecret('APIFOOTBALL_KEY')
const BASE_URL = 'https://v3.football.api-sports.io'

// ---------------------------------------------------------------------
// 1) Proxy de cuotas: la clave de API-Football vive solo acá, nunca en
//    el cliente. El front-end llama a esta URL en vez de a API-Football
//    directamente (ver VITE_GETODDS_URL en el cliente).
// ---------------------------------------------------------------------
export const getOdds = onRequest(
  { secrets: [apiFootballKey], cors: true, region: 'us-central1' },
  async (req, res) => {
    try {
      const league = typeof req.query.league === 'string' ? req.query.league : undefined
      const season = typeof req.query.season === 'string' ? req.query.season : '2026'
      const url = `${BASE_URL}/odds?${league ? `league=${league}&` : ''}season=${season}`

      const apiRes = await fetch(url, {
        headers: { 'x-apisports-key': apiFootballKey.value() },
      })
      if (!apiRes.ok) {
        res.status(apiRes.status).json({ error: `API-Football respondió ${apiRes.status}` })
        return
      }
      const json = (await apiRes.json()) as any

      // Mapeo a la forma que ya espera el cliente (RawFixtureOdds[]).
      // Ajustá este mapeo cuando veas la respuesta real de tu plan de API.
      const fixtures = (json.response ?? []).map((item: any) => {
        const values = item.bookmakers?.[0]?.bets?.[0]?.values ?? []
        const toOutcome = (label: string): 'home' | 'draw' | 'away' | null => {
          const l = String(label).toLowerCase()
          if (l === 'home') return 'home'
          if (l === 'draw') return 'draw'
          if (l === 'away') return 'away'
          return null
        }
        return {
          fixtureId: String(item.fixture?.id ?? ''),
          label: `${item.teams?.home?.name ?? '?'} vs. ${item.teams?.away?.name ?? '?'}`,
          market: '1X2',
          options: values
            .map((v: any) => ({
              pick: v.value,
              decimalOdds: parseFloat(v.odd),
              outcomeCode: toOutcome(v.value),
            }))
            .filter((o: any) => o.outcomeCode !== null),
        }
      })

      res.json(fixtures)
    } catch (err) {
      logger.error('getOdds falló', err)
      res.status(500).json({ error: 'Error al consultar cuotas' })
    }
  }
)

// ---------------------------------------------------------------------
// 2) Resolución automática de apuestas pendientes. Corre cada 30 min,
//    revisa qué fixtures ya terminaron y liquida las apuestas que
//    dependían de ellos. Los fixtures "mock-*" del modo demo no se
//    pueden resolver acá (no existen en API-Football): quedan pendientes
//    a propósito hasta que se resuelvan a mano desde la UI de demo.
// ---------------------------------------------------------------------
export const resolveBets = onSchedule(
  { schedule: 'every 30 minutes', secrets: [apiFootballKey], region: 'us-central1' },
  async () => {
    const pendingSnap = await db.collection('bets').where('status', '==', 'pending').limit(200).get()
    if (pendingSnap.empty) return

    const fixtureIds = new Set<string>()
    pendingSnap.forEach((doc) => {
      const selections = doc.data().selections as { fixtureId: string }[]
      selections.forEach((s) => {
        if (!s.fixtureId.startsWith('mock-')) fixtureIds.add(s.fixtureId)
      })
    })

    const outcomes = new Map<string, 'home' | 'draw' | 'away' | null>() // null = todavía no termina

    for (const fixtureId of fixtureIds) {
      try {
        const res = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
          headers: { 'x-apisports-key': apiFootballKey.value() },
        })
        if (!res.ok) continue
        const json = (await res.json()) as any
        const fixture = json.response?.[0]
        const finished = fixture?.fixture?.status?.short === 'FT'
        if (!finished) {
          outcomes.set(fixtureId, null)
          continue
        }
        if (fixture.teams?.home?.winner === true) outcomes.set(fixtureId, 'home')
        else if (fixture.teams?.away?.winner === true) outcomes.set(fixtureId, 'away')
        else outcomes.set(fixtureId, 'draw')
      } catch (err) {
        logger.error(`No se pudo consultar el fixture ${fixtureId}`, err)
      }
    }

    for (const betDoc of pendingSnap.docs) {
      const bet = betDoc.data() as any
      const allFinished = bet.selections.every((s: any) => outcomes.get(s.fixtureId) !== undefined && outcomes.get(s.fixtureId) !== null)
      if (!allFinished) continue // todavía hay partidos en curso en esta combinada

      const won = bet.selections.every((s: any) => outcomes.get(s.fixtureId) === s.outcomeCode)
      await settleBet(betDoc.id, bet, won)
    }
  }
)

async function settleBet(betId: string, bet: any, won: boolean) {
  const walletRef = db.collection('wallets').doc(bet.uid)
  const payout = won ? bet.potentialPayout : 0
  const netResult = payout - bet.stake

  await db.runTransaction(async (tx) => {
    tx.update(db.collection('bets').doc(betId), {
      status: won ? 'won' : 'lost',
      resolvedAt: Date.now(),
    })
    tx.update(walletRef, {
      balance: FieldValue.increment(payout),
      totalWon: FieldValue.increment(won ? netResult : 0),
      totalLost: FieldValue.increment(won ? 0 : bet.stake),
    })
  })

  const walletSnap = await walletRef.get()
  await db.collection('transactions').add({
    uid: bet.uid,
    type: won ? 'bet_won' : 'bet_lost',
    amount: won ? payout : 0,
    balanceAfter: walletSnap.data()?.balance ?? 0,
    betId,
    createdAt: Date.now(),
  })

  logger.info(`Apuesta ${betId} resuelta automáticamente: ${won ? 'ganada' : 'perdida'}`)
}

// ---------------------------------------------------------------------
// 3) Estado de cuenta mensual. Corre el día 1 de cada mes y guarda un
//    resumen por usuario en `statements/{uid}_{AAAA-MM}`. El envío por
//    email queda como TODO: conectá tu propio proveedor (Resend,
//    SendGrid, etc.) — no hay ninguno configurado todavía, así que esta
//    función por ahora NO manda emails, solo genera el resumen.
// ---------------------------------------------------------------------
export const monthlyStatement = onSchedule(
  { schedule: '0 6 1 * *', region: 'us-central1', timeZone: 'America/Guayaquil' },
  async () => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    const walletsSnap = await db.collection('wallets').get()

    for (const walletDoc of walletsSnap.docs) {
      const uid = walletDoc.id
      const wallet = walletDoc.data() as any

      const txSnap = await db
        .collection('transactions')
        .where('uid', '==', uid)
        .where('createdAt', '>=', monthStart)
        .where('createdAt', '<', monthEnd)
        .get()

      let totalStaked = 0
      let totalWon = 0
      let totalLost = 0
      txSnap.forEach((d) => {
        const tx = d.data() as any
        if (tx.type === 'bet_placed') totalStaked += Math.abs(tx.amount)
        if (tx.type === 'bet_won') totalWon += tx.amount
        if (tx.type === 'bet_lost') totalLost += 0 // ya está contado en bet_placed
      })

      const yearsActive = Math.max((Date.now() - wallet.createdAt) / (1000 * 60 * 60 * 24 * 365), 1)
      const opportunityCost = estimateOpportunityCost(wallet.totalStaked ?? 0, yearsActive)

      await db.doc(`statements/${uid}_${monthKey}`).set({
        uid,
        month: monthKey,
        totalStaked,
        totalWon,
        totalLost,
        netResult: totalWon - totalLost,
        closingBalance: wallet.balance,
        opportunityCost,
        generatedAt: Date.now(),
        emailSent: false, // TODO: poné true cuando conectes un proveedor de email real
      })
    }

    logger.info(`Estados de cuenta de ${monthKey} generados para ${walletsSnap.size} cuentas.`)
  }
)
