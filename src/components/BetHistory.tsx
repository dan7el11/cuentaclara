import type { Bet } from '../types'
import { localize } from '../utils/flag'

/**
 * Historial de apuestas con el resultado neto bien visible. La idea es que
 * la pérdida acumulada deje de ser abstracta: acá se ve, apuesta por apuesta
 * y en total, cuánto se llevó la cuenta.
 */
export default function BetHistory({ bets }: { bets: Bet[] }) {
  if (bets.length === 0) return null

  const resolved = bets.filter((b) => b.status === 'won' || b.status === 'lost')
  const net = resolved.reduce((acc, b) => acc + netOf(b), 0)
  const staked = bets.reduce((acc, b) => acc + b.stake, 0)

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-paperline bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paperline bg-paper/60 px-4 py-3">
        <h2 className="font-serif text-base text-ink">Tu historial</h2>
        <div className="flex flex-wrap gap-5 text-sm">
          <Summary label="Apostado" value={money(staked)} />
          <Summary
            label="Resultado neto"
            value={`${net < 0 ? '−' : '+'}${money(Math.abs(net))}`}
            tone={net < 0 ? 'bad' : 'good'}
          />
          <Summary label="Apuestas" value={String(bets.length)} />
        </div>
      </div>

      <div className="divide-y divide-paperline">
        {bets.map((bet) => (
          <Row key={bet.id} bet={bet} />
        ))}
      </div>
    </section>
  )
}

function Row({ bet }: { bet: Bet }) {
  const net = netOf(bet)
  const first = bet.selections[0] as (typeof bet.selections)[number] & { pick?: string }
  const extra = bet.selections.length - 1
  // Compatibilidad con apuestas viejas (modelo anterior usaba `pick`).
  const label = first ? first.selectionLabel ?? first.pick ?? 'Apuesta' : 'Apuesta'
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {localize(label)}
          {extra > 0 && <span className="text-ink/50"> +{extra} más</span>}
        </p>
        <p className="figure mt-0.5 text-[11px] text-ink/50">
          {first ? localize(first.fixtureLabel) : ''} · {formatDate(bet.placedAt)}
        </p>
      </div>

      <div className="flex flex-none items-center gap-4 text-right">
        <span className="figure text-xs text-ink/50">{money(bet.stake)}</span>
        <StatusBadge status={bet.status} />
        <span
          className={`figure w-20 text-sm font-semibold ${
            bet.status === 'won' ? 'text-sage' : bet.status === 'lost' ? 'text-burgundy' : 'text-ink/40'
          }`}
        >
          {bet.status === 'pending'
            ? '—'
            : `${net < 0 ? '−' : '+'}${money(Math.abs(net))}`}
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Bet['status'] }) {
  const map: Record<Bet['status'], { label: string; cls: string }> = {
    won: { label: 'Ganada', cls: 'bg-sage/15 text-sage' },
    lost: { label: 'Perdida', cls: 'bg-burgundy/10 text-burgundy' },
    pending: { label: 'Pendiente', cls: 'bg-paperline text-ink/60' },
    void: { label: 'Anulada', cls: 'bg-paperline text-ink/60' },
  }
  const { label, cls } = map[status]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-ink/50">{label}</span>
      <span
        className={`figure font-semibold ${
          tone === 'bad' ? 'text-burgundy' : tone === 'good' ? 'text-sage' : 'text-ink'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function netOf(bet: Bet): number {
  if (bet.status === 'won') return bet.potentialPayout - bet.stake
  if (bet.status === 'lost') return -bet.stake
  return 0
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(ms))
    .replace(/\./g, '')
}
