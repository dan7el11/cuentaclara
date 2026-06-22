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

/** Probabilidad implícita que el mercado de apuestas le asigna a un resultado. */
export function impliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 1) return 1
  return 1 / decimalOdds
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
