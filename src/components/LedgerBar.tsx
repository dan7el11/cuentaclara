import type { Wallet } from '../types'

interface Props {
  wallet: Wallet
}

/**
 * Siempre visible, en todas las pantallas. No es un banner que se pueda
 * cerrar: es parte del layout, igual que el saldo en un banco real.
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
          label="Si esto fuera dinero real, llevarías"
          value={netResult < 0 ? `−${formatMoney(Math.abs(netResult))}` : `+${formatMoney(netResult)}`}
          alert={netResult < 0}
        />
        <span className="rounded border border-paperline/40 px-2 py-0.5 text-[11px] uppercase tracking-wide text-paper/70">
          dinero ficticio · sin valor real
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
