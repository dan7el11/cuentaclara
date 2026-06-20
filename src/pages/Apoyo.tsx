import { type ReactNode } from 'react'

export default function Apoyo() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Apoyo y recursos</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/55">
            Si en algún momento esto deja de sentirse como una herramienta educativa y
            empieza a sentirse como algo que no podés dejar de mirar, esta página es para
            vos — no solo para quien usa dinero real.
          </p>
        </div>
      </div>
      <div className="ledger-rule mt-4" />

      <Card icon="✦" title="Grupos de apoyo">
        <ul className="space-y-2 text-sm text-ink">
          <li>
            Jugadores Anónimos (capítulos en español, varios países) —{' '}
            <a
              className="text-slate underline underline-offset-2 hover:text-slatedark"
              href="https://www.jugadoresanonimos.org"
              target="_blank"
              rel="noreferrer"
            >
              jugadoresanonimos.org
            </a>
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink/50">
          Verificá y actualizá estos enlaces antes de publicar el proyecto — la lista de
          capítulos y líneas de ayuda cambia con el tiempo.
        </p>
      </Card>

      <Card icon="§" title="Lo que dice la evidencia">
        <p className="text-sm leading-relaxed text-ink/70">
          Espacio para artículos con base científica sobre los riesgos económicos,
          sociales, mentales y físicos de la ludopatía. (Pendiente de contenido curado.)
        </p>
      </Card>

      <Card icon="?" title="¿Ya apostaste dinero real esta semana?">
        <p className="text-sm leading-relaxed text-ink/70">
          Acá va la encuesta corta y opcional de seguimiento (placeholder — conectar a un
          formulario propio, con opción de responder de forma anónima).
        </p>
      </Card>
    </div>
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
