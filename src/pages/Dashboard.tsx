import { useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { subscribeToWallet } from '../services/walletService'
import { enablePush, pushAlreadyGranted, type PushStatus } from '../services/push'
import { estimateOpportunityCost } from '../utils/financialMath'
import type { VirtualCardData, Wallet } from '../types'
import VirtualCard from '../components/VirtualCard'

export default function Dashboard() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [card, setCard] = useState<VirtualCardData | null>(null)
  const [pushState, setPushState] = useState<PushStatus | 'idle' | 'working'>(
    pushAlreadyGranted() ? 'granted' : 'idle'
  )

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToWallet(user.uid, setWallet)
    getDoc(doc(db, 'cards', user.uid)).then((snap) => {
      if (snap.exists()) setCard(snap.data() as VirtualCardData)
    })
    return unsub
  }, [user])

  async function handleEnablePush() {
    if (!user) return
    setPushState('working')
    try {
      setPushState(await enablePush(user.uid))
    } catch {
      setPushState('unsupported')
    }
  }

  if (!wallet) return <p className="text-ink/60">Cargando tu cuenta…</p>

  const yearsActive = Math.max(
    (Date.now() - wallet.createdAt) / (1000 * 60 * 60 * 24 * 365),
    0.08 // mínimo ~1 mes, para que la proyección no quede en cero el primer día
  )
  const opportunity = estimateOpportunityCost(wallet.totalStaked, Math.max(yearsActive, 5))

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="font-serif text-2xl text-ink">Tu cuenta</h1>
        {card && <div className="mt-4"><VirtualCard card={card} /></div>}
      </div>

      <div>
        <h2 className="font-serif text-lg text-ink">Extracto resumido</h2>
        <div className="ledger-rule my-2" />
        <dl className="space-y-2 text-sm">
          <Row label="Saldo actual">{money(wallet.balance)}</Row>
          <Row label="Total apostado desde el inicio">{money(wallet.totalStaked)}</Row>
          <Row label="Total ganado">{money(wallet.totalWon)}</Row>
          <Row label="Total perdido">{money(wallet.totalLost)}</Row>
        </dl>

        <div className="mt-6 rounded border border-paperline bg-white p-4">
          <h3 className="text-sm font-medium text-ink">
            Si ese mismo dinero hubiera ido a un fondo indexado
          </h3>
          <p className="figure mt-1 text-xl text-sage">
            {money(opportunity.futureValue)}
            <span className="ml-2 text-xs text-ink/50">en {opportunity.years.toFixed(0)} años</span>
          </p>
          <p className="mt-1 text-xs text-ink/50">{opportunity.disclaimer}</p>
        </div>

        <div className="mt-6 rounded border border-paperline bg-white p-4">
          <h3 className="text-sm font-medium text-ink">Notificaciones</h3>
          <p className="mt-1 text-xs text-ink/60">
            Te avisamos en cuanto se resuelva una apuesta: si ganaste o perdiste, con la app
            cerrada.
          </p>
          {pushState === 'granted' ? (
            <p className="mt-3 text-sm text-sage">✓ Notificaciones activadas en este dispositivo.</p>
          ) : pushState === 'denied' ? (
            <p className="mt-3 text-sm text-burgundy">
              Bloqueaste las notificaciones. Actívalas desde los ajustes del navegador.
            </p>
          ) : pushState === 'unsupported' ? (
            <p className="mt-3 text-sm text-ink/60">
              Este navegador no soporta notificaciones push (en iPhone, primero añade la app a la
              pantalla de inicio).
            </p>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={pushState === 'working'}
              className="mt-3 rounded bg-slate px-4 py-2 text-sm text-paper hover:bg-slatedark disabled:opacity-50"
            >
              {pushState === 'working' ? 'Activando…' : 'Activar notificaciones'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-paperline/60 py-1">
      <dt className="text-ink/60">{label}</dt>
      <dd className="figure text-ink">{children}</dd>
    </div>
  )
}

function money(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
