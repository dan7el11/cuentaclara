import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  impliedProbability,
  probabilityOfRepeatingStreak,
  historicalHitRateInBucket,
  summarizeUserBets,
  estimateOpportunityCost,
} from '../utils/financialMath'
import { intensityFor, cierreP2, cierreP3, cierreP4, cierreP5, cierreP6 } from '../utils/postBetText'
import { localize } from '../utils/flag'
import { Button, Badge, LedgerRule } from './ui'
import type { Bet, Wallet, AnalysisData, MarketStatsPublic } from '../types'

// Margen típico de un mercado 1X2 cuando no tenemos todas las cuotas del
// mercado para calcularlo exacto (eso lo provee el backend en analysisData).
const TYPICAL_MARGIN = 0.07

interface Props {
  bet: Bet
  /** Historial completo del usuario, incluida esta apuesta. */
  pastBets: Bet[]
  /** Saldo, para intensidad del tono y recursos de apoyo. */
  wallet?: Wallet | null
  /** Agregados de cohorte (SPEC §5). Si falta, la P5 degrada a estimación. */
  marketStats?: MarketStatsPublic
  onClose: () => void
}

/**
 * Flujo de análisis post-apuesta de 6 pantallas (SPEC). Recorrido obligatorio:
 * no se cierra hasta llegar a la última. Usa datos reales del partido cuando
 * el backend los provee en `bet.analysisData`; si todavía no existen, muestra
 * lo computable desde el cliente y marca lo que falta — nunca inventa datos.
 */
