import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-burgundy">{error}</p>}
        <button className="w-full rounded bg-slate py-2 text-sm text-paper hover:bg-slatedark">
          Entrar
        </button>
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

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block text-sm text-ink">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full rounded border border-paperline bg-white px-3 py-2"
      />
    </label>
  )
}
