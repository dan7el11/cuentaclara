import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  impliedProbability,
  expectedValueOfBet,
  probabilityOfRepeatingStreak,
  historicalHitRateInBucket,
  summarizeUserBets,
  estimateOpportunityCost,
} from '../utils/financialMath'
import { localize } from '../utils/flag'
import { Button, Badge, LedgerRule } from './ui'
import type { Bet } from '../types'

// Margen típico de la casa en un mercado 1X2. Se usa para el valor esperado.
const HOUSE_MARGIN = 0.07

interface Props {
  bet: Bet
  /** Historial completo del usuario, incluida esta apuesta. */
  pastBets: Bet[]
  onClose: () => void
}

/**
 * Análisis posterior a la apuesta, en 5 pantallas. Reemplaza al popup de una
 * sola línea: ahora el momento del resultado es el momento educativo. Todos
 * los números salen de datos reales de la apuesta y del historial del usuario;
 * la comparación con "el resto" está modelada y marcada como ilustrativa.
 */
export default function PostBetAnalysis({ bet, pastBets, onClose }: Props) {
  const [step, setStep] = useState(0)
  const data = useAnalysis(bet, pastBets)

  const steps: { title: string; render: () => ReactNode }[] = [
    { title: 'Resultado', render: () => <ResultStep bet={bet} data={data} /> },
    { title: 'Probabilidades', render: () => <ProbabilityStep bet={bet} data={data} /> },
    { title: 'Tu historial', render: () => <HistoryStep data={data} /> },
    { title: 'Vos vs. el resto', render: () => <CohortStep data={data} /> },
    { title: 'El costo real', render: () => <OpportunityStep bet={bet} data={data} onClose={onClose} /> },
  ]

  const last = steps.length - 1
  const isLast = step === last

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-paperline bg-paper shadow-xl">
        {/* Cabecera con progreso */}
        <div className="flex items-center justify-between gap-4 border-b border-paperline px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink/45">
              Análisis · paso {step + 1} de {steps.length}
            </p>
            <h2 className="font-serif text-lg text-ink">{steps[step].title}</h2>
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            className="grid h-8 w-8 flex-none place-items-center rounded-md border border-paperline text-ink/60 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-slate' : 'bg-paperline'}`}
            />
          ))}
        </div>

        {/* Contenido (scrollable) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{steps[step].render()}</div>

        {/* Navegación */}
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

function useAnalysis(bet: Bet, pastBets: Bet[]) {
  const won = bet.status === 'won'
  const net = won ? bet.potentialPayout - bet.stake : bet.status === 'lost' ? -bet.stake : 0
  const combined = bet.combinedOdds || bet.selections.reduce((a, s) => a * s.decimalOdds, 1)
  const implied = bet.impliedProbability || impliedProbability(combined)
  const repeat = probabilityOfRepeatingStreak(bet.selections.map((s) => s.decimalOdds))
  const ev = expectedValueOfBet(bet.stake, HOUSE_MARGIN)

  // Historial SIN incluir esta apuesta, para que la comparación sea de "tu patrón".
  const priorResolved = pastBets
    .filter((b) => b.id !== bet.id)
    .map((b) => ({ combinedOdds: b.combinedOdds, status: b.status as 'won' | 'lost' }))
    .filter((b) => b.status === 'won' || b.status === 'lost')
  const bucket = historicalHitRateInBucket(priorResolved, combined)

  const stats = summarizeUserBets(pastBets)
  const expectedHouseTake = stats.totalStaked * HOUSE_MARGIN
  const oppYears = 5
  const opportunity = estimateOpportunityCost(stats.totalStaked, oppYears)

  return { won, net, combined, implied, repeat, ev, bucket, stats, expectedHouseTake, oppYears, opportunity }
}

type Analysis = ReturnType<typeof useAnalysis>

/* ===================== Paso 1 · Resultado ===================== */

