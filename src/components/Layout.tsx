import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeToWallet } from '../services/walletService'
import type { Wallet } from '../types'
import LedgerBar from './LedgerBar'
import ThresholdIntervention from './ThresholdIntervention'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [thresholdAcknowledgedFor, setThresholdAcknowledgedFor] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToWallet(user.uid, setWallet)
  }, [user])

  const showThreshold =
    wallet != null &&
    wallet.balance <= wallet.debtThreshold &&
    thresholdAcknowledgedFor !== wallet.balance

  return (
    <div className="min-h-screen bg-paper">
      {wallet && <LedgerBar wallet={wallet} />}

      <header className="border-b border-paperline">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-serif text-lg text-ink">CuentaClara</span>
          <div className="flex gap-5 text-sm">
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
        `border-b-2 pb-0.5 ${isActive ? 'border-slate text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`
      }
    >
      {children}
    </NavLink>
  )
}
