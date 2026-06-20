import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBetHistory } from '../services/walletService'
import { estimateOpportunityCost } from '../utils/financialMath'
import type { Bet } from '../types'

const HORIZONS = [1, 5, 10, 20]

export default function Educacion() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    if (user) getBetHistory(user.uid).then(setBets)
  }, [user])

  const resolved = bets.filter((b) => b.status !== 'pending')
  const totalStaked = resolved.reduce((acc, b) => acc + b.stake, 0)
  const wins = resolved.filter((b) => b.status === 'won').length
  const hitRate = resolved.length > 0 ? wins / resolved.length : null

  const projections = HORIZONS.map((years) => estimateOpportunityCost(totalStaked, years))
  const maxValue = Math.max(...projections.map((p) => p.futureValue), 1)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Educación financiera</h1>
          <p className="mt-1 text-sm text-ink/55">
            Los mismos números, mirados como inversión en vez de como apuesta.
          </p>
        </div>
        <span className="figure mb-1 hidden rounded-full border border-paperline px-3 py-1 text-[11px] tracking-wide text-ink/55 sm:inline">
          dinero ficticio
        </span>
      </div>
      <div className="ledger-rule mt-4" />

      {/* Costo de oportunidad */}
      <section className="mt-6 overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
        <div className="border-b border-paperline px-6 py-4">
          <h2 className="font-serif text-lg text-ink">Costo de oportunidad</h2>
          <p className="mt-1 text-sm text-ink/55">
            Qué hubiera valido lo que apostaste en un fondo indexado amplio (supuesto
            conservador de 8% anual nominal).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          {projections.map((proj) => (
            <div key={proj.years} className="rounded-lg border border-paperline bg-paper/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">
                {proj.years} {proj.years === 1 ? 'año' : 'años'}
              </p>
              <p className="figure mt-1 text-xl font-semibold text-sage">{money(proj.futureValue)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paperline">
                <div
                  className="h-full rounded-full bg-sage"
                  style={{ width: `${Math.max((proj.futureValue / maxValue) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="px-6 pb-5 text-xs text-ink/50">
          Estimación con tasa histórica conservadora. Rendimiento pasado no garantiza
          rendimiento futuro.
        </p>
      </section>

      {/* Tasa de acierto */}
      <section className="mt-6 overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
        <div className="border-b border-paperline px-6 py-4">
          <h2 className="font-serif text-lg text-ink">Tu tasa de acierto real</h2>
        </div>
        <div className="p-6">
          {resolved.length === 0 ? (
            <p className="text-sm text-ink/55">Todavía no tenés apuestas resueltas.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-none items-baseline gap-2">
                <span className="figure text-4xl font-semibold text-ink">
                  {(hitRate! * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-ink/55">
                  ({wins}/{resolved.length})
                </span>
              </div>
              <p className="min-w-[260px] flex-1 text-sm leading-relaxed text-ink/70">
                Para que una estrategia de apuestas sea rentable a largo plazo, tu tasa
                de acierto real tiene que superar consistentemente la probabilidad
                implícita de las cuotas que tomás — no una vez, sino en cientos de
                apuestas.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function money(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
