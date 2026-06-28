import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBetHistory } from '../services/walletService'
import BetHistory from '../components/BetHistory'
import { Badge, AdSlot } from '../components/ui'
import type { Bet, BetStatus } from '../types'

type Filter = 'all' | 'won' | 'lost' | 'pending'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'won', label: 'Ganadas' },
  { id: 'lost', label: 'Perdidas' },
  { id: 'pending', label: 'Pendientes' },
]

/**
 * Pestaña dedicada al historial de apuestas: lista filtrable (todas / ganadas
 * / perdidas / pendientes) con el resultado neto siempre visible. La pérdida
 * acumulada deja de ser abstracta — acá se ve apuesta por apuesta.
 */
export default function MisApuestas() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!user) return
    getBetHistory(user.uid)
      .then(setBets)
      .catch(() => setBets([]))
      .finally(() => setLoaded(true))
  }, [user])

  const counts = useMemo(() => countByStatus(bets), [bets])
  const filtered = useMemo(
    () => (filter === 'all' ? bets : bets.filter((b) => b.status === filter)),
    [bets, filter]
  )

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Mis apuestas</h1>
          <p className="mt-1 text-sm text-ink/55">Todo lo que apostaste, ganaste y perdiste. En dinero ficticio.</p>
        </div>
        <span className="mb-1 hidden sm:inline">
          <Badge variant="ficticia">dinero ficticio</Badge>
        </span>
      </div>
      <div className="ledger-rule mt-4" />

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.id === filter
          const count = f.id === 'all' ? bets.length : counts[f.id as BetStatus] ?? 0
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-slate bg-slate/10 text-slate'
                  : 'border-paperline text-ink/55 hover:border-slate/40 hover:text-ink'
              }`}
            >
              {f.label}
              <span className="figure text-[11px] text-ink/45">{count}</span>
            </button>
          )
        })}
      </div>

      {!loaded ? (
        <p className="mt-8 text-sm text-ink/50">Cargando tus apuestas…</p>
      ) : bets.length === 0 ? (
        <div className="mt-8 rounded-xl border border-paperline bg-surface p-8 text-center text-sm text-ink/55 shadow-sm">
          Todavía no realizaste ninguna apuesta. Cuando lo hagas, vas a poder revisarlas acá.
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-paperline bg-surface p-8 text-center text-sm text-ink/55 shadow-sm">
          No tenés apuestas en esta categoría.
        </div>
      ) : (
        <div className="mt-6">
          <BetHistory bets={filtered} title="Resultados" flush />
        </div>
      )}

      {/* Espacio publicitario (reservado) */}
      <div className="mt-8">
        <AdSlot format="leaderboard" slotId="mis-apuestas-bottom" />
      </div>
    </div>
  )
}

function countByStatus(bets: Bet[]): Partial<Record<BetStatus, number>> {
  const out: Partial<Record<BetStatus, number>> = {}
  for (const b of bets) out[b.status] = (out[b.status] ?? 0) + 1
  return out
}
