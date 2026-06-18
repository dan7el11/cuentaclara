import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBetHistory } from '../services/walletService'
import { estimateOpportunityCost } from '../utils/financialMath'
import type { Bet } from '../types'

const HORIZONS = [1, 5, 10, 20]

export default function Educacion() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    if (user) getBetHistory(user.uid).then(setBets)
  }, [user])

  const resolved = bets.filter((b) => b.status !== 'pending')
  const totalStaked = resolved.reduce((acc, b) => acc + b.stake, 0)
  const wins = resolved.filter((b) => b.status === 'won').length
  const hitRate = resolved.length > 0 ? wins / resolved.length : null

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Educación financiera</h1>
      <p className="mt-1 text-sm text-ink/60">
        Los mismos números, mirados como inversión en vez de como apuesta.
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-lg text-ink">Costo de oportunidad</h2>
        <p className="mt-1 text-sm text-ink/60">
          Qué hubiera valido lo que apostaste si en cambio hubiera ido a un fondo
          indexado amplio (supuesto conservador de 8% anual nominal).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HORIZONS.map((years) => {
            const proj = estimateOpportunityCost(totalStaked, years)
            return (
              <div key={years} className="rounded border border-paperline bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-ink/50">{years} años</p>
                <p className="figure text-lg text-sage">{money(proj.futureValue)}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-ink/50">
          Estimación con tasa histórica conservadora. Rendimiento pasado no garantiza
          rendimiento futuro.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-ink">Tu tasa de acierto real</h2>
        <div className="ledger-rule my-2" />
        {resolved.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no tenés apuestas resueltas.</p>
        ) : (
          <p className="text-sm text-ink">
            Acertaste <span className="figure">{wins}</span> de{' '}
            <span className="figure">{resolved.length}</span> apuestas (
            <span className="figure">{(hitRate! * 100).toFixed(0)}%</span>). Para que una
            estrategia de apuestas sea rentable a largo plazo, tu tasa de acierto real
            tiene que superar consistentemente la probabilidad implícita de las cuotas
            que tomás — no una vez, sino en cientos de apuestas.
          </p>
        )}
      </section>
    </div>
  )
}

function money(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
