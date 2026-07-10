import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Logo } from './ui'
import { subscribeToWallet } from '../services/walletService'
import { listenForegroundPush } from '../services/push'
import { recordDailyActivity } from '../services/analyticsService'
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
  const { theme, toggle } = useTheme()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [thresholdAcknowledgedFor, setThresholdAcknowledgedFor] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToWallet(user.uid, setWallet)
  }, [user])

  // Registra actividad diaria (DAU + racha oculta para análisis de riesgo).
  useEffect(() => {
    if (user) recordDailyActivity(user.uid).catch(() => {})
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
          <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 lg:px-6">
            <Logo variant="full" size={22} ink="var(--color-text)" />
            <div className="flex min-w-0 gap-4 overflow-x-auto whitespace-nowrap text-sm sm:gap-6 [scrollbar-width:none]">
              <Tab to="/">Cuenta</Tab>
              <Tab to="/apuestas">Apuestas</Tab>
              <Tab to="/mis-apuestas">Mis apuestas</Tab>
              <Tab to="/educacion">Educación financiera</Tab>
              <Tab to="/apoyo">Apoyo</Tab>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggle}
                title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                aria-label="Cambiar tema"
                className="grid h-8 w-8 place-items-center rounded-md border border-paperline text-ink/70 transition-colors hover:text-ink"
              >
                {theme === 'dark' ? '☀' : '☾'}
              </button>
              {user && <ProfileMenu email={user.email} balance={wallet?.balance} onLogout={logout} />}
            </div>
          </nav>
        </header>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">{children}</main>

      {showThreshold && wallet && (
        <ThresholdIntervention
          balance={wallet.balance}
          onAcknowledge={() => setThresholdAcknowledgedFor(wallet.balance)}
        />
      )}
    </div>
  )
}

/** Botón de perfil con menú: email, saldo y salir. */
function ProfileMenu({
  email,
  balance,
  onLogout,
}: {
  email: string | null
  balance?: number
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const initial = (email ?? '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tu perfil"
        title="Tu perfil"
        className="grid h-8 w-8 place-items-center rounded-full border border-paperline bg-slate/10 text-sm font-semibold text-slate transition-colors hover:border-slate"
      >
        {initial}
      </button>

      {open && (
        <>
          {/* Capa para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-paperline bg-surface shadow-xl">
            <div className="border-b border-paperline px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink/45">Sesión</p>
              <p className="truncate text-sm font-medium text-ink" title={email ?? undefined}>
                {email ?? 'Cuenta ficticia'}
              </p>
            </div>
            {balance != null && (
              <div className="flex items-center justify-between border-b border-paperline px-4 py-3">
                <span className="text-sm text-ink/60">Saldo ficticio</span>
                <span className="figure text-sm font-semibold text-ink">
                  {balance.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            )}
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink/70 transition-colors hover:bg-paper/60 hover:text-ink"
            >
              Mi cuenta
            </NavLink>
            <button
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-burgundy transition-colors hover:bg-burgundy/10"
            >
              Salir
            </button>
          </div>
        </>
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
