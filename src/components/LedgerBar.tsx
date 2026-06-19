import type { Wallet } from '../types'

interface Props {
  wallet: Wallet
}

/**
 * Siempre visible, en todas las pantallas. No es un banner que se pueda
 * cerrar: es parte del layout, igual que el saldo en un banco real.
 *
 * Cambios pedidos por revisión (Daniel):
 *  - C13: el indicador editorializaba la pérdida ("Si esto fuera dinero
 *    real, llevarías …"). En la pantalla de apuestas eso influye antes de
 *    apostar; aquí se vuelve un dato neutro de simulador: "Resultado neto".
 *  - C12: el sello "dinero ficticio · sin valor real" se lee como una
 *    alarma. Se vuelve un chip discreto "Modo simulador". El carácter
 *    ficticio del dinero sigue marcado en la etiqueta "Saldo ficticio".
 */
export default function LedgerBar({ wallet }: Props) {
  const isNegative = wallet.balance < 0
  const netResult = wallet.totalWon - wallet.totalLost

  return (
    <div className="bg-ink text-paper px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Stat label="Saldo ficticio" value={formatMoney(wallet.balance)} alert={isNegative} />
        <Stat label="Apostado en total" value={formatMoney(wallet.totalStaked)} />
        <Stat
          label="Resultado neto"
          value={netResult < 0 ? `−${formatMoney(Math.abs(netResult))}` : `+${formatMoney(netResult)}`}
          alert={netResult < 0}
        />
        <span className="flex items-center gap-2 rounded-full border border-paperline/40 px-3 py-1 text-[11px] tracking-wide text-paper/70">
          <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
          Modo simulador
        </span>
      </div>
    </div>
  )
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-paper/60">{label}</span>
      <span className={`figure text-base ${alert ? 'text-ochre' : 'text-paper'}`}>{value}</span>
    </div>
  )
}

function formatMoney(n: number): string {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
