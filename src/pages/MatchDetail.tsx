import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchFixtureDetail,
  toDetailSelection,
  selectionKey,
  type FixtureDetail,
  type DetailMarket,
  type MarketSelectionDTO,
} from '../services/oddsApi'
import { bookmakerMargin } from '../utils/financialMath'
import { useBetSlip } from '../context/BetSlipContext'
import { teamsFromLabel, displayTeam, flagUrl } from '../utils/flag'
import { Badge } from '../components/ui'

/**
 * Página con TODOS los mercados/cuotas de un partido. Reemplaza al modal: al
 * tocar un partido se navega acá. El boleto (global) sigue vivo, así que las
 * selecciones que agregues quedan en el boleto flotante.
 */
export default function MatchDetail() {
  const { sport = '', fixtureId = '' } = useParams()
  const navigate = useNavigate()
  const { selections, toggleSelection } = useBetSlip()
  const [detail, setDetail] = useState<FixtureDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDetail(null)
    setError(null)
    fetchFixtureDetail(sport, fixtureId)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'No se pudo cargar el partido'))
    return () => {
      cancelled = true
    }
  }, [sport, fixtureId])

  const teams = detail ? teamsFromLabel(detail.label) : null

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-sm text-ink/55 hover:text-ink">
        ‹ Volver
      </button>

      {/* Cabecera del partido */}
      <div className="relative mt-3 overflow-hidden rounded-xl px-6 py-5 text-white" style={{ background: 'var(--gradient-slate)' }}>
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-ochre/50" />
        <div className="flex items-center justify-between gap-4">
          <div className="font-serif text-2xl">
            {teams ? (
              <span className="flex flex-wrap items-center gap-2">
                <Team name={teams[0]} /> <span className="text-white/40">vs</span> <Team name={teams[1]} />
              </span>
            ) : (
              detail?.label ?? 'Cargando…'
            )}
          </div>
          <Badge variant="ficticia">dinero ficticio</Badge>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-burgundy/30 bg-burgundy/5 p-4 text-sm text-burgundy">
          <p className="font-medium">No pudimos cargar los mercados.</p>
          <p className="mt-1 text-burgundy/80">{error}</p>
        </div>
      )}

      {!detail && !error && <p className="py-16 text-center text-sm text-ink/50">Cargando todos los mercados…</p>}

      {detail && detail.markets.length === 0 && !error && (
        <p className="py-16 text-center text-sm text-ink/50">No hay mercados disponibles para este partido ahora mismo.</p>
      )}

      <div className="mt-6 space-y-6">
        {detail?.markets.map((market) => (
          <Market key={market.key} detail={detail} market={market} selections={selections} onPick={toggleSelection} />
        ))}
      </div>

      {detail && detail.markets.length > 0 && (
        <p className="mt-6 text-center text-[11px] text-ink/50">
          Cuotas representativas del mercado. El dinero, ficticio. Tocá una cuota para sumarla a tu boleto.
        </p>
      )}
    </div>
  )
}

function Market({
  detail,
  market,
  selections,
  onPick,
}: {
  detail: FixtureDetail
  market: DetailMarket
  selections: ReturnType<typeof useBetSlip>['selections']
  onPick: (sel: ReturnType<typeof toDetailSelection>) => void
}) {
  const margin = bookmakerMargin(market.selections.map((s) => s.decimalOdds))
  return (
    <section className="overflow-hidden rounded-xl border border-paperline bg-surface shadow-sm">
      <div className="flex items-baseline justify-between border-b border-paperline px-4 py-3">
        <h3 className="font-serif text-base text-ink">{market.label}</h3>
        {margin != null && (
          <span className="text-[11px] text-ochre" title="Margen de la casa en este mercado.">
            casa ~{(margin * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
        {market.selections.map((sel: MarketSelectionDTO) => {
          const bet = toDetailSelection(detail, market, sel)
          const active = selections.some((s) => selectionKey(s) === selectionKey(bet))
          return (
            <button
              key={selectionKey(bet)}
              onClick={() => onPick(bet)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                active ? 'border-slate bg-slate text-white shadow-sm' : 'border-paperline bg-surface text-ink hover:border-slate'
              }`}
            >
              <span className="min-w-0 truncate text-sm">{sel.label}</span>
              <span className="figure flex-none text-sm font-semibold">{sel.decimalOdds.toFixed(2)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Team({ name }: { name: string }) {
  const flag = flagUrl(name)
  return (
    <span className="inline-flex items-center gap-2">
      {flag ? <img src={flag} alt="" className="h-[20px] w-[28px] rounded-sm object-cover ring-1 ring-white/20" /> : null}
      {displayTeam(name)}
    </span>
  )
}