function ResultStep({ bet, data }: { bet: Bet; data: Analysis }) {
  const won = data.won
  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-4 text-center ${
          won ? 'border-sage/40 bg-sage/10' : 'border-burgundy/40 bg-burgundy/10'
        }`}
      >
        <p className={`text-sm font-medium ${won ? 'text-sage' : 'text-burgundy'}`}>
          {won ? 'Ganaste esta apuesta ficticia' : 'Perdiste esta apuesta ficticia'}
        </p>
        <p className={`figure mt-1 text-3xl font-semibold ${won ? 'text-sage' : 'text-burgundy'}`}>
          {won ? '+' : '−'}
          {money(Math.abs(data.net))}
        </p>
        <p className="mt-1 text-[11px] text-ink/50">
          {won ? `Pago: ${money(bet.potentialPayout)} sobre ${money(bet.stake)} apostados` : `Apostaste ${money(bet.stake)}`}
        </p>
      </div>

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
      </div>

      <p className="text-sm leading-relaxed text-ink/70">
        {won
          ? 'Ganaste, pero esto no significa que “le acertaste al sistema”. La cuota ya tenía incorporado lo improbable que era. En las próximas pantallas vas a ver por qué.'
          : 'Es dinero ficticio, pero esa cifra es exactamente lo que tendrías menos si la cuenta fuera real. En las próximas pantallas vemos qué tan esperable era este resultado.'}
      </p>
    </div>
  )
}

/* ===================== Paso 2 · Probabilidades ===================== */

function ProbabilityStep({ bet, data }: { bet: Bet; data: Analysis }) {
  const combo = bet.selections.length > 1
  return (
    <div className="space-y-4">
      <Stat
        label="Probabilidad implícita de tu apuesta"
        value={pct(data.implied)}
        hint="Lo que el mercado le asignaba: necesitabas que esto pasara con esa frecuencia para que la apuesta fuera justa."
      />
      <Stat label="Cuota combinada" value={data.combined.toFixed(2)} />
      <Stat
        label="Valor esperado de esta apuesta"
        value={`−${money(Math.abs(data.ev))}`}
        tone="bad"
        hint={`Por el margen de la casa (~${pct(HOUSE_MARGIN)}), en promedio perdés esto cada vez que hacés una apuesta de este monto — ganes o pierdas esta vez.`}
      />
      {combo && (
        <Stat
          label="Probabilidad de que se repita exactamente igual"
          value={pct(data.repeat)}
          hint="En una combinada, las probabilidades se multiplican: cada selección extra hace mucho menos probable acertar todo."
        />
      )}
      <div className="rounded-lg border border-ochre/30 bg-ochre/10 p-3 text-sm text-ink/80">
        La probabilidad implícita ya incluye el margen de la casa. Por eso, en el largo plazo, el
        valor esperado de apostar es negativo aunque ganes algunas.
      </div>
    </div>
  )
}

/* ===================== Paso 3 · Tu historial ===================== */

function HistoryStep({ data }: { data: Analysis }) {
  const s = data.stats
  if (s.resolved === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink/70">
        Esta es tu primera apuesta resuelta. A medida que acumules más, acá vas a ver tu tasa de
        acierto real, tu resultado neto y tus rachas — el patrón, no el episodio suelto.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Apuestas resueltas" value={String(s.resolved)} />
        <MiniStat label="Tasa de acierto" value={s.hitRate != null ? pct(s.hitRate) : '—'} />
        <MiniStat label="Total apostado" value={money(s.totalStaked)} />
        <MiniStat
          label="Resultado neto"
          value={`${s.net < 0 ? '−' : '+'}${money(Math.abs(s.net))}`}
          tone={s.net < 0 ? 'bad' : 'good'}
        />
      </div>

      {s.streak && s.streak.length >= 2 && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            s.streak.type === 'lost' ? 'border-burgundy/30 bg-burgundy/10 text-ink/80' : 'border-sage/30 bg-sage/10 text-ink/80'
          }`}
        >
          Venís de <strong>{s.streak.length}</strong>{' '}
          {s.streak.type === 'lost' ? 'apuestas perdidas seguidas' : 'apuestas ganadas seguidas'}.{' '}
          {s.streak.type === 'lost'
            ? 'Cada apuesta es independiente: una racha mala no “se debe dar vuelta”. Querer recuperar lo perdido (chasing) es la señal de alerta más característica.'
            : 'Cada apuesta es independiente: una racha buena no predice la próxima. La cuota no “recuerda” que venís ganando.'}
        </div>
      )}

      {data.bucket.sampleSize > 0 && data.bucket.hitRate != null && (
        <Stat
          label="En apuestas de cuota parecida"
          value={`${pct(data.bucket.hitRate)} de acierto`}
          hint={`Sobre ${data.bucket.sampleSize} ${data.bucket.sampleSize === 1 ? 'apuesta previa' : 'apuestas previas'} con cuota similar a esta.`}
        />
      )}
    </div>
  )
}

