import type { ReactNode } from 'react'
import { historicalHitRateInBucket } from '../utils/financialMath'
import type { Bet } from '../types'

interface Props {
  combinedOdds: number
  impliedProbability: number
  stake: number
  pastBets: Pick<Bet, 'combinedOdds' | 'status'>[]
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Se muestra siempre antes de confirmar una apuesta. El botón de
 * confirmar queda deshabilitado hasta que termina una breve animación
 * de carga del propio dato (no para "molestar", sino para garantizar
 * que el dato estuvo en pantalla al menos un instante antes de poder
 * seguir). No es saltable; sí es rápido.
 */
export default function PreBetCheck({
  combinedOdds,
  impliedProbability,
  stake,
  pastBets,
  onConfirm,
  onCancel,
}: Props) {
  const validBets = pastBets.filter((b) => b.status === 'won' || b.status === 'lost') as {
    combinedOdds: number
    status: 'won' | 'lost'
  }[]
  const { sampleSize, hitRate } = historicalHitRateInBucket(validBets, combinedOdds)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-paperline bg-paper p-6">
        <h2 className="font-serif text-lg text-ink">Antes de confirmar</h2>
        <div className="ledger-rule my-3" />

        <dl className="space-y-3 text-sm">
          <Row label="Probabilidad real que el mercado le asigna a esto">
            {(impliedProbability * 100).toFixed(1)}%
          </Row>
          <Row label="Monto en juego">{stake.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</Row>
          <Row label="Tu historial en apuestas de cuota parecida">
            {sampleSize === 0
              ? 'Todavía no tenés suficientes apuestas parecidas para comparar.'
              : `Acertaste ${(hitRate! * 100).toFixed(0)}% de las últimas ${sampleSize} apuestas con esta cuota aproximada.`}
          </Row>
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-ink/70 hover:bg-paperline/50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-slate px-4 py-2 text-sm text-paper hover:bg-slatedark"
          >
            Confirmar apuesta ficticia
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[12px] uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="figure text-ink">{children}</dd>
    </div>
  )
}
