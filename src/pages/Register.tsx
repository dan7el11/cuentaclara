import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [startingBalance, setStartingBalance] = useState(100)
  const [debtThreshold, setDebtThreshold] = useState(50)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await register(email, password, startingBalance, debtThreshold)
      navigate('/')
    } catch {
      setError('No pudimos crear la cuenta. Revisá el email y la contraseña.')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-2xl text-ink">Crear cuenta ficticia</h1>
      <p className="mt-1 text-sm text-ink/60">
        Nada de esto es dinero real. Lo único que pedimos de verdad es que definas
        ahora, en frío, cuándo querés que te frenemos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm text-ink">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-paperline bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm text-ink">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded border border-paperline bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm text-ink">
          Saldo ficticio inicial (simulá lo que pondrías de verdad)
          <input
            type="number"
            min={1}
            value={startingBalance}
            onChange={(e) => setStartingBalance(Number(e.target.value))}
            className="figure mt-1 w-full rounded border border-paperline bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm text-ink">
          Frenarme cuando la pérdida simulada llegue a
          <input
            type="number"
            min={1}
            value={debtThreshold}
            onChange={(e) => setDebtThreshold(Number(e.target.value))}
            className="figure mt-1 w-full rounded border border-paperline bg-white px-3 py-2"
          />
          <span className="mt-1 block text-xs text-ink/50">
            Este número activa la pantalla que no se puede saltar sin reconocerla.
          </span>
        </label>

        {error && <p className="text-sm text-burgundy">{error}</p>}

        <button className="w-full rounded bg-slate py-2 text-sm text-paper hover:bg-slatedark">
          Crear cuenta
        </button>
      </form>
    </div>
  )
}