export default function PostBetAnalysis({ bet, pastBets, wallet, marketStats, onClose }: Props) {
  const [step, setStep] = useState(0)
  const ctx = useAnalysis(bet, pastBets, wallet)

  const steps: { title: string; render: () => ReactNode }[] = [
    { title: 'Datos del partido', render: () => <P1 bet={bet} ctx={ctx} /> },
    { title: 'Margen del resultado', render: () => <P2 ctx={ctx} /> },
    { title: 'Lo que decían los datos', render: () => <P3 ctx={ctx} /> },
    { title: 'Lo que te vendió la cuota', render: () => <P4 ctx={ctx} /> },
    { title: 'Cómo te fue vs. todos', render: () => <P5 ctx={ctx} market={marketStats} /> },
    { title: 'La conclusión', render: () => <P6 ctx={ctx} wallet={wallet} onClose={onClose} /> },
  ]

  const last = steps.length - 1
  const isLast = step === last

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-paperline bg-paper shadow-xl">
        <div className="border-b border-paperline px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink/45">
            Análisis · paso {step + 1} de {steps.length}
          </p>
          <h2 className="font-serif text-lg text-ink">{steps[step].title}</h2>
        </div>

        <div className="flex gap-1 px-6 pt-3">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-slate' : 'bg-paperline'}`} />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{steps[step].render()}</div>

        <div className="flex items-center justify-between gap-3 border-t border-paperline px-6 py-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm text-ink/55 hover:text-ink disabled:opacity-0"
          >
            ‹ Atrás
          </button>
          {isLast ? (
            <Button onClick={onClose}>Entendido</Button>
          ) : (
            <Button onClick={() => setStep((s) => Math.min(last, s + 1))}>Siguiente ›</Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ===================== Cálculos compartidos ===================== */

function useAnalysis(bet: Bet, pastBets: Bet[], wallet?: Wallet | null) {
  const result: 'won' | 'lost' = bet.status === 'won' ? 'won' : 'lost'
  const won = result === 'won'
  const net = won ? bet.potentialPayout - bet.stake : bet.status === 'lost' ? -bet.stake : 0
  const combined = bet.combinedOdds || bet.selections.reduce((a, s) => a * s.decimalOdds, 1)
  const data: AnalysisData = bet.analysisData ?? {}

  // P4: exacto si el backend lo trae; si no, estimación con margen típico.
  const impliedProb = data.impliedProb ?? impliedProbability(combined)
  const houseMargin = data.houseMargin ?? TYPICAL_MARGIN
  const evPer10 = data.evPer10 ?? -Math.round(10 * houseMargin * 100) / 100
  const marginIsTypical = data.houseMargin == null

  // P6
  const repeat = data.repeatProbability ?? probabilityOfRepeatingStreak(bet.selections.map((s) => s.decimalOdds))
  const oppBase = wallet && wallet.totalStaked > 0 ? wallet.totalStaked : bet.stake
  const opp = {
    y1: data.opportunity1y ?? estimateOpportunityCost(oppBase, 1).futureValue,
    y5: data.opportunity5y ?? estimateOpportunityCost(oppBase, 5).futureValue,
    y10: data.opportunity10y ?? estimateOpportunityCost(oppBase, 10).futureValue,
    base: oppBase,
    fromHistory: !!(wallet && wallet.totalStaked > 0),
  }

  // P3 — historial del propio usuario (siempre disponible en cliente)
  const stats = summarizeUserBets(pastBets)
  const priorResolved = pastBets
    .filter((b) => b.id !== bet.id && (b.status === 'won' || b.status === 'lost'))
    .map((b) => ({ combinedOdds: b.combinedOdds, status: b.status as 'won' | 'lost' }))
  const bucket = historicalHitRateInBucket(priorResolved, combined)

  const intensity = intensityFor(bet.stake, result, wallet ?? null)

  return {
    result,
    won,
    net,
    combined,
    data,
    impliedProb,
    houseMargin,
    evPer10,
    marginIsTypical,
    repeat,
    opp,
    stats,
    bucket,
    intensity,
  }
}

type Ctx = ReturnType<typeof useAnalysis>

/* ===================== P1 · Datos del partido ===================== */

function P1({ bet, ctx }: { bet: Bet; ctx: Ctx }) {
  const d = ctx.data
  const t = d.marketTotals
  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-4 text-center ${
          ctx.won ? 'border-sage/40 bg-sage/10' : 'border-burgundy/40 bg-burgundy/10'
        }`}
      >
        <p className={`text-sm font-medium ${ctx.won ? 'text-sage' : 'text-burgundy'}`}>
          {ctx.won ? 'Ganaste esta apuesta ficticia' : 'Perdiste esta apuesta ficticia'}
        </p>
        <p className={`figure mt-1 text-3xl font-semibold ${ctx.won ? 'text-sage' : 'text-burgundy'}`}>
          {ctx.won ? '+' : '−'}
          {money(Math.abs(ctx.net))}
        </p>
        {d.finalScore && <p className="figure mt-1 text-sm text-ink/60">Resultado final: {d.finalScore}</p>}
      </div>

      {/* Ficha de la apuesta */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
          {bet.selections.length > 1 ? `Combinada · ${bet.selections.length} selecciones` : 'Tu selección'}
        </p>
        <LedgerRule margin="8px 0" />
        <div className="space-y-2">
          {bet.selections.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{localize(s.selectionLabel)}</p>
                <p className="figure mt-0.5 text-[11px] text-ink/50">
                  {localize(s.fixtureLabel)} · {s.marketLabel}
                </p>
              </div>
              <span className="figure flex-none text-sm font-semibold text-slate">{s.decimalOdds.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink/55">
          <span>Apostado: <span className="figure">{money(bet.stake)}</span></span>
          <span>Cuota: <span className="figure">{ctx.combined.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Estadísticas reales del partido (si el backend ya las provee) */}
      {t || d.xgHome != null ? (
        <div className="grid grid-cols-2 gap-2">
          {t?.possession && (
            <MiniStat label="Posesión" value={`${t.possession.home}% · ${t.possession.away}%`} />
          )}
          {t?.shotsOnGoal && (
            <MiniStat label="Remates al arco" value={`${t.shotsOnGoal.home} · ${t.shotsOnGoal.away}`} />
          )}
          {t?.corners && <MiniStat label="Córners" value={String(t.corners.total)} />}
          {t?.cards && <MiniStat label="Tarjetas" value={String(t.cards.total)} />}
          {t?.goals && <MiniStat label="Goles" value={String(t.goals.total)} />}
          {d.xgHome != null && d.xgAway != null && (
            <MiniStat
              label={d.xgIsProxy ? 'Goles esperados (est.)' : 'Goles esperados (xG)'}
              value={`${d.xgHome.toFixed(2)} · ${d.xgAway.toFixed(2)}`}
            />
          )}
        </div>
      ) : (
        <PendingNote text="Las estadísticas del partido (córners, remates, posesión, goles esperados, minuto a minuto) aparecen acá cuando se integra el proveedor de datos del partido." />
      )}
    </div>
  )
}

/* ===================== P2 · Margen del resultado ===================== */

function P2({ ctx }: { ctx: Ctx }) {
  const d = ctx.data
  const hasMatchData = d.unitsShort != null || d.crossedAtMinute != null || d.paceText || (d.criticalMoments?.length ?? 0) > 0
  return (
    <div className="space-y-4">
      {hasMatchData ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {d.unitsShort != null && <MiniStat label="Cuánto faltó" value={String(d.unitsShort)} tone="bad" />}
            {d.crossedAtMinute != null && <MiniStat label="Pasó a ganadora al min." value={String(d.crossedAtMinute)} />}
            {d.minutesNeeded != null && Number.isFinite(d.minutesNeeded) && (
              <MiniStat label="Minutos necesarios" value={String(d.minutesNeeded)} />
            )}
          </div>
          {d.paceText && <Stat label="Ritmo del partido" value={d.paceText} />}
          {(d.criticalMoments?.length ?? 0) > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Momentos críticos</p>
              <LedgerRule margin="6px 0" />
              <ul className="space-y-1.5">
                {d.criticalMoments!.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/75">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                        m.effect === 'wouldHaveWon' ? 'bg-sage' : m.effect === 'wouldHaveLost' ? 'bg-burgundy' : 'bg-ink/30'
                      }`}
                    />
                    <span>
                      <span className="figure text-ink">{m.minute}'</span> {m.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <PendingNote text="El detalle de qué tan cerca estuviste (cuánto faltó, en qué minuto cambió, momentos críticos) se calcula con los eventos del partido en el backend." />
      )}
      <Closing text={cierreP2(ctx.result, ctx.intensity, d)} />
    </div>
  )
}

