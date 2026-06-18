import { probabilityOfRepeatingStreak } from '../utils/financialMath'
import type { Bet } from '../types'

interface Props {
  bet: Bet
  totalLostSoFar: number
  onClose: () => void
}

export default function ResultModal({ bet, totalLostSoFar, onClose }: Props) {
  const won = bet.status === 'won'
  const repeatProbability = probabilityOfRepeatingStreak(
    bet.selections.map((s) => s.decimalOdds)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-paperline bg-paper p-6">
        <h2 className="font-serif text-lg text-ink">
          {won ? 'Ganaste esta apuesta ficticia' : 'Perdiste esta apuesta ficticia'}
        </h2>
        <div className="ledger-rule my-3" />

        {won ? (
          <div className="space-y-3 text-sm text-ink">
            <p>
              Probabilidad de que un resultado como este se repita exactamente igual:{' '}
              <span className="figure">{(repeatProbability * 100).toFixed(1)}%</span>
            </p>
            <p className="text-ink/70">
              Ganar no es evidencia de que la próxima también gane. La cuota ya tenía
              incorporado lo improbable que era esto.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink">
            <p>
              Pérdida acumulada en esta cuenta hasta ahora:{' '}
              <span className="figure text-burgundy">
                {totalLostSoFar.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
              </span>
            </p>
            <p className="text-ink/70">
              Es dinero ficticio. El número de arriba es exactamente lo que tendrías
              menos si esta cuenta fuera real.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-slate px-4 py-2 text-sm text-paper hover:bg-slatedark"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
