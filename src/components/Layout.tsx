import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeToWallet } from '../services/walletService'
import { listenForegroundPush } from '../services/push'
import type { Wallet } from '../types'
import LedgerBar from './LedgerBar'
import ThresholdIntervention from './ThresholdIntervention'

/**
 * C2 / C5: la barra de saldo + el encabezado con las pestañas ahora forman
 * un único top bar fijo (sticky) que acompaña el scroll, y las pestañas
 * tienen un tratamiento visual más cuidado.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [thresholdAcknowledgedFor, setThresholdAcknowledgedFor] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToWallet(user.uid, setWallet)
  }, [user])

  // Muestra las push que llegan con la app abierta (FCM no las muestra solo).
  useEffect(() => {
    let stop = () => {}
    listenForegroundPush().then((unsub) => (stop = unsub))
    return () => stop()
  }, [])

  const showThreshold =
    wallet != null &&
    wallet.balance <= wallet.debtThreshold &&
    thresholdAcknowledgedFor !== wallet.balance

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-40 shadow-[0_6px_18px_-14px_rgba(28,36,48,0.5)]">
        {wallet && <LedgerBar wallet={wallet} />}

        <header className="border-b border-paperline bg-paper/95 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <span className="font-serif text-lg tracking-tight text-ink">CuentaClara</span>
            <div className="flex gap-6 text-sm">
              <Tab to="/">Cuenta</Tab>
              <Tab to="/apuestas">Apuestas</Tab>
              <Tab to="/educacion">Educación financiera</Tab>
              <Tab to="/apoyo">Apoyo</Tab>
            </div>
            {user && (
              <button onClick={logout} className="text-sm text-ink/60 hover:text-ink">
                Salir
              </button>
            )}
          </nav>
        </header>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      {showThreshold && wallet && (
        <ThresholdIntervention
          balance={wallet.balance}
          onAcknowledge={() => setThresholdAcknowledgedFor(wallet.balance)}
        />
      )}
    </div>
  )
}

function Tab({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `border-b-2 pb-1 font-medium transition-colors ${
          isActive ? 'border-slate text-ink' : 'border-transparent text-ink/60 hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
