import { doc, setDoc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

/** Clave de día en hora local: "2026-06-23". */
function dayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Registra que el usuario abrió la app hoy. Mantiene, en `users/{uid}`:
 *  - currentStreak / longestStreak: racha de días consecutivos (estilo
 *    Duolingo) — NO se muestra al usuario; es un dato de análisis de riesgo
 *    (entrar demasiados días seguidos puede señalar mayor riesgo de pasar a
 *    apuestas reales).
 *  - lastActiveDate / lastActiveAt / totalActiveDays.
 *
 * Y escribe un documento idempotente en `dailyActive/{fecha}_{uid}` para
 * poder contar usuarios activos por día (DAU) sin duplicar.
 */
export async function recordDailyActivity(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  const today = dayKey()
  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000))

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const data = (snap.exists() ? snap.data() : {}) as {
      lastActiveDate?: string
      currentStreak?: number
      longestStreak?: number
      totalActiveDays?: number
    }

    // Ya contado hoy: solo refrescamos la marca de tiempo.
    if (data.lastActiveDate === today) {
      tx.set(ref, { lastActiveAt: Date.now() }, { merge: true })
      return
    }

    const prevStreak = data.currentStreak ?? 0
    const newStreak = data.lastActiveDate === yesterday ? prevStreak + 1 : 1
    const longestStreak = Math.max(data.longestStreak ?? 0, newStreak)

    tx.set(
      ref,
      {
        uid,
        lastActiveDate: today,
        lastActiveAt: Date.now(),
        currentStreak: newStreak,
        longestStreak,
        totalActiveDays: (data.totalActiveDays ?? 0) + 1,
      },
      { merge: true }
    )
  })

  // DAU: un doc por (día, usuario). Contarlos = usuarios activos ese día.
  await setDoc(
    doc(db, 'dailyActive', `${today}_${uid}`),
    { uid, date: today, at: Date.now() },
    { merge: true }
  )
}
