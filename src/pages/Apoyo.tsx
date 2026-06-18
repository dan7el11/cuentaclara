export default function Apoyo() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">Apoyo y recursos</h1>
      <p className="mt-1 text-sm text-ink/60">
        Si en algún momento esto deja de sentirse como una herramienta educativa y
        empieza a sentirse como algo que no podés dejar de mirar, esta página es para
        vos, no solo para quien usa dinero real.
      </p>

      <section className="mt-6">
        <h2 className="font-serif text-lg text-ink">Grupos de apoyo</h2>
        <div className="ledger-rule my-2" />
        <ul className="space-y-2 text-sm text-ink">
          <li>
            Jugadores Anónimos (capítulos en español, varios países) —{' '}
            <a className="text-slate underline" href="https://www.jugadoresanonimos.org" target="_blank" rel="noreferrer">
              jugadoresanonimos.org
            </a>
          </li>
        </ul>
        <p className="mt-2 text-xs text-ink/50">
          Verificá y actualizá estos enlaces antes de publicar el proyecto — la lista de
          capítulos y líneas de ayuda cambia con el tiempo.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-lg text-ink">Lo que dice la evidencia</h2>
        <div className="ledger-rule my-2" />
        <p className="text-sm text-ink/70">
          Espacio para artículos con base científica sobre los riesgos económicos,
          sociales, mentales y físicos de la ludopatía. (Pendiente de contenido curado.)
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-lg text-ink">¿Ya apostaste dinero real esta semana?</h2>
        <div className="ledger-rule my-2" />
        <p className="text-sm text-ink/70">
          Acá va la encuesta corta y opcional de seguimiento (placeholder — conectar a un
          formulario propio, con opción de responder de forma anónima).
        </p>
      </section>
    </div>
  )
}
