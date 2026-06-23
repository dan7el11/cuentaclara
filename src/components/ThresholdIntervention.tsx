import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui'

interface Props {
  balance: number
  onAcknowledge: () => void
}

/**
 * No tiene botón de "cerrar" en la esquina ni se puede saltar con Escape:
 * requiere un reconocimiento explícito. Es la única pantalla de toda la
 * app que se comporta así — el resto del sistema de recordatorios es
 * informativo, esta es la excepción deliberada.
 */
export default function ThresholdIntervention({ balance, onAcknowledge }: Props) {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-lg border-2 border-burgundy bg-paper p-6">
        <h2 className="font-serif text-xl text-burgundy">
          Tu cuenta ficticia superó el límite que vos mismo definiste
        </h2>
        <p className="figure mt-2 text-2xl text-burgundy">
          {balance.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
        </p>

        <div className="mt-4 space-y-2 text-sm text-ink">
          <p>
            Definiste este umbral al crear la cuenta. Si esto fuera dinero real, este
            sería el momento en el que la mayoría de las casas de apuestas reales te
            seguirían ofreciendo un bono para "recuperarte".
          </p>
          <p>Antes de seguir, te dejamos esto:</p>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5"
          />
          Leí el resumen de mi cuenta y entiendo lo que significa este número si fuera
          dinero real.
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/apoyo" className="text-sm text-slate underline hover:text-slatedark">
            Ver recursos de apoyo ahora
          </Link>
          <Button
            variant="primary"
            disabled={!acknowledged}
            onClick={onAcknowledge}
            style={{ background: 'var(--color-ink)', borderColor: 'var(--color-ink)' }}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