/* ===================== P3 · Lo que decían los datos ===================== */

function P3({ ctx }: { ctx: Ctx }) {
  const d = ctx.data
  const s = ctx.stats
  return (
    <div className="space-y-4">
      {/* Probabilidad histórica del partido (backend) */}
      {d.histProbability != null && (
        <Stat
          label="Probabilidad histórica de este resultado"
          value={`1 de cada ${Math.round(1 / d.histProbability)}`}
          hint={
            d.histAvgHome != null && d.histAvgAway != null
              ? `Promedios previos: ${d.histAvgHome} (local) · ${d.histAvgAway} (visitante).`
              : undefined
          }
        />
      )}
      {d.playerConversionMatch != null && d.playerConversionHist != null && (
        <Stat
          label="Conversión del jugador (partido vs. histórica)"
          value={`${pct(d.playerConversionMatch)} · ${pct(d.playerConversionHist)}`}
        />
      )}

      {/* Tu propio historial (siempre disponible) */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-ink/50">Tu historial</p>
        <LedgerRule margin="6px 0" />
        {s.resolved === 0 ? (
          <p className="text-sm text-ink/60">Esta es tu primera apuesta resuelta: todavía no hay patrón propio para comparar.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Acierto real" value={s.hitRate != null ? pct(s.hitRate) : '—'} />
            <MiniStat label="Apuestas resueltas" value={String(s.resolved)} />
            {ctx.bucket.sampleSize > 0 && ctx.bucket.hitRate != null && (
              <MiniStat
                label="Acierto en cuotas similares"
                value={`${pct(ctx.bucket.hitRate)} (${ctx.bucket.sampleSize})`}
              />
            )}
          </div>
        )}
      </div>

      <Closing text={cierreP3(ctx.result, ctx.intensity, d)} />
    </div>
  )
}

/* ===================== P4 · Lo que te vendió la cuota ===================== */

function P4({ ctx }: { ctx: Ctx }) {
  const d = ctx.data
  return (
    <div className="space-y-4">
      <Stat label="Probabilidad implícita de la cuota" value={pct(ctx.impliedProb)} />
      {d.trueProb != null && (
        <Stat
          label="Probabilidad real (sin margen)"
          value={pct(d.trueProb)}
          hint={d.cuotaVsRealGap != null ? `La cuota sobreestimó tu chance en ${(d.cuotaVsRealGap * 100).toFixed(1)} puntos.` : undefined}
        />
      )}
      <Stat
        label="Margen de la casa"
        value={`~${(ctx.houseMargin * 100).toFixed(1)}%`}
        tone="bad"
        hint={ctx.marginIsTypical ? 'Estimación con un margen típico de mercado; el exacto se calcula con todas las cuotas del mercado.' : undefined}
      />
      <Stat label="Valor esperado por cada $10" value={`−${money(Math.abs(ctx.evPer10))}`} tone="bad" />
      <Closing text={cierreP4(ctx.result, ctx.intensity, { houseMargin: ctx.houseMargin, evPer10: ctx.evPer10 })} />
    </div>
  )
}

/* ===================== P5 · Clasificación general ===================== */

function P5({ ctx, market }: { ctx: Ctx; market?: MarketStatsPublic }) {
  if (market) {
    const winPct = Math.round(market.winRate * 100)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Acertó" value={`${winPct}%`} tone="good" />
          <MiniStat label="Perdió" value={`${100 - winPct}%`} tone="bad" />
          <MiniStat
            label="Rendimiento neto del grupo"
            value={`${market.avgNetRatio < 0 ? '−' : '+'}${Math.abs(Math.round(market.avgNetRatio * 100))}%`}
            tone={market.avgNetRatio < 0 ? 'bad' : 'good'}
          />
          <MiniStat label="Prob. implícita de la cuota" value={pct(market.bookieImplied)} />
        </div>
        <Closing text={cierreP5(ctx.result, ctx.intensity, market)} />
      </div>
    )
  }
  // Degradación: sin agregados de cohorte todavía, contexto modelado y marcado.
  return (
    <div className="space-y-4">
      <Badge variant="ochre" uppercase>
        estimación ilustrativa
      </Badge>
      <Stat
        label="Lo que se queda la casa de lo apostado"
        value={`~${(ctx.houseMargin * 100).toFixed(1)}%`}
        tone="bad"
        hint="El margen juega en contra de todos por igual; por eso, a la larga, la mayoría termina en rojo."
      />
      <PendingNote text="La comparación real con el resto de usuarios (qué % acertó este mercado y su rendimiento neto) se mostrará cuando estén los agregados anónimos por mercado." />
      <Closing
        text={
          ctx.stats.net < 0
            ? `Tu resultado neto hasta ahora es −${money(Math.abs(ctx.stats.net))}. Estás del lado en el que cae la mayoría.`
            : 'El diseño del mercado empuja el resultado de la mayoría hacia abajo con el tiempo.'
        }
      />
    </div>
  )
}

