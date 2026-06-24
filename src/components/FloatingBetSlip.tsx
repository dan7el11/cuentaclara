import { useEffect, useState } from 'react'
import { selectionKey } from '../services/oddsApi'
import { Button } from './ui'
import { localize } from '../utils/flag'
import type { BetSelection } from '../types'

interface Props {
  selections: BetSelection[]
  stake: number
  onStakeChange: (n: number) => void
  combinedOdds: number
  error: string | null
  onRemove: (sel: BetSelection) => void
  onPlace: () => void
}

/**
 * Boleto como ventana flotante minimizable, anclada al margen derecho y por
 * encima del resto de la pantalla (no vive dentro del recuadro de apuestas).
 * Minimizado es una pestaña en el borde; abierto es una tarjeta compacta.
 * Se abre solo cuando agregás una selección.
 */
export default function FloatingBetSlip({
  selections,
  stake,
  onStakeChange,
  combinedOdds,
  error,
  onRemove,
  onPlace,
}: Props) {
  const [open, setOpen] = useState(false)
  const count = selections.length

  // Se abre al agregar selecciones; si lo minimizás, queda así hasta el próximo cambio.
  useEffect(() => {
    if (count > 0) setOpen(true)
  }, [count])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Abrir boleto"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-paperline bg-slate py-3 pl-3 pr-2 text-white shadow-xl transition-transform hover:pr-3"
      >
        <span className="font-serif text-sm [writing-mode:vertical-rl] [transform:rotate(180deg)]">Boleto</span>
        {count > 0 && (
          <span className="figure grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-slate">
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-paperline bg-paper shadow-2xl">
      <div className="flex items-center justify-between border-b border-paperline bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base text-ink">Boleto</span>
          <span className="figure text-xs text-ink/50">
            {count === 0 ? '—' : `${count} ${count === 1 ? 'selección' : 'selecciones'}`}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          title="Minimizar boleto"
          className="grid h-7 w-7 place-items-center rounded-md border border-paperline text-ink/60 hover:text-ink"
        >
          ›
        </button>
      </div>

      {count === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink/50">Toca una cuota para añadirla a tu boleto.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="divide-y divide-paperline">
            {selections.map((s) => (
              <div key={selectionKey(s)} className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{localize(s.selectionLabel)}</p>
                  <p className="figure mt-0.5 text-[11px] text-ink/50">
                    {localize(s.fixtureLabel)} · {s.marketLabel}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className="figure text-sm font-semibold text-slate">{s.decimalOdds.toFixed(2)}</span>
                  <button
                    onClick={() => onRemove(s)}
                    title="Quitar"
                    className="grid h-5 w-5 place-items-center rounded text-ink/40 hover:bg-burgundy/10 hover:text-burgundy"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-paperline px-4 py-3 text-sm">
            <label className="flex items-center justify-between">
              <span className="text-ink/70">Monto (ficticio)</span>
              <input
                type="number"
                min={1}
                value={stake}
                onChange={(e) => onStakeChange(Number(e.target.value))}
                className="figure w-24 rounded border border-paperline bg-surface px-2 py-1 text-right text-ink"
              />
            </label>
            <div className="mt-2 flex justify-between">
              <span className="text-ink/70">Cuota combinada</span>
              <span className="figure font-semibold text-ink">{combinedOdds.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink/70">Pago potencial</span>
              <span className="figure font-semibold text-sage">{money(stake * combinedOdds)}</span>
            </div>
          </div>

          {error && <p className="px-4 text-sm text-burgundy">{error}</p>}

          <div className="px-4 pb-4 pt-2">
            <Button onClick={onPlace} fullWidth size="lg">
              Realizar apuesta ficticia
            </Button>
            <p className="mt-2 text-center text-[11px] text-ink/50">El análisis completo aparece tras el resultado.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
