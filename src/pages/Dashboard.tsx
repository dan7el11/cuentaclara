import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToWallet,
  deposit,
  getRecentTransactions,
  ensureWallet,
} from '../services/walletService'
import { enablePush, pushAlreadyGranted, type PushStatus } from '../services/push'
import { estimateOpportunityCost } from '../utils/financialMath'
import type { Transaction, VirtualCardData, Wallet } from '../types'
import VirtualCard from '../components/VirtualCard'
import DepositModal from '../components/DepositModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [card, setCard] = useState<VirtualCardData | null>(null)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [depositOpen, setDepositOpen] = useState(false)
  const [pushState, setPushState] = useState<PushStatus | 'idle' | 'working'>(
    pushAlreadyGranted() ? 'granted' : 'idle'
  )

  const loadTxns = useCallback(() => {
    if (user) getRecentTransactions(user.uid).then(setTxns).catch(() => setTxns([]))
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToWallet(
      user.uid,
      (w) => {
        setWallet(w)
        setLoaded(true)
        setLoadError(null)
      },
      (err) => {
        setLoaded(true)
        setLoadError(err.message)
      }
    )
    getDoc(doc(db, 'cards', user.uid)).then((snap) => {
      if (snap.exists()) setCard(snap.data() as VirtualCardData)
    })
    loadTxns()
    return unsub
  }, [user, loadTxns])

  async function handleCreateWallet() {
    if (!user) return
    setCreating(true)
    try {
      await ensureWallet(user.uid)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo crear la cuenta')
    } finally {
      setCreating(false)
    }
  }

  async function handleEnablePush() {
    if (!user) return
    setPushState('working')
    try {
      setPushState(await enablePush(user.uid))
    } catch {
      setPushState('unsupported')
    }
  }

  async function handleDeposit(amount: number) {
    if (!user) return
    await deposit(user.uid, amount)
    loadTxns()
  }

  if (!loaded)
    return (
      <div className="flex items-center gap-3 text-ink/50">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ochre" />
        Cargando tu cuenta…
      </div>
    )

  if (!wallet)
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-2xl text-ink">Tu cuenta ficticia</h1>
        <div className="ledger-rule mt-3" />
        {loadError ? (
          <div className="mt-5 rounded-xl border border-burgundy/30 bg-burgundy/5 p-5 text-sm">
            <p className="font-medium text-burgundy">No pudimos leer tu cuenta.</p>
            <p className="mt-1 text-ink/70">{loadError}</p>
            <p className="mt-2 text-xs text-ink/55">
              Suele ser un tema de permisos de Firestore: las reglas deben permitir que cada
              usuario lea y escriba su propio documento en <code>wallets/&#123;uid&#125;</code>.
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-paperline bg-white p-6 shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
            <p className="text-sm text-ink/70">
              Todavía no tenés una billetera ficticia. Creá una para empezar a simular con saldo
              ficticio (sin valor real).
            </p>
            <button
              onClick={handleCreateWallet}
              disabled={creating}
              className="mt-4 rounded bg-slate px-4 py-2 text-sm font-semibold text-paper hover:bg-slatedark disabled:opacity-50"
            >
              {creating ? 'Creando…' : 'Crear cuenta con $100 ficticios'}
            </button>
          </div>
        )}
      </div>
    )

  const yearsActive = Math.max((Date.now() - wallet.createdAt) / (1000 * 60 * 60 * 24 * 365), 0.08)
  const opportunity = estimateOpportunityCost(wallet.totalStaked, Math.max(yearsActive, 5))
  const net = wallet.totalWon - wallet.totalLost

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Tu cuenta</h1>
          <p className="mt-1 text-sm text-ink/55">Extracto de tu actividad. En dinero ficticio.</p>
        </div>
        <span className="figure mb-1 hidden rounded-full border border-paperline px-3 py-1 text-[11px] tracking-wide text-ink/55 sm:inline">
          dinero ficticio
        </span>
      </div>
      <div className="ledger-rule mt-4" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Columna izquierda: saldo + tarjeta */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
            <div
              className="relative px-6 py-6 text-paper"
              style={{ background: 'linear-gradient(118deg, #2C4356 0%, #34506A 55%, #3D5A73 100%)' }}
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-ochre/50" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-paper/55">Saldo ficticio</p>
                  <p className="figure mt-1 text-4xl font-semibold">{money(wallet.balance)}</p>
                </div>
                <button
                  onClick={() => setDepositOpen(true)}
                  className="rounded-md border border-paper/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-white/20"
                >
                  + Recargar
                </button>
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <MiniStat label="Apostado" value={money(wallet.totalStaked)} />
                <MiniStat
                  label="Resultado neto"
                  value={net < 0 ? `−${money(Math.abs(net))}` : `+${money(net)}`}
                />
              </div>
            </div>
          </div>

          {card && <VirtualCard card={card} />}
        </div>

        {/* Columna derecha: extracto + costo de oportunidad */}
        <div className="overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)]">
          <div className="border-b border-paperline px-6 py-4">
            <h2 className="font-serif text-lg text-ink">Extracto resumido</h2>
          </div>
          <dl className="px-6 py-2 text-sm">
            <Row label="Saldo actual">{money(wallet.balance)}</Row>
            <Row label="Total apostado desde el inicio">{money(wallet.totalStaked)}</Row>
            <Row label="Total ganado" tone="sage">{money(wallet.totalWon)}</Row>
            <Row label="Total perdido" tone="burgundy" last>{money(wallet.totalLost)}</Row>
          </dl>

          <div className="m-6 mt-2 rounded-lg border border-sage/30 bg-sage/5 p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-sage text-[11px] font-bold text-paper">↗</span>
              <h3 className="text-sm font-medium text-ink">Si ese dinero hubiera ido a un fondo indexado</h3>
            </div>
            <p className="figure mt-3 text-3xl font-semibold text-sage">
              {money(opportunity.futureValue)}
              <span className="ml-2 text-xs font-normal text-ink/50">
                en {opportunity.years.toFixed(0)} años
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink/50">{opportunity.disclaimer}</p>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="overflow-hidden rounded-xl border border-paperline bg-white shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)] lg:col-span-2">
          <div className="border-b border-paperline px-6 py-4">
            <h2 className="font-serif text-lg text-ink">Actividad reciente</h2>
          </div>
          {txns.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-ink/50">
              Todavía no hay movimientos. Recargá saldo o registrá una apuesta para empezar.
            </div>
          ) : (
            <ul className="divide-y divide-paperline/70">
              {txns.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{txnLabel(t.type)}</p>
                    <p className="figure text-[11px] text-ink/50">{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`figure text-sm font-semibold ${t.amount < 0 ? 'text-burgundy' : 'text-sage'}`}>
                      {t.amount < 0 ? '−' : '+'}
                      {money(Math.abs(t.amount))}
                    </p>
                    <p className="figure text-[11px] text-ink/45">saldo {money(t.balanceAfter)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notificaciones */}
        <div className="rounded-xl border border-paperline bg-white p-5 shadow-[0_18px_50px_-26px_rgba(28,36,48,0.45)] lg:col-span-2">
          <h3 className="text-sm font-medium text-ink">Notificaciones</h3>
          <p className="mt-1 text-xs text-ink/60">
            Te avisamos en cuanto se resuelva una apuesta: si ganaste o perdiste, con la app cerrada.
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

      {depositOpen && (
        <DepositModal
          currentBalance={wallet.balance}
          onClose={() => setDepositOpen(false)}
          onConfirm={handleDeposit}
        />
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-paper/55">{label}</span>
      <span className="figure text-base">{value}</span>
    </div>
  )
}

function Row({
  label,
  children,
  tone,
  last,
}: {
  label: string
  children: ReactNode
  tone?: 'sage' | 'burgundy'
  last?: boolean
}) {
  const toneClass = tone === 'sage' ? 'text-sage' : tone === 'burgundy' ? 'text-burgundy' : 'text-ink'
  return (
    <div className={`flex items-center justify-between py-3 ${last ? '' : 'border-b border-paperline/60'}`}>
      <dt className="text-ink/60">{label}</dt>
      <dd className={`figure font-medium ${toneClass}`}>{children}</dd>
    </div>
  )
}

function txnLabel(type: Transaction['type']): string {
  switch (type) {
    case 'deposit_sim':
      return 'Recarga de saldo'
    case 'bet_placed':
      return 'Apuesta registrada'
    case 'bet_won':
      return 'Apuesta ganada'
    case 'bet_lost':
      return 'Apuesta perdida'
    default:
      return 'Movimiento'
  }
}

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(ms))
    .replace(/\./g, '')
}

function money(n: number) {
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}
