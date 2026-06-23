import { useState } from 'react'
import { Button } from './ui'

interface Props {
  currentBalance: number
  onClose: () => void
  onConfirm: (amount: number) => Promise<void>
}

const QUICK = [10, 20, 50, 100]

/**
 * Recarga de saldo ficticio. Conserva el tono del proyecto: no celebra la
 * recarga, la enmarca como lo que es (volver a poner dinero después de perder).
 */
export default function DepositModal({ currentBalance, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState(20)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (!(amount > 0)) {
      setError('Ingresá un monto mayor a cero.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(amount)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo recargar.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-paperline bg-paper shadow-xl">
        <div className="border-b border-paperline px-6 py-4">
          <h2 className="font-serif text-lg text-ink">Recargar saldo ficticio</h2>
          <p className="figure mt-0.5 text-xs text-ink/50">Saldo actual: {money(currentBalance)}</p>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                className={`figure rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  amount === q
                    ? 'border-slate bg-slate/10 text-slate'
                    : 'border-paperline text-ink/60 hover:border-slate/40'
                }`}
              >
                {money(q)}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-ink/70">
            Otro monto
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="figure mt-1 w-full rounded border border-paperline bg-white px-3 py-2 text-right"
            />
          </label>

          <p className="mt-3 rounded-md bg-ochre/10 px-3 py-2 text-xs leading-relaxed text-ink/70">
            Es dinero ficticio. En una casa real, este es justo el momento en que alguien que
            ya iba perdiendo "vuelve a cargar" para recuperarse.
          </p>

          {error && <p className="mt-3 text-sm text-burgundy">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-paperline px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? 'Recargando…' : `Recargar ${money(amount || 0)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function money(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
