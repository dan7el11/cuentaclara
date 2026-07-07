import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  placeBet,
  getBetHistory,
  resolveBet,
  resolvePendingBets,
  subscribeToWallet,
} from '../services/walletService'
import { combinedOdds } from '../utils/financialMath'
import { selectionKey } from '../services/oddsApi'
import FloatingBetSlip from '../components/FloatingBetSlip'
import PostBetAnalysis from '../components/PostBetAnalysis'
import { Button } from '../components/ui'
import type { Bet, BetSelection, Wallet } from '../types'

interface BetSlipCtx {
  selections: BetSelection[]
  toggleSelection: (sel: BetSelection) => void
  stake: number
  setStake: (n: number) => void
  combined: number
  error: string | null
  placeBetNow: () => Promise<void>
  pastBets: Bet[]
  wallet: Wallet | null
}

const Ctx = createContext<BetSlipCtx | null>(null)

/** Una apuesta es "de ejemplo" si todas sus selecciones son datos mock. */
function isMockBet(bet: Bet): boolean {
  return bet.selections.every((s) => s.fixtureId.startsWith('mock-'))
}

/**
 * Estado global del boleto y del flujo post-apuesta. Vive por encima de las
 * páginas para que el boleto flotante y el análisis obligatorio persistan al
 * navegar (p. ej. al abrir la página de todos los mercados de un partido).
 */
export function BetSlipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [stake, setStake] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [pastBets, setPastBets] = useState<Bet[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [resultBet, setResultBet] = useState<Bet | null>(null)

  // Saldo en vivo.
  useEffect(() => {
    if (!user) return
    return subscribeToWallet(user.uid, setWallet)
  }, [user])

  // Al entrar: resuelve pendientes con resultados reales y, si algo se resolvió
  // ahora, fuerza el análisis de la apuesta.
  useEffect(() => {
    if (!user) {
      setPastBets([])
      return
    }
    let cancelled = false
    ;(async () => {
      let resolvedIds: string[] = []
      try {
        resolvedIds = await resolvePendingBets(user.uid)
      } catch {
        /* sin resultados disponibles */
      }
      const history = await getBetHistory(user.uid)
      if (cancelled) return
      setPastBets(history)
      if (resolvedIds.length > 0) {
        const justResolved = history.find((b) => resolvedIds.includes(b.id) && b.status !== 'pending')
        if (justResolved) setResultBet(justResolved)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleSelection = useCallback((sel: BetSelection) => {
    setSelections((prev) => {
      const key = selectionKey(sel)
      const exists = prev.some((s) => selectionKey(s) === key)
      const rest = prev.filter((s) => !(s.fixtureId === sel.fixtureId && s.marketKey === sel.marketKey))
      return exists ? rest : [...rest, sel]
    })
  }, [])

  const placeBetNow = useCallback(async () => {
    if (!user || selections.length === 0) return
    setError(null)
    try {
      const betId = await placeBet(user.uid, selections, stake)
      setSelections([])
      const updated = await getBetHistory(user.uid)
      setPastBets(updated)
      const justPlaced = updated.find((b) => b.id === betId) ?? null
      if (justPlaced) setResultBet(justPlaced)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la apuesta')
    }
  }, [user, selections, stake])

  const demoResolve = useCallback(
    async (won: boolean) => {
      if (!resultBet || !user) return
      await resolveBet(resultBet.id, won ? 'won' : 'lost')
      const updated = await getBetHistory(user.uid)
      setPastBets(updated)
      setResultBet(updated.find((b) => b.id === resultBet.id) ?? null)
    },
    [resultBet, user]
  )

  const combined = combinedOdds(selections)

  const value = useMemo<BetSlipCtx>(
    () => ({ selections, toggleSelection, stake, setStake, combined, error, placeBetNow, pastBets, wallet }),
    [selections, toggleSelection, stake, combined, error, placeBetNow, pastBets, wallet]
  )

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Boleto flotante, global y por encima de todo */}
      <FloatingBetSlip
        selections={selections}
        stake={stake}
        onStakeChange={setStake}
        combinedOdds={combined}
        error={error}
        onRemove={toggleSelection}
        onPlace={placeBetNow}
      />

      {/* Flujo post-apuesta obligatorio */}
      {resultBet && resultBet.status !== 'pending' && (
        <PostBetAnalysis bet={resultBet} pastBets={pastBets} wallet={wallet} onClose={() => setResultBet(null)} />
      )}

      {resultBet && resultBet.status === 'pending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-paper p-6 text-center">
            {isMockBet(resultBet) ? (
              <>
                <p className="text-sm text-ink/70">
                  Apuesta registrada. Estos son datos de ejemplo, así que el resultado lo elegís vos.
                  Con cuotas reales, lo decide el partido:
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button variant="success" size="sm" onClick={() => demoResolve(true)}>
                    Simular que ganó
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => demoResolve(false)}>
                    Simular que perdió
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink/70">
                  Apuesta registrada. Se resolverá sola cuando termine el partido: la próxima vez que
                  abras la app, el resultado real decidirá si ganaste o perdiste.
                </p>
                <div className="mt-4">
                  <Button onClick={() => setResultBet(null)}>Entendido</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useBetSlip() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBetSlip debe usarse dentro de <BetSlipProvider>')
  return ctx
}