/* ===================== Paso 4 · Comparación con el resto ===================== */

function CohortStep({ data }: { data: Analysis }) {
  const s = data.stats
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="ochre" uppercase>
          estimación ilustrativa
        </Badge>
      </div>

      <Stat
        label="Lo que se queda la casa de lo que apostaste"
        value={`~${money(data.expectedHouseTake)}`}
        tone="bad"
        hint={`Aplicando un margen típico del ${pct(HOUSE_MARGIN)} a tus ${money(s.totalStaked)} apostados. Es el promedio que pierde cualquiera que apueste ese volumen, independientemente de la suerte.`}
      />

      <div className="rounded-lg border border-paperline bg-surface p-4 text-sm leading-relaxed text-ink/75">
        <p>
          El margen de la casa juega en contra de todos por igual. Por eso, en una temporada, la
          gran mayoría de las personas que apuestan termina en rojo — no por mala suerte, sino por
          diseño matemático.
        </p>
        <p className="mt-2">
          {s.net < 0 ? (
            <>
              Tu resultado neto hasta ahora es{' '}
              <span className="figure font-semibold text-burgundy">−{money(Math.abs(s.net))}</span>. Estás
              del lado en el que cae la mayoría.
            </>
          ) : s.net > 0 ? (
            <>
              Tu resultado neto hasta ahora es{' '}
              <span className="figure font-semibold text-sage">+{money(s.net)}</span>. Estar en verde un
              tiempo es posible y esperable para algunos; sostenerlo contra el margen, a la larga, casi
              nadie lo logra.
            </>
          ) : (
            <>Vas empatado por ahora. El margen, sin embargo, empuja ese número hacia abajo con el tiempo.</>
          )}
        </p>
      </div>

      <p className="text-[11px] leading-relaxed text-ink/45">
        Cifras modeladas a partir del margen de la casa, para dar contexto. No son estadísticas de
        usuarios reales de esta app.
      </p>
    </div>
  )
}

/* ===================== Paso 5 · Costo de oportunidad ===================== */

function OpportunityStep({ bet, data, onClose }: { bet: Bet; data: Analysis; onClose: () => void }) {
  const s = data.stats
  const hasHistory = s.totalStaked > 0
  return (
    <div className="space-y-4">
      {hasHistory ? (
        <Stat
          label={`Si esos ${money(s.totalStaked)} se hubieran invertido (${data.oppYears} años, 8% anual)`}
          value={money(data.opportunity.futureValue)}
          tone="good"
          hint={data.opportunity.disclaimer}
        />
      ) : (
        <Stat
          label={`Si tus ${money(bet.stake)} se invirtieran (${data.oppYears} años, 8% anual)`}
          value={money(estimateFV(bet.stake, data.oppYears))}
          tone="good"
        />
      )}

      <p className="text-sm leading-relaxed text-ink/75">
        {data.won
          ? 'Ganar esta vez no cambia la dirección del promedio. La forma más confiable de que ese dinero crezca no es acertando cuotas, sino dejándolo trabajar a tu favor.'
          : 'Lo perdido no vuelve apostando más: esa es la trampa del “recupero”. El mismo dinero, en otro lugar, juega a tu favor en vez de en tu contra.'}
      </p>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link to="/educacion" onClick={onClose} className="text-sm font-medium text-slate underline hover:text-slatedark">
          Ver educación financiera
        </Link>
        <Link to="/apoyo" onClick={onClose} className="text-sm font-medium text-slate underline hover:text-slatedark">
          Recursos de apoyo
        </Link>
      </div>
    </div>
  )
}

/* ===================== Piezas de UI ===================== */

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'bad'
}) {
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

/* ===================== helpers ===================== */

function estimateFV(amount: number, years: number, rate = 0.08): number {
  return Math.round(amount * Math.pow(1 + rate, years) * 100) / 100
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}
