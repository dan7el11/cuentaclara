import type { VirtualCardData } from '../types'

interface Props {
  card: VirtualCardData
}

/**
 * Puramente decorativa: refuerza la "ilusión" de tener una cuenta real
 * (aparece en el perfil y en el estado de cuenta), pero el login de la
 * app es con email/contraseña — esta tarjeta nunca se usa como
 * credencial. Ver README, sección "Decisión de diseño: la tarjeta".
 */
export default function VirtualCard({ card }: Props) {
  return (
    <div className="relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-xl bg-slatedark p-5 text-paper shadow-lg">
      <div className="ledger-rule absolute inset-x-5 top-14 opacity-30" />
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm tracking-wide">{card.brand}</span>
        <span className="rounded bg-ochre/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
          ficticia
        </span>
      </div>
      <div className="figure mt-10 text-lg tracking-widest">{card.maskedNumber}</div>
      <div className="mt-6 flex items-end justify-between text-xs">
        <div>
          <div className="text-paper/50 uppercase tracking-wide text-[10px]">Titular</div>
          <div className="figure">{card.holderName}</div>
        </div>
        <div>
          <div className="text-paper/50 uppercase tracking-wide text-[10px]">Vence</div>
          <div className="figure">{card.expiry}</div>
        </div>
      </div>
    </div>
  )
}
