// Toda esta capa es deliberadamente conservadora: usa rendimientos
// históricos con su volatilidad, no proyecciones optimistas, y siempre
// devuelve el supuesto usado para que se muestre junto al número.

interface OpportunityCostResult {
  futureValue: number
  totalContributed: number
  annualReturnAssumed: number
  years: number
  disclaimer: string
}

/**
 * Estima qué hubiera pasado si, en vez de apostarse, el dinero se hubiera
 * invertido en un fondo indexado amplio (ej. S&P 500 / Nasdaq 100).
 * Usa una tasa histórica nominal conservadora (no la mejor racha posible).
 */
export function estimateOpportunityCost(
  totalContributed: number,
  years: number,
  annualReturnAssumed = 0.08 // ~8% nominal anual, conservador frente al promedio histórico real
): OpportunityCostResult {
  const futureValue = totalContributed * Math.pow(1 + annualReturnAssumed, years)
  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalContributed,
    annualReturnAssumed,
    years,
    disclaimer:
      'Estimación con una tasa histórica conservadora. Rendimiento pasado no garantiza rendimiento futuro; los mercados también pueden caer.',
  }
}

/**
 * Pérdida esperada por el margen de la casa al apostar repetidamente.
 * Si cada dólar apostado pierde, en promedio, la fracción `margin` (overround),
 * apostar un total de `totalWagered` deja una pérdida esperada de
 * totalWagered * margin. No es "mala suerte": es el diseño del juego.
 */
export function expectedLossFromWagering(totalWagered: number, margin = 0.07): number {
  return Math.round(totalWagered * margin * 100) / 100
}

/**
 * Valor futuro de aportes periódicos (anualidad ordinaria). Sirve para
 * comparar "apostar $X por semana" contra "invertir $X por semana".
 */
export function futureValueOfContributions(
  perWeek: number,
  years: number,
  annualReturn = 0.08
): number {
  const n = Math.round(years * 52)
  const r = annualReturn / 52
  if (r === 0) return Math.round(perWeek * n * 100) / 100
  const fv = perWeek * ((Math.pow(1 + r, n) - 1) / r)
  return Math.round(fv * 100) / 100
}

/** Probabilidad implícita que el mercado de apuestas le asigna a un resultado. */
export function impliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 1) return 1
  return 1 / decimalOdds
}

/**
 * Margen de la casa (overround) a partir de TODAS las cuotas del mismo mercado.
 * Ej. 1X2 [2.45, 3.10, 2.90] → 0.076 (7.6%). Equivale a bookmakerMargin pero
 * devuelve el overround completo sin filtrar (espejo de la fórmula del spec).
 */
export function houseMargin(allOdds: number[]): number {
  return allOdds.reduce((a, o) => a + 1 / o, 0) - 1
}

/**
 * Probabilidad real (sin margen): normaliza la probabilidad implícita de una
 * cuota por la suma de implícitas del mercado, quitando el overround.
 */
export function trueProbability(decimalOdds: number, allOdds: number[]): number {
  const raw = 1 / decimalOdds
  const sum = allOdds.reduce((a, o) => a + 1 / o, 0)
  return sum > 0 ? raw / sum : raw
}

/**
 * Valor esperado por cada $1 apostado, usando la probabilidad real.
 * Negativo cuando la cuota incorpora margen. VE por $10 = resultado * 10.
 */
export function expectedValuePerUnit(decimalOdds: number, trueProb: number): number {
  const netWinPerUnit = decimalOdds - 1
  return trueProb * netWinPerUnit - (1 - trueProb)
}

/* ── Poisson: probabilidad histórica de over/under (córners, goles, tarjetas) ── */

