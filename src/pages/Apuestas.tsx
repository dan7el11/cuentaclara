import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchUpcomingOdds,
  toBetSelection,
  selectionKey,
  type RawFixtureOdds,
} from '../services/oddsApi'
import {
  bookmakerMargin,
  impliedProbability,
  expectedValueOfBet,
  summarizeUserBets,
  estimateOpportunityCost,
} from '../utils/financialMath'
import type { Bet, BetSelection, Wallet } from '../types'
import BetHistory from '../components/BetHistory'
import { OddsButton, Badge, AdSlot } from '../components/ui'
import { flagUrl, teamsFromLabel, outcomeSymbol, displayTeam, localize } from '../utils/flag'
import { isLive, pickFeatured } from '../utils/featured'
import { useBetSlip } from '../context/BetSlipContext'

/**
 * Ligas para la barra superior desplegable (C3 / C7). `sport` es la clave
 * de The Odds API que se pasa a `fetchUpcomingOdds(sport)` para traer las
 * cuotas reales de esa competición.
 */
const LEAGUES = [
  { id: 'wc2026', sport: 'soccer_fifa_world_cup', code: 'MU', name: 'Mundial 2026' },
  { id: 'libertadores', sport: 'soccer_conmebol_copa_libertadores', code: 'CL', name: 'Copa Libertadores' },
  { id: 'laliga', sport: 'soccer_spain_la_liga', code: 'LL', name: 'LaLiga' },
  { id: 'premier', sport: 'soccer_epl', code: 'PL', name: 'Premier League' },
  { id: 'seriea', sport: 'soccer_italy_serie_a', code: 'SA', name: 'Serie A' },
]

/** "2026-06-22T16:00:00Z" -> "dom 22 jun · 11:00" (hora local del usuario). */
function formatKickoff(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(d)
    .replace(/\./g, '')
}

