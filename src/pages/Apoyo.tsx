import { useState, type ReactNode } from 'react'

// Brief Biosocial Gambling Screen (BBGS): tres preguntas validadas como
// cribado rápido. Cualquier "sí" sugiere conveniente una evaluación.
const SCREEN = [
  'En los últimos 12 meses, ¿te sentiste inquieto/a, irritable o ansioso/a cuando intentaste dejar o reducir las apuestas?',
  'En los últimos 12 meses, ¿intentaste ocultar a tu familia o amigos cuánto apostabas?',
  'En los últimos 12 meses, ¿tuviste problemas de dinero por las apuestas que te obligaron a pedir ayuda para gastos básicos?',
]

const WARNING_SIGNS = [
  'Apostar cada vez más para sentir la misma emoción.',
  'Intentar “recuperar” lo perdido apostando más (chasing).',
  'Mentir u ocultar cuánto o cuándo apostás.',
  'Pedir prestado, vender cosas o desatender pagos para apostar.',
  'Discutir con personas cercanas por el juego.',
  'Pensar en apostar gran parte del día.',
]

export default function Apoyo() {
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null])
  const [submitted, setSubmitted] = useState(false)

  const answered = answers.every((a) => a !== null)
  const yesCount = answers.filter((a) => a === true).length

  function setAnswer(i: number, value: boolean) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? value : a)))
    setSubmitted(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Apoyo y recursos</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/55">
            Si esto deja de sentirse como una herramienta educativa y empieza a sentirse como algo
            que no podés dejar de mirar, esta página es para vos — no solo para quien usa dinero real.
          </p>
        </div>
      </div>
      <div className="ledger-rule mt-4" />

      {/* Autoevaluación */}
      <Card icon="✓" title="Autoevaluación rápida (3 preguntas)">
        <p className="text-sm text-ink/70">
          Cribado breve y anónimo (BBGS). No es un diagnóstico, pero te ayuda a saber si conviene
          buscar una evaluación. No se guarda en ningún lado.
        </p>

        <div className="mt-4 space-y-4">
          {SCREEN.map((q, i) => (
            <div key={i} className="rounded-lg border border-paperline bg-paper/40 p-4">
              <p className="text-sm text-ink">{q}</p>
              <div className="mt-3 flex gap-2">
                <Choice active={answers[i] === true} onClick={() => setAnswer(i, true)}>Sí</Choice>
                <Choice active={answers[i] === false} onClick={() => setAnswer(i, false)}>No</Choice>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSubmitted(true)}
          disabled={!answered}
          className="mt-4 rounded bg-slate px-4 py-2 text-sm font-semibold text-paper hover:bg-slatedark disabled:opacity-40"
        >
          Ver resultado
        </button>

        {submitted && answered && (
          <div
            className={`mt-4 rounded-lg border p-4 text-sm leading-relaxed ${
              yesCount > 0
                ? 'border-burgundy/30 bg-burgundy/5 text-ink'
                : 'border-sage/30 bg-sage/5 text-ink'
            }`}
          >
            {yesCount > 0 ? (
              <>
                <p className="font-medium text-burgundy">
                  Respondiste “sí” a {yesCount} {yesCount === 1 ? 'pregunta' : 'preguntas'}.
                </p>
                <p className="mt-1 text-ink/75">
                  Una sola respuesta afirmativa ya sugiere que vale la pena hablar con un profesional
                  o con una línea de ayuda. No significa que “tengas un problema grave”; significa
                  que conviene mirarlo a tiempo. Mirá los recursos de abajo.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-sage">Ninguna señal de alarma por ahora.</p>
                <p className="mt-1 text-ink/75">
                  Aun así, conocer las señales de alerta ayuda a cuidarte y a cuidar a otros.
                </p>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Señales de alerta */}
      <Card icon="!" title="Señales de alerta">
        <ul className="grid gap-2 sm:grid-cols-2">
          {WARNING_SIGNS.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-ink/75">
              <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-ochre" />
              {s}
            </li>
          ))}
        </ul>
      </Card>

      {/* Qué hacer ahora */}
      <Card icon="→" title="Qué podés hacer ahora">
        <ol className="space-y-3 text-sm text-ink/75">
          <Step n={1} title="Poné límites concretos">
            Definí un tope de tiempo y de dinero, y escribilo. Los límites decididos “en frío”
            funcionan mejor que los del momento.
          </Step>
          <Step n={2} title="Bloqueá el acceso">
            Activá la autoexclusión de las plataformas reales y usá bloqueadores de apps/sitios de
            apuestas en tu teléfono.
          </Step>
          <Step n={3} title="Hablá con alguien de confianza">
            Contarlo reduce la vergüenza y el secreto, que son parte del problema.
          </Step>
          <Step n={4} title="Buscá ayuda profesional">
            La ludopatía es tratable. Una consulta temprana cambia el pronóstico.
          </Step>
        </ol>
      </Card>

      {/* Recursos */}
      <Card icon="✦" title="Líneas y grupos de ayuda">
        <ul className="space-y-3 text-sm text-ink">
          <Resource name="Jugadores Anónimos (en español, varios países)" href="https://www.jugadoresanonimos.org">
            Reuniones gratuitas y anónimas, presenciales y en línea.
          </Resource>
          <Resource name="FEJAR — España" href="https://www.fejar.org">
            Federación de asociaciones de rehabilitación; orientación y derivación a recursos locales.
          </Resource>
          <Resource name="Gamblers Anonymous (internacional)" href="https://www.gamblersanonymous.org">
            Directorio de reuniones por país y recursos de autoayuda.
          </Resource>
        </ul>
        <p className="mt-4 rounded-md bg-paper/60 px-3 py-2 text-xs text-ink/60">
          Si estás en crisis o con pensamientos de hacerte daño, llamá ya a tu número local de
          emergencias o a una línea de salud mental. Verificá las líneas de tu país: la
          disponibilidad cambia con el tiempo.
        </p>
      </Card>

      {/* Evidencia */}
      <Card icon="§" title="Lo que dice la evidencia">
        <ul className="space-y-2 text-sm leading-relaxed text-ink/75">
          <li>• El trastorno por juego está reconocido como una adicción del comportamiento (DSM-5).</li>
          <li>• Se asocia con mayores tasas de ansiedad, depresión, endeudamiento y ruptura de vínculos.</li>
          <li>• “Recuperar lo perdido” (chasing) es uno de los signos más característicos del problema.</li>
          <li>• El juego comercial tiene un margen a favor de la casa: cuanto más jugás, más perdés en promedio.</li>
        </ul>
      </Card>
    </div>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-5 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-slate bg-slate text-paper' : 'border-paperline text-ink/60 hover:border-slate/40'
      }`}
    >
      {children}
    </button>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="figure grid h-6 w-6 flex-none place-items-center rounded-full bg-slate/10 text-xs font-bold text-slate">
        {n}
      </span>
      <span>
        <span className="font-medium text-ink">{title}. </span>
        {children}
      </span>
    </li>
  )
}

function Resource({ name, href, children }: { name: string; href: string; children: ReactNode }) {
  return (
    <li>
      <a
        className="font-medium text-slate underline underline-offset-2 hover:text-slatedark"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {name}
      </a>
      <p className="mt-0.5 text-ink/60">{children}</p>
    </li>
  )
}

function Card({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
      <div className="flex items-center gap-3 border-b border-paperline px-6 py-4">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-slate/10 font-serif text-sm text-slate">
          {icon}
        </span>
        <h2 className="font-serif text-lg text-ink">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}
