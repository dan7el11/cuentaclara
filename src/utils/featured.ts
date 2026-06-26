import type { RawFixtureOdds } from '../services/oddsApi'

// Ventana típica de un partido de fútbol (90' + descanso + descuento + colchón).
const MATCH_WINDOW_MS = 2.5 * 60 * 60 * 1000

/**
 * Heurística de "en vivo": el partido ya arrancó (kickoff en el pasado) y aún
 * está dentro de la ventana de duración. Es una aproximación a partir del
 * horario de inicio — no un feed en vivo real. Cuando el backend exponga el
 * estado/minuto del partido, reemplazá esta función por ese dato.
 */
export function isLive(fixture: Pick<RawFixtureOdds, 'kickoff'>, now: number = Date.now()): boolean {
  if (!fixture.kickoff) return false
  const t = new Date(fixture.kickoff).getTime()
  if (Number.isNaN(t)) return false
  const elapsed = now - t
  return elapsed >= 0 && elapsed <= MATCH_WINDOW_MS
}

// Equipos/selecciones de alto interés general. Sirve para estimar qué partido
// atrae más atención (no es ranking oficial; es una lista curada editable).
const MARQUEE = [
  // Selecciones
  'brasil', 'brazil', 'argentina', 'españa', 'spain', 'francia', 'france',
  'inglaterra', 'england', 'alemania', 'germany', 'portugal', 'italia', 'italy',
  'países bajos', 'netherlands', 'holanda', 'uruguay', 'méxico', 'mexico',
  'estados unidos', 'usa', 'ecuador', 'colombia', 'croacia', 'croatia', 'bélgica', 'belgium',
  // Clubes
  'real madrid', 'barcelona', 'barça', 'manchester city', 'man city',
  'manchester united', 'man utd', 'man united', 'liverpool', 'chelsea', 'arsenal',
  'tottenham', 'bayern', 'borussia dortmund', 'dortmund', 'psg', 'paris',
  'juventus', 'inter', 'milan', 'napoli', 'atlético', 'atletico', 'atlético de madrid',
  'boca', 'river', 'flamengo', 'palmeiras',
]

/** Cuántos equipos "grandes" hay en el rótulo del partido (0, 1 o 2+). */
function prominence(label: string): number {
  const l = label.toLowerCase()
  let n = 0
  for (const name of MARQUEE) if (l.includes(name)) n++
  return n
}

/** Qué tan parejo es el 1X2: cuanto menor la diferencia entre las dos cuotas
 *  más probables, más competitivo (y más atractivo) se percibe. */
function competitiveness(fixture: RawFixtureOdds): number {
  const odds = fixture.options.map((o) => o.decimalOdds).filter((o) => o > 1).sort((a, b) => a - b)
  if (odds.length < 2) return 0
  const gap = odds[1] - odds[0]
  return 1 / (1 + gap)
}

/**
 * Puntaje de atención de un partido: prioriza equipos grandes, partidos
 * parejos y, sobre todo, los que están en vivo en este momento.
 */
export function attentionScore(fixture: RawFixtureOdds, now: number = Date.now()): number {
  return prominence(fixture.label) * 10 + competitiveness(fixture) * 2 + (isLive(fixture, now) ? 6 : 0)
}

/**
 * Elige el partido destacado por relevancia (no por ser el próximo): el de
 * mayor puntaje de atención. Si hay empate, queda el de kickoff más cercano.
 */
export function pickFeatured(fixtures: RawFixtureOdds[], now: number = Date.now()): RawFixtureOdds | undefined {
  if (fixtures.length === 0) return undefined
  return [...fixtures].sort((a, b) => {
    const d = attentionScore(b, now) - attentionScore(a, now)
    if (d !== 0) return d
    const ta = a.kickoff ? new Date(a.kickoff).getTime() : Infinity
    const tb = b.kickoff ? new Date(b.kickoff).getTime() : Infinity
    return ta - tb
  })[0]
}
