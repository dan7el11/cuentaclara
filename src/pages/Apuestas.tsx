import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchUpcomingOdds,
  toBetSelection,
  selectionKey,
  type RawFixtureOdds,
} from '../services/oddsApi'
import { placeBet, getBetHistory, resolveBet, resolvePendingBets } from '../services/walletService'
import { combinedOdds, bookmakerMargin } from '../utils/financialMath'
import type { Bet, BetSelection } from '../types'
import ResultModal from '../components/ResultModal'
import BetHistory from '../components/BetHistory'
import MatchDetailModal from '../components/MatchDetailModal'
import { flagUrl, teamsFromLabel, outcomeSymbol, displayTeam, localize } from '../utils/flag'

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
  const { user } = useAuth()
  const [fixtures, setFixtures] = useState<RawFixtureOdds[]>([])
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [stake, setStake] = useState(5)
  const [pastBets, setPastBets] = useState<Bet[]>([])
  const [resultBet, setResultBet] = useState<Bet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [oddsError, setOddsError] = useState<string | null>(null)
  const [loadingOdds, setLoadingOdds] = useState(false)
  const [activeLeague, setActiveLeague] = useState(LEAGUES[0].id)
  const [slipOpen, setSlipOpen] = useState(true)
  const [detail, setDetail] = useState<{ fixtureId: string; sport: string } | null>(null)

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

  // Al entrar: resuelve apuestas pendientes con resultados reales y, si
  // alguna se resolvió ahora, muestra su análisis.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      let resolvedIds: string[] = []
      try {
        resolvedIds = await resolvePendingBets(user.uid)
      } catch {
        // Sin resultados disponibles: las apuestas siguen pendientes.
      }
      const history = await getBetHistory(user.uid)
      if (cancelled) return
      setPastBets(history)
      if (resolvedIds.length > 0) {
        const justResolved = history.find(
          (b) => resolvedIds.includes(b.id) && b.status !== 'pending'
        )
        if (justResolved) setResultBet(justResolved)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // Alterna una selección en el boleto. Solo se permite una selección por
  // (partido, mercado): no podés tomar dos resultados del mismo mercado.
  function toggleSelection(sel: BetSelection) {
    setSelections((prev) => {
      const key = selectionKey(sel)
      const exists = prev.some((s) => selectionKey(s) === key)
      const rest = prev.filter(
        (s) => !(s.fixtureId === sel.fixtureId && s.marketKey === sel.marketKey)
      )
      return exists ? rest : [...rest, sel]
    })
  }

  function openDetail(fixture: RawFixtureOdds) {
    if (fixture.sport) setDetail({ fixtureId: fixture.fixtureId, sport: fixture.sport })
  }

  /**
   * C15 / C12 / C13: la previa ya no muestra ningún análisis que pueda
   * influir en el usuario (antes el modal <PreBetCheck/> aparecía aquí).
   * En la previa el producto es un simulador de apuestas a secas: se
   * registra la apuesta directamente y TODO el análisis ocurre DESPUÉS,
   * en <ResultModal/>.
   */
  async function placeBetNow() {
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
  }

  async function demoResolve(won: boolean) {
    if (!resultBet) return
    await resolveBet(resultBet.id, won ? 'won' : 'lost')
    const updated = await getBetHistory(user!.uid)
    setPastBets(updated)
    const resolved = updated.find((b) => b.id === resultBet.id) ?? null
    setResultBet(resolved)
  }

  const odds = combinedOdds(selections)
  const featured = fixtures[0]
  const listFixtures = fixtures.slice(1)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Apuestas</h1>
          <p className="mt-1 text-sm text-ink/55">
            Cuotas representativas del mercado. El dinero, no.
          </p>
        </div>
        <span className="figure mb-1 hidden rounded-full border border-paperline px-3 py-1 text-[11px] tracking-wide text-ink/55 sm:inline">
          dinero ficticio
        </span>
      </div>
      <div className="ledger-rule mt-4" />

      {/* ===== TABLERO UNIFICADO (C6: una sola superficie, sin recuadros flotantes) ===== */}
      <div className="mt-5 overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
        {/* Barra de ligas desplegable, con símbolos (C3 / C7) */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-paperline bg-paper/50 px-4 py-3">
          <span className="mr-2 flex flex-none items-center gap-2 border-r border-paperline pr-3 text-sm font-semibold text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
            Fútbol
          </span>
          {LEAGUES.map((lg) => {
            const active = lg.id === activeLeague
            return (
              <button
                key={lg.id}
                onClick={() => setActiveLeague(lg.id)}
                className={`flex flex-none items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-slate bg-slate/10 text-slate shadow-sm'
                    : 'border-paperline text-ink/55 hover:border-slate/40 hover:text-ink'
                }`}
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-md text-[10px] font-bold ${
                    active ? 'bg-slate text-paper' : 'bg-paperline text-ink'
                  }`}
                >
                  {lg.code}
                </span>
                {lg.name}
              </button>
            )
          })}
        </div>

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

        {/* Partido destacado, integrado en el panel (C6 / C8 / C11 / C14) */}
        {featured && !loadingOdds && (
          <FeaturedFixture
            fixture={featured}
            selections={selections}
            onPick={toggleSelection}
            onOpenDetail={openDetail}
          />
        )}

        {/* Cuerpo: lista + boleto (en columna en celular, lado a lado en desktop) */}
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Lista de partidos (C1: solo 1X2 · C9 / C10: alineados) */}
          <section className="min-w-0 flex-1 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">Más partidos</p>
            <div className="ledger-rule mb-3" />
            <div className="divide-y divide-paperline/70">
              {listFixtures.map((fixture) => (
                <FixtureRow
                  key={fixture.fixtureId}
                  fixture={fixture}
                  selections={selections}
                  onPick={toggleSelection}
                  onOpenDetail={openDetail}
                />
              ))}
              {listFixtures.length === 0 && !loadingOdds && !oddsError && (
                <p className="py-6 text-center text-sm text-ink/50">
                  No hay más partidos disponibles ahora mismo.
                </p>
              )}
            </div>
          </section>

          {/* Boleto colapsable / minimizable (C4) */}
          <aside
            className={`flex-none border-t border-paperline bg-paper/50 transition-all md:border-l md:border-t-0 ${
              slipOpen ? 'w-full md:w-[300px]' : 'w-full md:w-14'
            }`}
          >
            {slipOpen ? (
              <div>
                <div className="flex items-center justify-between border-b border-paperline px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSlipOpen(false)}
                      title="Minimizar boleto"
                      className="grid h-7 w-7 place-items-center rounded-md border border-paperline text-ink/60 hover:text-ink"
                    >
                      ›
                    </button>
                    <span className="font-serif text-base text-ink">Boleto</span>
                  </div>
                  <span className="figure text-xs text-ink/50">
                    {selections.length === 0
                      ? '—'
                      : `${selections.length} ${selections.length === 1 ? 'selección' : 'selecciones'}`}
                  </span>
                </div>

                {selections.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-ink/50">
                    Toca una cuota para añadirla a tu boleto.
                  </p>
                ) : (
                  <div>
                    <div className="divide-y divide-paperline">
                      {selections.map((s) => (
                        <div key={selectionKey(s)} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{localize(s.selectionLabel)}</p>
                              <p className="figure mt-0.5 text-[11px] text-ink/50">
                                {localize(s.fixtureLabel)} · {s.marketLabel}
                              </p>
                            </div>
                            <span className="figure text-sm font-semibold text-slate">
                              {s.decimalOdds.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-paperline px-4 py-3 text-sm">
                      <label className="flex items-center justify-between">
                        <span className="text-ink/70">Monto (ficticio)</span>
                        <input
                          type="number"
                          min={1}
                          value={stake}
                          onChange={(e) => setStake(Number(e.target.value))}
                          className="figure w-24 rounded border border-paperline px-2 py-1 text-right"
                        />
                      </label>
                      <div className="mt-2 flex justify-between">
                        <span className="text-ink/70">Cuota combinada</span>
                        <span className="figure font-semibold text-ink">{odds.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-ink/70">Pago potencial</span>
                        <span className="figure font-semibold text-sage">
                          {(stake * odds).toLocaleString('es-EC', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </span>
                      </div>
                    </div>

                    {error && <p className="px-4 text-sm text-burgundy">{error}</p>}

                    <div className="px-4 pb-4 pt-2">
                      <button
                        onClick={placeBetNow}
                        className="w-full rounded bg-slate px-4 py-3 text-sm font-semibold text-paper hover:bg-slatedark"
                      >
                        Realizar apuesta ficticia
                      </button>
                      <p className="mt-2 text-center text-[11px] text-ink/50">
                        El análisis completo aparece tras el resultado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-3 md:flex-col md:py-4">
                <button
                  onClick={() => setSlipOpen(true)}
                  title="Abrir boleto"
                  className="grid h-9 w-9 place-items-center rounded-md border border-paperline bg-white text-ink hover:border-slate"
                >
                  ‹
                </button>
                {selections.length > 0 && (
                  <span className="figure grid h-6 min-w-6 place-items-center rounded-full bg-slate px-1.5 text-xs font-bold text-paper">
                    {selections.length}
                  </span>
                )}
                <span className="font-serif text-sm text-ink/50 md:[writing-mode:vertical-rl] md:[transform:rotate(180deg)]">
                  Boleto
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Historial: la pérdida acumulada, visible apuesta por apuesta */}
      <BetHistory bets={pastBets} />

      {/* Detalle del partido: todos los mercados disponibles */}
      {detail && (
        <MatchDetailModal
          fixtureId={detail.fixtureId}
          sport={detail.sport}
          selections={selections}
          onPick={toggleSelection}
          onClose={() => setDetail(null)}
        />
      )}

      {/* ===== Flujo POSTERIOR a la apuesta (el análisis va aquí, no antes) ===== */}
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
            {isMockBet(resultBet) ? (
              <>
                {/* Datos de ejemplo (sin partido real): se resuelven a mano */}
                <p className="text-sm text-ink/70">
                  Apuesta registrada. Estos son datos de ejemplo, así que el resultado lo
                  eliges tú. Con cuotas reales, lo decide el partido:
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => demoResolve(true)}
                    className="rounded bg-sage px-3 py-1.5 text-sm text-paper"
                  >
                    Simular que ganó
                  </button>
                  <button
                    onClick={() => demoResolve(false)}
                    className="rounded bg-burgundy px-3 py-1.5 text-sm text-paper"
                  >
                    Simular que perdió
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Apuesta real: se resolverá sola cuando termine el partido */}
                <p className="text-sm text-ink/70">
                  Apuesta registrada. Se resolverá sola cuando termine el partido: la próxima
                  vez que abras la app, el resultado real decidirá si ganaste o perdiste.
                </p>
                <button
                  onClick={() => setResultBet(null)}
                  className="mt-4 rounded bg-slate px-4 py-2 text-sm text-paper hover:bg-slatedark"
                >
                  Entendido
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Una apuesta es "de ejemplo" si todas sus selecciones son datos mock. */
function isMockBet(bet: Bet): boolean {
  return bet.selections.every((s) => s.fixtureId.startsWith('mock-'))
}

/* ----------------------------------------------------------------------- */
/* Partido destacado · franja integrada en el panel (no es un recuadro      */
/* flotante). Badge en burgundy y tipografía sans (C11 / C14): hoy dice     */
/* "Destacado"; cuando los datos traigan estado en vivo, cámbialo por       */
/* "EN VIVO · {minuto}".                                                    */
/* ----------------------------------------------------------------------- */
function FeaturedFixture({
  fixture,
  selections,
  onPick,
  onOpenDetail,
}: {
  fixture: RawFixtureOdds
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
  onOpenDetail: (f: RawFixtureOdds) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div
      className="relative overflow-hidden border-b border-paperline px-6 py-5 text-paper"
      style={{
        background:
          'linear-gradient(118deg, #2C4356 0%, #34506A 55%, #3D5A73 100%)',
      }}
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
            <span className="flex items-center gap-1.5 rounded bg-burgundy px-2.5 py-1 text-[11px] font-bold tracking-wide text-paper">
              <span className="h-1.5 w-1.5 rounded-full bg-paper" />
              DESTACADO
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-paper/55">
              {kickoff ?? 'Partido destacado'}
            </span>
          </div>
          {teams ? (
            <div className="flex items-center gap-3 font-serif text-2xl">
              <TeamName name={teams[0]} />
              <span className="text-paper/40">vs</span>
              <TeamName name={teams[1]} />
            </div>
          ) : (
            <div className="font-serif text-2xl">{fixture.label}</div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-paper/55">
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
                <button
                  key={opt.pick}
                  onClick={() => onPick(sel)}
                  className={`flex min-w-[80px] flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-colors ${
                    active
                      ? 'border-paper bg-paper text-ink shadow-sm'
                      : 'border-paper/20 bg-white/5 text-paper hover:border-paper/40 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] font-semibold opacity-70">{outcomeSymbol(opt.outcomeCode)}</span>
                  <span className="figure text-lg font-semibold">{opt.decimalOdds.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
          {fixture.sport && (
            <button
              onClick={() => onOpenDetail(fixture)}
              className="text-right text-[11px] font-medium text-paper/70 underline-offset-2 hover:text-paper hover:underline"
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
          className="h-[21px] w-[30px] rounded-sm object-cover ring-1 ring-paper/20"
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
  selections,
  onPick,
  onOpenDetail,
}: {
  fixture: RawFixtureOdds
  selections: BetSelection[]
  onPick: (sel: BetSelection) => void
  onOpenDetail: (f: RawFixtureOdds) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div className="grid grid-cols-[minmax(150px,1fr)_repeat(3,64px)] items-center gap-2 px-2 py-3 transition-colors hover:bg-paper/50">
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
          {kickoff && <span>{kickoff} · </span>}
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
                ? 'border-slate bg-slate text-paper shadow-sm'
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
