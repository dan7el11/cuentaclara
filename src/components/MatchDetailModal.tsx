import { useEffect, useState } from 'react'
import {
  fetchFixtureDetail,
  toDetailSelection,
  selectionKey,
  type FixtureDetail,
  type DetailMarket,
  type MarketSelectionDTO,
} from '../services/oddsApi'
import { bookmakerMargin } from '../utils/financialMath'
import type { BetSelection } from '../types'
import { teamsFromLabel, displayTeam, flagUrl } from '../utils/flag'

interface Props {
  fixtureId: string
  sport: string
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
  onClose: () => void
}

export default function MatchDetailModal({ fixtureId, sport, selections, onPick, onClose }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-xl border border-paperline bg-paper shadow-xl">
        {/* Cabecera */}
        <div
          className="relative px-6 py-5 text-paper"
          style={{ background: 'linear-gradient(118deg, #2C4356 0%, #34506A 55%, #3D5A73 100%)' }}
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-ochre/50" />
          <div className="flex items-start justify-between gap-4">
            <div className="font-serif text-xl">
              {teams ? (
                <span className="flex flex-wrap items-center gap-2">
                  <Team name={teams[0]} /> <span className="text-paper/40">vs</span>{' '}
                  <Team name={teams[1]} />
                </span>
              ) : (
                detail?.label ?? 'Cargando…'
              )}
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 flex-none place-items-center rounded-md border border-paper/30 text-paper hover:bg-white/10"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-lg border border-burgundy/30 bg-burgundy/5 p-4 text-sm text-burgundy">
              <p className="font-medium">No pudimos cargar los mercados.</p>
              <p className="mt-1 text-burgundy/80">{error}</p>
            </div>
          )}

          {!detail && !error && (
            <p className="py-10 text-center text-sm text-ink/50">Cargando mercados…</p>
          )}

          {detail && detail.markets.length === 0 && !error && (
            <p className="py-10 text-center text-sm text-ink/50">
              No hay mercados disponibles para este partido ahora mismo.
            </p>
          )}

          <div className="space-y-6">
            {detail?.markets.map((market) => (
              <Market
                key={market.key}
                detail={detail}
                market={market}
                selections={selections}
                onPick={onPick}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-paperline px-6 py-3 text-center text-[11px] text-ink/50">
          Cuotas representativas del mercado. El dinero, ficticio.
        </div>
      </div>
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
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
}) {
  const margin = bookmakerMargin(market.selections.map((s) => s.decimalOdds))
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-serif text-base text-ink">{market.label}</h3>
        {margin != null && (
          <span
            className="text-[11px] text-ochre"
            title="Margen de la casa en este mercado."
          >
            casa ~{(margin * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {market.selections.map((sel: MarketSelectionDTO) => {
          const bet = toDetailSelection(detail, market, sel)
          const active = selections.some((s) => selectionKey(s) === selectionKey(bet))
          return (
            <button
              key={selectionKey(bet)}
              onClick={() => onPick(bet)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'border-slate bg-slate text-paper shadow-sm'
                  : 'border-paperline bg-white text-ink hover:border-slate'
              }`}
            >
              <span className="min-w-0 truncate text-sm">{sel.label}</span>
              <span className="figure flex-none text-sm font-semibold">
                {sel.decimalOdds.toFixed(2)}
              </span>
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
      {flag ? (
        <img src={flag} alt="" className="h-[18px] w-[26px] rounded-sm object-cover ring-1 ring-paper/20" />
      ) : null}
      {displayTeam(name)}
    </span>
  )
}
