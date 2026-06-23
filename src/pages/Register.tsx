import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

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
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          label="Saldo ficticio inicial (simulá lo que pondrías de verdad)"
          type="number"
          mono
          min={1}
          value={startingBalance}
          onChange={(e) => setStartingBalance(Number(e.target.value))}
        />
        <div>
          <Input
            label="Frenarme cuando la pérdida simulada llegue a"
            type="number"
            mono
            min={1}
            value={debtThreshold}
            onChange={(e) => setDebtThreshold(Number(e.target.value))}
          />
          <span className="mt-1 block text-xs text-ink/50">
            Este número activa la pantalla que no se puede saltar sin reconocerla.
          </span>
        </div>

        {error && <p className="text-sm text-burgundy">{error}</p>}

        <Button type="submit" fullWidth>
          Crear cuenta
        </Button>
      </form>
    </div>
  )
}
