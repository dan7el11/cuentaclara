import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('No pudimos iniciar sesión con esos datos.')
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-serif text-2xl text-ink">Entrar a tu cuenta</h1>
      <p className="mt-1 text-sm text-ink/60">
        Esta cuenta usa dinero ficticio. El login es el de siempre: email y contraseña.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-burgundy">{error}</p>}
        <Button type="submit" fullWidth>
          Entrar
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink/60">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="text-slate underline">
          Creá una
        </Link>
      </p>
    </div>
  )
}
