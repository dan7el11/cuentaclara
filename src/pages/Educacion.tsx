import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBetHistory } from '../services/walletService'
import {
  estimateOpportunityCost,
  expectedLossFromWagering,
  futureValueOfContributions,
} from '../utils/financialMath'
import type { Bet } from '../types'

const HORIZONS = [1, 5, 10, 20]
const HOUSE_MARGIN = 0.07 // margen típico de un mercado 1X2

export default function Educacion() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])

  // Simulador de desgaste
  const [perWeek, setPerWeek] = useState(20)
  const [years, setYears] = useState(5)

  useEffect(() => {
    if (user) getBetHistory(user.uid).then(setBets).catch(() => setBets([]))
  }, [user])

  const resolved = bets.filter((b) => b.status !== 'pending')
  const totalStaked = resolved.reduce((acc, b) => acc + b.stake, 0)
  const wins = resolved.filter((b) => b.status === 'won').length
  const hitRate = resolved.length > 0 ? wins / resolved.length : null

  const sim = useMemo(() => {
    const totalWagered = perWeek * 52 * years
    const expectedLost = expectedLossFromWagering(totalWagered, HOUSE_MARGIN)
    const invested = futureValueOfContributions(perWeek, years)
    return { totalWagered, expectedLost, invested }
  }, [perWeek, years])

  const projections = HORIZONS.map((y) => estimateOpportunityCost(totalStaked, y))
  const maxValue = Math.max(...projections.map((p) => p.futureValue), 1)
  const maxBar = Math.max(sim.invested, sim.expectedLost, 1)

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

      {/* Cómo gana la casa */}
      <Section title="Cómo gana la casa (siempre)">
        <p className="text-sm leading-relaxed text-ink/70">
          En un partido las tres opciones (gana local, empate, gana visitante) cubren todo lo
          que puede pasar: sus probabilidades reales suman 100%. Pero si sumás las
          probabilidades que <em>implican</em> las cuotas, da más de 100%. Ese excedente es el
          <strong> margen de la casa</strong>: lo que se queda en promedio, ganes o pierdas.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Example odds="2.10" pct="47.6%" label="Local" />
          <Example odds="3.30" pct="30.3%" label="Empate" />
          <Example odds="3.40" pct="29.4%" label="Visitante" />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-ochre/30 bg-ochre/10 px-4 py-3 text-sm">
          <span className="text-ink/70">Suma implícita: 47.6% + 30.3% + 29.4% =</span>
          <span className="figure font-semibold text-ochre">107.3% → la casa se queda ~7%</span>
        </div>
      </Section>

      {/* Simulador de desgaste */}
      <Section title="Simulador: apostar vs. invertir">
        <p className="text-sm leading-relaxed text-ink/70">
          Ajustá cuánto apostarías por semana y por cuánto tiempo. Mismo dinero, dos destinos.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={`Por semana: ${money(perWeek)}`}>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={perWeek}
              onChange={(e) => setPerWeek(Number(e.target.value))}
              className="w-full accent-slate"
            />
          </Field>
          <Field label={`Durante: ${years} ${years === 1 ? 'año' : 'años'}`}>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-slate"
            />
          </Field>
        </div>

        <p className="mt-4 text-xs uppercase tracking-wide text-ink/45">
          Total que pasaría por tus manos: <span className="figure">{money(sim.totalWagered)}</span>
        </p>

        <div className="mt-3 space-y-3">
          <CompareBar
            label="Apostando (pérdida esperada por el margen)"
            value={-sim.expectedLost}
            width={(sim.expectedLost / maxBar) * 100}
            tone="burgundy"
          />
          <CompareBar
            label="Invirtiendo en un fondo indexado (8% anual)"
            value={sim.invested}
            width={(sim.invested / maxBar) * 100}
            tone="sage"
          />
        </div>
        <p className="mt-3 text-xs text-ink/50">
          La pérdida al apostar no es mala suerte: es el diseño del juego. La inversión asume una
          tasa histórica conservadora; rendimiento pasado no garantiza rendimiento futuro.
        </p>
      </Section>

      {/* Costo de oportunidad de TU actividad */}
      <Section title="Costo de oportunidad de lo que ya apostaste">
        {totalStaked === 0 ? (
          <p className="text-sm text-ink/55">
            Todavía no apostaste nada. Cuando lo hagas, acá verás cuánto habría valido ese dinero
            invertido a 1, 5, 10 y 20 años.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink/55">
              Apostaste <span className="figure">{money(totalStaked)}</span>. Si en cambio
              hubiera ido a un fondo indexado amplio (8% anual nominal):
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          </>
        )}
      </Section>

      {/* Tasa de acierto */}
      <Section title="Tu tasa de acierto real">
        {resolved.length === 0 ? (
          <p className="text-sm text-ink/55">
            Todavía no tenés apuestas resueltas. Cuando las tengas, vas a poder comparar tu acierto
            real con lo que necesitarías para ser rentable.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-none items-baseline gap-2">
              <span className="figure text-4xl font-semibold text-ink">{(hitRate! * 100).toFixed(0)}%</span>
              <span className="text-sm text-ink/55">({wins}/{resolved.length})</span>
            </div>
            <p className="min-w-[260px] flex-1 text-sm leading-relaxed text-ink/70">
              Para que apostar sea rentable a largo plazo, tu acierto real tiene que superar
              consistentemente la probabilidad implícita de las cuotas — no una vez, sino en
              cientos de apuestas. El margen juega en tu contra cada vez.
            </p>
          </div>
        )}
      </Section>

      {/* Falacia del apostador */}
      <Section title="La falacia del apostador">
        <p className="text-sm leading-relaxed text-ink/70">
          "Ya salió rojo cinco veces, ahora toca negro." Falso: cada jugada es independiente y no
          recuerda las anteriores. Venir ganando (o perdiendo) no cambia la probabilidad de la
          próxima. La cuota ya incorpora lo improbable que es cada resultado; una racha no es una
          señal, es azar.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
      <div className="border-b border-paperline px-6 py-4">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Example({ odds, pct, label }: { odds: string; pct: string; label: string }) {
  return (
    <div className="rounded-lg border border-paperline bg-paper/40 p-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-ink/50">{label}</p>
      <p className="figure mt-1 text-lg font-semibold text-ink">{odds}</p>
      <p className="figure text-xs text-ink/55">implica {pct}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="figure mb-2 text-sm text-ink/70">{label}</p>
      {children}
    </div>
  )
}

function CompareBar({
  label,
  value,
  width,
  tone,
}: {
  label: string
  value: number
  width: number
  tone: 'sage' | 'burgundy'
}) {
  const barColor = tone === 'sage' ? 'bg-sage' : 'bg-burgundy'
  const textColor = tone === 'sage' ? 'text-sage' : 'text-burgundy'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink/70">{label}</span>
        <span className={`figure text-sm font-semibold ${textColor}`}>
          {value < 0 ? '−' : '+'}
          {money(Math.abs(value))}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paperline">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(width, 3)}%` }} />
      </div>
    </div>
  )
}

function money(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