function factorial(n: number): number {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

export function poissonPmf(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

/** P(total > umbral). Umbral tipo 9.5 → suma k=0..9 y resta de 1. */
export function probOver(lambda: number, threshold: number): number {
  const floor = Math.floor(threshold)
  let cum = 0
  for (let k = 0; k <= floor; k++) cum += poissonPmf(lambda, k)
  return 1 - cum
}

export function probUnder(lambda: number, threshold: number): number {
  return 1 - probOver(lambda, threshold)
}

/* ── Ritmo y proyección ── */

/** "1 cada N minutos" (o aviso si no hubo ninguno). */
export function ritmoTexto(total: number, minutos = 90): string {
  if (total === 0) return 'no hubo ninguno en todo el partido'
  return `1 cada ${Math.round(minutos / total)} minutos`
}

/** Minutos que harían falta para alcanzar un umbral al ritmo observado. */
export function minutosParaUmbral(total: number, umbral: number, minutos = 90): number {
  if (total === 0) return Infinity
  return Math.round(umbral / (total / minutos))
}

/**
 * xG proxy: estimación de goles esperados cuando el plan no entrega xG real.
 * Coeficientes simplificados estándar de la industria.
 */
export function xgProxy(shotsOnGoal: number, shotsInsideBox: number, shotsTotal: number): number {
  const onGoal = shotsOnGoal * 0.3
  const insideExtra = (shotsInsideBox - shotsOnGoal) * 0.08
  const outsideExtra = (shotsTotal - shotsInsideBox) * 0.03
  return Math.max(0, onGoal + insideExtra + outsideExtra)
}

/** Tasa de conversión de un jugador: goles / disparos. */
export function conversionRate(goals: number, shots: number): number {
  return shots === 0 ? 0 : goals / shots
}

/**
 * Tasa de acierto de equilibrio: el % de aciertos que necesitás para NO
 * perder dinero apostando siempre a esta cuota. Con margen de la casa, la
 * probabilidad real de acertar queda por debajo de este número — por diseño.
 */
export function breakEvenHitRate(decimalOdds: number): number {
  if (decimalOdds <= 1) return 1
  return 1 / decimalOdds
}

/**
 * Probabilidad de estar en GANANCIA neta después de repetir n veces la misma
 * apuesta (misma cuota, mismo monto), con probabilidad real de acierto p.
 * Binomial exacta con recurrencia numéricamente estable: hacen falta más de
 * n/cuota aciertos para que lo cobrado supere lo apostado.
 * Este es el número que explica por qué "recuperarse apostando" falla.
 */
export function probNetPositiveAfterN(decimalOdds: number, p: number, n: number): number {
  if (decimalOdds <= 1 || p <= 0) return 0
  if (p >= 1) return 1
  const kMin = Math.floor(n / decimalOdds) + 1 // aciertos mínimos para ganancia neta
  if (kMin > n) return 0
  // pmf(0) = (1-p)^n; pmf(k+1) = pmf(k) * (n-k)/(k+1) * p/(1-p)
  let pmf = Math.pow(1 - p, n)
  let tail = kMin === 0 ? pmf : 0
  const ratio = p / (1 - p)
  for (let k = 0; k < n; k++) {
    pmf = pmf * ((n - k) / (k + 1)) * ratio
    if (k + 1 >= kMin) tail += pmf
  }
  return Math.min(1, Math.max(0, tail))
}

/**
 * Valor esperado (promedio) de una apuesta dado el margen de la casa.
 * Es negativo: por cada vez que hacés esta apuesta, en promedio perdés
 * `stake * margin`. No depende de si esta vez ganaste o perdiste.
 */
export function expectedValueOfBet(stake: number, margin = 0.07): number {
  return -Math.round(stake * margin * 100) / 100
}

export interface UserBetStats {
  resolved: number
  wins: number
  losses: number
  hitRate: number | null
  totalStaked: number
  totalReturned: number
  net: number
  streak: { type: 'won' | 'lost'; length: number } | null
}

/**
 * Resumen del desempeño real del usuario a partir de sus apuestas resueltas.
 * `bets` debe venir ordenado por fecha (cualquier orden: el streak se calcula
 * sobre las resueltas más recientes).
 */
export function summarizeUserBets(
  bets: { stake: number; potentialPayout: number; status: string; placedAt: number }[]
): UserBetStats {
  const resolved = bets
    .filter((b) => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => b.placedAt - a.placedAt)
  const wins = resolved.filter((b) => b.status === 'won').length
  const losses = resolved.filter((b) => b.status === 'lost').length
  const totalStaked = resolved.reduce((acc, b) => acc + b.stake, 0)
  const totalReturned = resolved.reduce((acc, b) => acc + (b.status === 'won' ? b.potentialPayout : 0), 0)

  let streak: UserBetStats['streak'] = null
  if (resolved.length > 0) {
    const type = resolved[0].status as 'won' | 'lost'
    let length = 0
    for (const b of resolved) {
      if (b.status === type) length++
      else break
    }
    streak = { type, length }
  }

  return {
    resolved: resolved.length,
    wins,
    losses,
    hitRate: resolved.length > 0 ? wins / resolved.length : null,
    totalStaked,
    totalReturned,
    net: Math.round((totalReturned - totalStaked) * 100) / 100,
    streak,
  }
}

/**
 * Probabilidad de que SE REPITA una racha de n aciertos consecutivos,
 * asumiendo independencia y la probabilidad implícita de cada apuesta.
 * Este es el número que se le muestra al usuario que "viene ganando".
 */
export function probabilityOfRepeatingStreak(decimalOddsOfEachBet: number[]): number {
  return decimalOddsOfEachBet.reduce((acc, odds) => acc * impliedProbability(odds), 1)
}

/** Cuota combinada de una apuesta combinada (producto de las cuotas). */
export function combinedOdds(selections: { decimalOdds: number }[]): number {
  return selections.reduce((acc, s) => acc * s.decimalOdds, 1)
}

/**
 * Margen de la casa (overround) de un mercado 1X2: la suma de las
 * probabilidades implícitas de TODOS los resultados es mayor a 100%, y ese
 * excedente es lo que la casa se queda en promedio pase lo que pase. Devuelve
 * la fracción (ej. 0.075 = 7.5%); null si no hay cuotas válidas suficientes.
 */
export function bookmakerMargin(decimalOdds: number[]): number | null {
  const valid = decimalOdds.filter((o) => o > 1)
  if (valid.length < 2) return null
  const overround = valid.reduce((acc, o) => acc + 1 / o, 0)
  return overround - 1
}

/**
 * Tasa de acierto histórica del usuario en apuestas de probabilidad
 * implícita similar (mismo "balde" de cuota), para contextualizar si
 * una victoria fue una racha de suerte fuera de su patrón habitual.
 */
export function historicalHitRateInBucket(
  pastBets: { combinedOdds: number; status: 'won' | 'lost' }[],
  targetOdds: number,
  bucketWidth = 0.5
): { sampleSize: number; hitRate: number | null } {
  const inBucket = pastBets.filter(
    (b) => Math.abs(b.combinedOdds - targetOdds) <= bucketWidth
  )
  if (inBucket.length === 0) return { sampleSize: 0, hitRate: null }
  const wins = inBucket.filter((b) => b.status === 'won').length
  return { sampleSize: inBucket.length, hitRate: wins / inBucket.length }
}