export default function Apuestas() {
  const navigate = useNavigate()
  // Boleto global: selecciones, saldo e historial viven en el contexto y
  // sobreviven a la navegación (p. ej. a la página de mercados del partido).
  const { selections, toggleSelection, combined: odds, stake, pastBets, wallet } = useBetSlip()
  const [fixtures, setFixtures] = useState<RawFixtureOdds[]>([])
  const [oddsError, setOddsError] = useState<string | null>(null)
  const [loadingOdds, setLoadingOdds] = useState(false)
  const [activeLeague, setActiveLeague] = useState(LEAGUES[0].id)
  const [onlyLive, setOnlyLive] = useState(false)

  // Recarga las cuotas cada vez que cambia la liga seleccionada.
  useEffect(() => {
    const lg = LEAGUES.find((l) => l.id === activeLeague) ?? LEAGUES[0]
    setLoadingOdds(true)
    setOddsError(null)
    fetchUpcomingOdds(lg.sport)
      .then((f) => setFixtures(f))
      .catch((e) => {
        setFixtures([])
        setOddsError(e instanceof Error ? e.message : 'No se pudieron cargar las cuotas')
      })
      .finally(() => setLoadingOdds(false))
  }, [activeLeague])

  // Al tocar un partido se abre la página con TODOS sus mercados.
  function openDetail(fixture: RawFixtureOdds) {
    if (fixture.sport) navigate(`/partido/${encodeURIComponent(fixture.sport)}/${encodeURIComponent(fixture.fixtureId)}`)
  }

  const now = Date.now()
  // El destacado es el de mayor relevancia (no el próximo) — ver utils/featured.
  const featured = pickFeatured(fixtures, now)
  const rest = featured ? fixtures.filter((f) => f.fixtureId !== featured.fixtureId) : fixtures
  const liveCount = fixtures.filter((f) => isLive(f, now)).length
  const listFixtures = onlyLive ? rest.filter((f) => isLive(f, now)) : rest

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Apuestas</h1>
          <p className="mt-1 text-sm text-ink/55">
            Cuotas representativas del mercado. El dinero, no.
          </p>
        </div>
        <span className="mb-1 hidden sm:inline">
          <Badge variant="ficticia">dinero ficticio</Badge>
        </span>
      </div>
      <div className="ledger-rule mt-4" />

      {/* ===== Sidebar de deportes/ligas + tablero ===== */}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
        <LeagueRail leagues={LEAGUES} activeLeague={activeLeague} onSelect={setActiveLeague} />

        {/* TABLERO UNIFICADO (C6: una sola superficie, sin recuadros flotantes) */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-paperline bg-surface shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">

        {/* Aviso de error real al cargar cuotas (ya no se traga en silencio) */}
        {oddsError && (
          <div className="border-b border-burgundy/30 bg-burgundy/5 px-6 py-4 text-sm text-burgundy">
            <p className="font-medium">No pudimos cargar las cuotas de esta competición.</p>
            <p className="mt-1 text-burgundy/80">{oddsError}</p>
            <p className="mt-1 text-xs text-burgundy/60">
              Puede ser que no haya partidos programados ahora mismo, que se haya agotado la
              cuota mensual de la API, o que falte configurar la clave en el servidor.
            </p>
          </div>
        )}

        {/* Estado de carga mientras llegan las cuotas */}
        {loadingOdds && !oddsError && (
          <div className="border-b border-paperline px-6 py-8 text-center text-sm text-ink/50">
            Cargando cuotas…
          </div>
        )}

        {/* Partido destacado por relevancia (C6 / C8 / C11 / C14) */}
        {featured && !loadingOdds && (
          <FeaturedFixture
            fixture={featured}
            live={isLive(featured, now)}
            selections={selections}
            onPick={toggleSelection}
            onOpenDetail={openDetail}
          />
        )}

        {/* Lista de partidos (C1: solo 1X2 · C9 / C10: alineados) */}
        <section className="p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                {onlyLive ? 'En vivo ahora' : 'Más partidos'}
              </p>
              <button
                onClick={() => setOnlyLive((v) => !v)}
                disabled={liveCount === 0 && !onlyLive}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                  onlyLive
                    ? 'border-burgundy bg-burgundy text-white'
                    : 'border-paperline text-ink/60 hover:border-burgundy/50 hover:text-ink'
                }`}
                title={liveCount === 0 ? 'No hay partidos en vivo ahora' : 'Mostrar solo partidos en vivo'}
              >
                <span className={`h-1.5 w-1.5 rounded-full bg-burgundy ${onlyLive ? 'bg-white' : ''} ${liveCount > 0 ? 'animate-pulse' : ''}`} />
                En vivo
                {liveCount > 0 && <span className="figure opacity-80">{liveCount}</span>}
              </button>
            </div>
            <div className="ledger-rule mb-3" />
            <div className="divide-y divide-paperline/70">
              {listFixtures.map((fixture, i) => (
                <Fragment key={fixture.fixtureId}>
                  <FixtureRow
                    fixture={fixture}
                    live={isLive(fixture, now)}
                    selections={selections}
                    onPick={toggleSelection}
                    onOpenDetail={openDetail}
                  />
                  {/* Espacio publicitario in-feed, tras los primeros partidos */}
                  {i === 3 && listFixtures.length > 5 && (
                    <div className="py-3">
                      <AdSlot format="banner" slotId="apuestas-infeed" />
                    </div>
                  )}
                </Fragment>
              ))}
              {listFixtures.length === 0 && !loadingOdds && !oddsError && (
                <p className="py-6 text-center text-sm text-ink/50">
                  {onlyLive ? 'No hay partidos en vivo en esta competición ahora.' : 'No hay más partidos disponibles ahora mismo.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar derecha: Tu realidad + La verdad incómoda */}
        <BettingSidebar
          wallet={wallet}
          pastBets={pastBets}
          featured={featured}
          selections={selections}
          stake={stake}
          combined={odds}
        />
      </div>

      {/* Historial: la pérdida acumulada, visible apuesta por apuesta */}
      <BetHistory bets={pastBets} />
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/* Sidebar compacta de deportes/ligas. En desktop es una columna estrecha   */
/* fija; en móvil colapsa a una fila con scroll horizontal para no robar     */
/* altura. Agrupada por deporte (hoy solo Fútbol).                           */
/* ----------------------------------------------------------------------- */
function LeagueRail({
  leagues,
  activeLeague,
  onSelect,
}: {
  leagues: { id: string; code: string; name: string }[]
  activeLeague: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="lg:w-48 lg:flex-none">
      <div className="rounded-xl border border-paperline bg-surface p-2 shadow-sm lg:sticky lg:top-28">
        <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          Deportes
        </p>
        <div className="flex items-center gap-1.5 px-2 pb-2 text-sm font-semibold text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
          Fútbol
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
          {leagues.map((lg) => {
            const active = lg.id === activeLeague
            return (
              <button
                key={lg.id}
                onClick={() => onSelect(lg.id)}
                title={lg.name}
                className={`flex flex-none items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors lg:w-full ${
                  active
                    ? 'border-slate bg-slate/10 text-slate'
                    : 'border-transparent text-ink/55 hover:bg-paperline/40 hover:text-ink'
                }`}
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-md text-[10px] font-bold ${
                    active ? 'bg-slate text-white' : 'bg-paperline text-ink'
                  }`}
                >
                  {lg.code}
                </span>
                <span className="truncate">{lg.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

/* ----------------------------------------------------------------------- */
/* Sidebar derecha · "Tu realidad" (saldo, pérdida, costo de oportunidad) y  */
/* "La verdad incómoda" (margen de la casa, valor esperado del boleto). En   */
/* desktop es una columna fija; en pantallas chicas se apila bajo el tablero.*/
/* ----------------------------------------------------------------------- */
function BettingSidebar({
  wallet,
  pastBets,
  featured,
  selections,
  stake,
  combined,
}: {
  wallet: Wallet | null
  pastBets: Bet[]
  featured?: RawFixtureOdds
  selections: BetSelection[]
  stake: number
  combined: number
}) {
  const stats = summarizeUserBets(pastBets)
  const net = wallet ? wallet.totalWon - wallet.totalLost : stats.net
  const opportunity = wallet && wallet.totalStaked > 0 ? estimateOpportunityCost(wallet.totalStaked, 5) : null
  const houseMargin = featured ? bookmakerMargin(featured.options.map((o) => o.decimalOdds)) : null
  const hasSlip = selections.length > 0
  const ev = expectedValueOfBet(stake)
  const impliedCombined = impliedProbability(combined)

  return (
    <aside className="lg:w-80 lg:flex-none">
      <div className="space-y-4 lg:sticky lg:top-28">
        {/* Tu realidad */}
        <div className="overflow-hidden rounded-xl border border-paperline bg-surface shadow-sm">
          <div className="border-b border-paperline px-4 py-2.5">
            <h3 className="font-serif text-sm text-ink">Tu realidad</h3>
          </div>
          <div className="space-y-2.5 px-4 py-3">
            <SideRow label="Saldo ficticio" value={wallet ? money(wallet.balance) : '—'} />
            <SideRow
              label="Pérdida acumulada"
              value={wallet ? `−${money(wallet.totalLost)}` : '—'}
              tone={wallet && wallet.totalLost > 0 ? 'bad' : undefined}
            />
            <SideRow
              label="Resultado neto"
              value={`${net < 0 ? '−' : '+'}${money(Math.abs(net))}`}
              tone={net < 0 ? 'bad' : net > 0 ? 'good' : undefined}
            />
            <SideRow label="Tu acierto real" value={stats.hitRate != null ? `${(stats.hitRate * 100).toFixed(0)}%` : '—'} />
            {opportunity && (
              <div className="rounded-lg border border-sage/30 bg-sage/5 px-3 py-2">
                <p className="text-[11px] text-ink/60">Si lo hubieras invertido (5 años)</p>
                <p className="figure text-base font-semibold text-sage">{money(opportunity.futureValue)}</p>
              </div>
            )}
          </div>
        </div>

        {/* La verdad incómoda */}
        <div className="overflow-hidden rounded-xl border border-ochre/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-ochre/30 px-4 py-2.5">
            <h3 className="font-serif text-sm text-ink">La verdad incómoda</h3>
            <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
          </div>
          <div className="space-y-2.5 px-4 py-3">
            <SideRow
              label="Margen de la casa"
              value={houseMargin != null ? `~${(houseMargin * 100).toFixed(1)}%` : '—'}
              tone="bad"
            />
            {hasSlip ? (
              <>
                <SideRow label="Valor esperado del boleto" value={`−${money(Math.abs(ev))}`} tone="bad" />
                <SideRow label="Prob. implícita (combinada)" value={`${(impliedCombined * 100).toFixed(1)}%`} />
                <p className="text-[11px] leading-relaxed text-ink/55">
                  Aun cuando ganes, en promedio cada apuesta de {money(stake)} te cuesta {money(Math.abs(ev))} por
                  el margen. Esa es la matemática que sostiene a la casa.
                </p>
              </>
            ) : (
              <p className="text-[11px] leading-relaxed text-ink/55">
                Armá un boleto para ver su valor esperado y la probabilidad real detrás de las cuotas.
              </p>
            )}
          </div>
        </div>

        {/* Espacio publicitario (reservado) */}
        <AdSlot format="rectangle" slotId="apuestas-sidebar" />
      </div>
    </aside>
  )
}

function SideRow({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12px] text-ink/60">{label}</span>
      <span
        className={`figure text-sm font-semibold ${
          tone === 'bad' ? 'text-burgundy' : tone === 'good' ? 'text-sage' : 'text-ink'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

/* ----------------------------------------------------------------------- */
/* Partido destacado · franja integrada en el panel (no es un recuadro      */
/* flotante). Badge en burgundy y tipografía sans (C11 / C14): hoy dice     */
/* "Destacado"; cuando los datos traigan estado en vivo, cámbialo por       */
/* "EN VIVO · {minuto}".                                                    */
/* ----------------------------------------------------------------------- */
function FeaturedFixture({
  fixture,
  live = false,
  selections,
  onPick,
  onOpenDetail,
}: {
  fixture: RawFixtureOdds
  live?: boolean
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
  onOpenDetail: (f: RawFixtureOdds) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div
      className="relative overflow-hidden border-b border-paperline px-6 py-5 text-white"
      style={{ background: 'var(--gradient-slate)' }}
    >
      {/* textura de talonario, sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 22px)',
        }}
      />
      {/* hairline ochre superior */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-ochre/50" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-[260px] flex-1">
          <div className="mb-4 flex items-center gap-3">
            {live ? (
              <span className="flex items-center gap-1.5 rounded bg-burgundy px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                EN VIVO
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
                DESTACADO
              </span>
            )}
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-white/55">
              {live ? 'En juego ahora' : kickoff ?? 'Partido destacado'}
            </span>
          </div>
          {teams ? (
            <div className="flex items-center gap-3 font-serif text-2xl">
              <TeamName name={teams[0]} />
              <span className="text-white/40">vs</span>
              <TeamName name={teams[1]} />
            </div>
          ) : (
            <div className="font-serif text-2xl">{fixture.label}</div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/55">
              {fixture.market}
            </span>
            {margin != null && (
              <p className="text-[11px] text-ochre" title="Suma de probabilidades por encima del 100%: lo que la casa se queda en promedio.">
                La casa se queda ~{(margin * 100).toFixed(1)}%
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {fixture.options.map((opt) => {
              const sel = toBetSelection(fixture, opt)
              const active = selections.some((s) => selectionKey(s) === selectionKey(sel))
              return (
                <OddsButton
                  key={opt.pick}
                  onDark
                  label={outcomeSymbol(opt.outcomeCode)}
                  odds={opt.decimalOdds}
                  active={active}
                  onClick={() => onPick(sel)}
                  style={{ minWidth: '80px' }}
                />
              )
            })}
          </div>
          {fixture.sport && (
            <button
              onClick={() => onOpenDetail(fixture)}
              className="text-right text-[11px] font-medium text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Ver todos los mercados ›
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamName({ name }: { name: string }) {
  const flag = flagUrl(name)
  return (
    <span className="flex items-center gap-2.5">
      {flag ? (
        <img
          src={flag}
          alt=""
          className="h-[21px] w-[30px] rounded-sm object-cover ring-1 ring-white/20"
        />
      ) : (
        <span className="grid h-[21px] w-[30px] place-items-center rounded-sm bg-white/10 text-[10px]">
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
      {displayTeam(name)}
    </span>
  )
}

/* ----------------------------------------------------------------------- */
/* Fila de partido · nombres y cuotas alineados en grid (C9 / C10), banderas */
/* reales (C8), solo columnas 1 / X / 2 (C1).                                */
/* ----------------------------------------------------------------------- */
function FixtureRow({
  fixture,
  live = false,
  selections,
  onPick,
  onOpenDetail,
}: {
  fixture: RawFixtureOdds
  live?: boolean
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
  onOpenDetail: (f: RawFixtureOdds) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,50px)] items-center gap-1.5 px-2 py-3 transition-colors hover:bg-paper/50 sm:grid-cols-[minmax(150px,1fr)_repeat(3,64px)] sm:gap-2">
      <button
        type="button"
        onClick={() => onOpenDetail(fixture)}
        disabled={!fixture.sport}
        className="min-w-0 text-left disabled:cursor-default"
        title={fixture.sport ? 'Ver todos los mercados' : undefined}
      >
        {teams ? (
          <div className="space-y-1">
            <RowTeam name={teams[0]} />
            <RowTeam name={teams[1]} />
          </div>
        ) : (
          <span className="text-sm font-medium text-ink">{fixture.label}</span>
        )}
        <p className="figure mt-1.5 pl-[30px] text-[10px] text-ink/40">
          {live ? (
            <span className="font-semibold text-burgundy">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-burgundy align-middle" />
              EN VIVO ·{' '}
            </span>
          ) : (
            kickoff && <span>{kickoff} · </span>
          )}
          {fixture.market}
          {margin != null && (
            <span className="text-ochre"> · casa ~{(margin * 100).toFixed(1)}%</span>
          )}
          {fixture.sport && <span className="text-slate"> · más mercados ›</span>}
        </p>
      </button>

      {fixture.options.map((opt) => {
        const sel = toBetSelection(fixture, opt)
        const active = selections.some((s) => selectionKey(s) === selectionKey(sel))
        return (
          <button
            key={opt.pick}
            onClick={() => onPick(sel)}
            className={`flex h-full flex-col items-center justify-center rounded-lg border py-2 transition-colors ${
              active
                ? 'border-slate bg-slate text-white shadow-sm'
                : 'border-paperline text-ink hover:border-slate hover:bg-paper/60'
            }`}
          >
            <span className="figure text-sm font-semibold">{opt.decimalOdds.toFixed(2)}</span>
          </button>
        )
      })}
    </div>
  )
}

function RowTeam({ name }: { name: string }) {
  const flag = flagUrl(name)
  return (
    <div className="grid grid-cols-[22px_1fr] items-center gap-2.5">
      {flag ? (
        <img src={flag} alt="" className="h-[15px] w-[22px] rounded-sm object-cover ring-1 ring-paperline" />
      ) : (
        <span className="grid h-[15px] w-[22px] place-items-center rounded-sm bg-paperline text-[8px] text-ink">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="truncate text-sm font-medium text-ink">{displayTeam(name)}</span>
    </div>
  )
}
