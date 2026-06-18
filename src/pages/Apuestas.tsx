import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchUpcomingOdds, toBetSelection, type RawFixtureOdds } from '../services/oddsApi'
import { placeBet, getBetHistory, resolveBet } from '../services/walletService'
import { combinedOdds, impliedProbability } from '../utils/financialMath'
import type { Bet, BetSelection } from '../types'
import PreBetCheck from '../components/PreBetCheck'
import ResultModal from '../components/ResultModal'

export default function Apuestas() {
  const { user } = useAuth()
  const [fixtures, setFixtures] = useState<RawFixtureOdds[]>([])
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [stake, setStake] = useState(5)
  const [pastBets, setPastBets] = useState<Bet[]>([])
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [resultBet, setResultBet] = useState<Bet | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUpcomingOdds().then(setFixtures)
    if (user) getBetHistory(user.uid).then(setPastBets)
  }, [user])

  function toggleSelection(
    fixture: RawFixtureOdds,
    option: RawFixtureOdds['options'][number]
  ) {
    const sel = toBetSelection(fixture, option)
    setSelections((prev) => {
      const withoutThisFixture = prev.filter((s) => s.fixtureId !== fixture.fixtureId)
      const alreadyPicked = prev.find(
        (s) => s.fixtureId === fixture.fixtureId && s.pick === option.pick
      )
      return alreadyPicked ? withoutThisFixture : [...withoutThisFixture, sel]
    })
  }

  async function confirmBet() {
    if (!user) return
    setError(null)
    try {
      const betId = await placeBet(user.uid, selections, stake)
      // Demo: en este MVP el usuario puede "resolver" su propia apuesta
      // para ver el flujo completo sin esperar a que termine un partido
      // real. En producción esto lo decide un resultado real, no un botón.
      setSelections([])
      setPendingConfirm(false)
      const updated = await getBetHistory(user.uid)
      setPastBets(updated)
      const justPlaced = updated.find((b) => b.id === betId) ?? null
      if (justPlaced) setResultBet(justPlaced)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la apuesta')
      setPendingConfirm(false)
    }
  }

  async function demoResolve(won: boolean) {
    if (!resultBet) return
    await resolveBet(resultBet.id, won)
    const updated = await getBetHistory(user!.uid)
    setPastBets(updated)
    const resolved = updated.find((b) => b.id === resultBet.id) ?? null
    setResultBet(resolved)
  }

  const odds = combinedOdds(selections)

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Apostar (dinero ficticio)</h1>
      <p className="mt-1 text-sm text-ink/60">
        Las cuotas son reales o representativas del mercado. El dinero, no.
      </p>

      <div className="mt-6 space-y-4">
        {fixtures.map((fixture) => (
          <div key={fixture.fixtureId} className="rounded border border-paperline bg-white p-4">
            <p className="text-sm font-medium text-ink">{fixture.label}</p>
            <div className="mt-2 flex gap-2">
              {fixture.options.map((opt) => {
                const active = selections.some(
                  (s) => s.fixtureId === fixture.fixtureId && s.pick === opt.pick
                )
                return (
                  <button
                    key={opt.pick}
                    onClick={() => toggleSelection(fixture, opt)}
                    className={`figure rounded border px-3 py-1.5 text-sm ${
                      active
                        ? 'border-slate bg-slate text-paper'
                        : 'border-paperline text-ink hover:border-slate'
                    }`}
                  >
                    {opt.pick} · {opt.decimalOdds.toFixed(2)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selections.length > 0 && (
        <div className="mt-6 rounded border border-slate bg-white p-4">
          <p className="text-sm text-ink">
            {selections.length === 1 ? 'Apuesta simple' : `Combinada de ${selections.length}`} ·
            cuota total <span className="figure">{odds.toFixed(2)}</span>
          </p>
          <label className="mt-3 block text-sm text-ink">
            Monto a apostar
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="figure mt-1 w-32 rounded border border-paperline px-2 py-1"
            />
          </label>
          {error && <p className="mt-2 text-sm text-burgundy">{error}</p>}
          <button
            onClick={() => setPendingConfirm(true)}
            className="mt-3 rounded bg-ink px-4 py-2 text-sm text-paper"
          >
            Revisar y confirmar
          </button>
        </div>
      )}

      {pendingConfirm && (
        <PreBetCheck
          combinedOdds={odds}
          impliedProbability={impliedProbability(odds)}
          stake={stake}
          pastBets={pastBets}
          onConfirm={confirmBet}
          onCancel={() => setPendingConfirm(false)}
        />
      )}

      {resultBet && resultBet.status !== 'pending' && (
        <ResultModal
          bet={resultBet}
          totalLostSoFar={pastBets
            .filter((b) => b.status === 'lost')
            .reduce((acc, b) => acc + b.stake, 0)}
          onClose={() => setResultBet(null)}
        />
      )}

      {resultBet && resultBet.status === 'pending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-paper p-6 text-center">
            <p className="text-sm text-ink/70">
              Apuesta registrada. Esto solo existe para que pruebes el flujo completo en
              este MVP — en producción el resultado lo decide el partido real, no un botón:
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={() => demoResolve(true)} className="rounded bg-sage px-3 py-1.5 text-sm text-paper">
                Simular que ganó
              </button>
              <button onClick={() => demoResolve(false)} className="rounded bg-burgundy px-3 py-1.5 text-sm text-paper">
                Simular que perdió
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
