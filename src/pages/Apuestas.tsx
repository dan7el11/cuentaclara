import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchUpcomingOdds, toBetSelection, type RawFixtureOdds } from '../services/oddsApi'
import { placeBet, getBetHistory, resolveBet } from '../services/walletService'
import { combinedOdds, bookmakerMargin } from '../utils/financialMath'
import type { Bet, BetSelection } from '../types'
import ResultModal from '../components/ResultModal'
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

  useEffect(() => {
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
    await resolveBet(resultBet.id, won)
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
      <h1 className="font-serif text-2xl text-ink">Apuestas (dinero ficticio)</h1>
      <p className="mt-1 text-sm text-ink/60">
        Cuotas representativas del mercado. El dinero, no.
      </p>

      {/* ===== TABLERO UNIFICADO (C6: una sola superficie, sin recuadros flotantes) ===== */}
      <div className="mt-6 overflow-hidden rounded-lg border border-paperline bg-white shadow-sm">
        {/* Barra de ligas desplegable, con símbolos (C3 / C7) */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-paperline bg-paper/60 px-4 py-3">
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
                className={`flex flex-none items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-medium ${
                  active
                    ? 'border-slate bg-slate/10 text-slate'
                    : 'border-paperline text-ink/60 hover:text-ink'
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
          />
        )}

        {/* Cuerpo: lista + boleto */}
        <div className="flex items-stretch">
          {/* Lista de partidos (C1: solo 1X2 · C9 / C10: alineados) */}
          <section className="min-w-0 flex-1 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-ink/50">Más partidos</p>
            <div className="space-y-1">
              {listFixtures.map((fixture) => (
                <FixtureRow
                  key={fixture.fixtureId}
                  fixture={fixture}
                  selections={selections}
                  onPick={toggleSelection}
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
            className={`flex-none border-l border-paperline bg-paper/50 transition-all ${
              slipOpen ? 'w-[300px]' : 'w-14'
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
                        <div key={s.fixtureId + s.pick} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{localize(s.pick)}</p>
                              <p className="figure mt-0.5 text-[11px] text-ink/50">{localize(s.fixtureLabel)}</p>
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
              <div className="flex flex-col items-center gap-3 py-4">
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
                <span className="font-serif text-sm text-ink/50 [writing-mode:vertical-rl] [transform:rotate(180deg)]">
                  Boleto
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>

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
            <p className="text-sm text-ink/70">
              Apuesta registrada. Esto solo existe para que pruebes el flujo completo en este
              MVP — en producción el resultado lo decide el partido real, no un botón:
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
          </div>
        </div>
      )}
    </div>
  )
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
}: {
  fixture: RawFixtureOdds
  selections: BetSelection[]
  onPick: (f: RawFixtureOdds, o: RawFixtureOdds['options'][number]) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div className="border-b border-paperline bg-slatedark px-6 py-5 text-paper">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-[260px] flex-1">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex items-center gap-2 rounded bg-burgundy px-2.5 py-1 text-[11px] font-bold tracking-wide text-paper">
              <span className="h-1.5 w-1.5 rounded-full bg-paper" />
              DESTACADO
            </span>
            <span className="text-xs font-medium text-paper/60">{kickoff ?? 'Partido destacado'}</span>
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
            <span className="text-[11px] font-medium text-paper/60">{fixture.market}</span>
            {margin != null && (
              <p className="text-[11px] text-ochre" title="Suma de probabilidades por encima del 100%: lo que la casa se queda en promedio.">
                La casa se queda ~{(margin * 100).toFixed(1)}%
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {fixture.options.map((opt) => {
              const active = selections.some(
                (s) => s.fixtureId === fixture.fixtureId && s.pick === opt.pick
              )
              return (
                <button
                  key={opt.pick}
                  onClick={() => onPick(fixture, opt)}
                  className={`flex min-w-[78px] flex-col items-center gap-1 rounded-lg border px-3 py-2.5 ${
                    active
                      ? 'border-paper bg-paper text-ink'
                      : 'border-paper/25 bg-white/5 text-paper hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] opacity-75">{outcomeSymbol(opt.outcomeCode)}</span>
                  <span className="figure text-lg font-semibold">{opt.decimalOdds.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
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
}: {
  fixture: RawFixtureOdds
  selections: BetSelection[]
  onPick: (f: RawFixtureOdds, o: RawFixtureOdds['options'][number]) => void
}) {
  const teams = teamsFromLabel(fixture.label)
  const margin = bookmakerMargin(fixture.options.map((o) => o.decimalOdds))
  const kickoff = formatKickoff(fixture.kickoff)
  return (
    <div className="grid grid-cols-[minmax(150px,1fr)_repeat(3,64px)] items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-paper/60">
      <div className="min-w-0">
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
        </p>
      </div>

      {fixture.options.map((opt) => {
        const active = selections.some(
          (s) => s.fixtureId === fixture.fixtureId && s.pick === opt.pick
        )
        return (
          <button
            key={opt.pick}
            onClick={() => onPick(fixture, opt)}
            className={`flex h-full flex-col items-center justify-center rounded-lg border py-2 ${
              active
                ? 'border-slate bg-slate text-paper'
                : 'border-paperline text-ink hover:border-slate'
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
