import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  register: (email: string, password: string, startingBalance: number, debtThreshold: number) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function register(
    email: string,
    password: string,
    startingBalance: number,
    debtThreshold: number
  ) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    // Billetera ficticia inicial. El umbral de deuda lo fija el propio
    // usuario en el registro: es el disparador de la intervención fuerte
    // (Capa 5 de los recordatorios), así que conviene pedirlo con contexto
    // ("¿a partir de qué pérdida simulada querés que te frenemos?").
    await setDoc(doc(db, 'wallets', cred.user.uid), {
      uid: cred.user.uid,
      balance: startingBalance,
      totalStaked: 0,
      totalLost: 0,
      totalWon: 0,
      debtThreshold: -Math.abs(debtThreshold),
      createdAt: Date.now(),
    })

    // Tarjeta ficticia decorativa — nunca se usa para autenticar, solo
    // se referencia en el dashboard y en el estado de cuenta.
    await setDoc(doc(db, 'cards', cred.user.uid), {
      uid: cred.user.uid,
      brand: 'Tarjeta NoBetter',
      holderName: email.split('@')[0].toUpperCase(),
      maskedNumber: `0000 •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
      expiry: '00/00 (ficticia)',
      createdAt: serverTimestamp(),
    })
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