/* ===================== P6 · La conclusión ===================== */

function P6({ ctx, wallet, onClose }: { ctx: Ctx; wallet?: Wallet | null; onClose: () => void }) {
  const overThreshold = wallet != null && wallet.balance <= wallet.debtThreshold
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-ink/50">
          Si {ctx.opp.fromHistory ? `tus ${money(ctx.opp.base)} apostados` : `esos ${money(ctx.opp.base)}`} se invirtieran (8% anual)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <MiniStat label="1 año" value={money(ctx.opp.y1)} tone="good" />
          <MiniStat label="5 años" value={money(ctx.opp.y5)} tone="good" />
          <MiniStat label="10 años" value={money(ctx.opp.y10)} tone="good" />
        </div>
      </div>

      <Stat label="Probabilidad de repetir este resultado" value={pct(ctx.repeat)} />

      <Closing text={cierreP6(ctx.result, ctx.intensity, ctx.repeat)} strong />

      {overThreshold ? (
        <div className="rounded-lg border border-burgundy/40 bg-burgundy/10 p-4">
          <p className="text-sm font-medium text-burgundy">Superaste el límite que vos mismo definiste.</p>
          <p className="mt-1 text-sm text-ink/75">
            Esto es exactamente el momento en el que conviene parar y mirar los recursos de apoyo.
          </p>
          <div className="mt-3">
            <Link
              to="/apoyo"
              onClick={onClose}
              className="inline-block rounded-md bg-burgundy px-4 py-2 text-sm font-semibold text-white"
            >
              Ver recursos de apoyo
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 pt-1">
          <Link to="/educacion" onClick={onClose} className="text-sm font-medium text-slate underline hover:text-slatedark">
            Ver educación financiera
          </Link>
          <Link to="/apoyo" onClick={onClose} className="text-sm font-medium text-slate underline hover:text-slatedark">
            Recursos de apoyo
          </Link>
        </div>
      )}
    </div>
  )
}

/* ===================== Piezas de UI ===================== */

function Closing({ text, strong = false }: { text: string; strong?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm leading-relaxed ${
        strong ? 'border-ochre/30 bg-ochre/10 text-ink/85' : 'border-paperline bg-surface text-ink/75'
      }`}
    >
      {text}
    </div>
  )
}

function PendingNote({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-paperline bg-surface-tinted p-3 text-xs leading-relaxed text-ink/55">
      {text}
    </p>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink/50">{label}</p>
      <p
        className={`figure mt-0.5 text-2xl font-semibold ${
          tone === 'bad' ? 'text-burgundy' : tone === 'good' ? 'text-sage' : 'text-ink'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink/55">{hint}</p>}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border border-paperline bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink/50">{label}</p>
      <p
        className={`figure mt-0.5 text-lg font-semibold ${
          tone === 'bad' ? 'text-burgundy' : tone === 'good' ? 'text-sage' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}
