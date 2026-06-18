import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Apuestas from './pages/Apuestas'
import Educacion from './pages/Educacion'
import Apoyo from './pages/Apoyo'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <p className="p-8 text-ink/60">Cargando…</p>

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <Routes>
          <Route path="/registro" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/apuestas" element={<Apuestas />} />
        <Route path="/educacion" element={<Educacion />} />
        <Route path="/apoyo" element={<Apoyo />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
