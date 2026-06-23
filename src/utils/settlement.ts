// Liquidación de apuestas a partir del marcador final, para cualquiera de los
// mercados soportados. Se usa tanto en el cliente como (replicado) en el cron
// del servidor. "void" = empate de la apuesta contra la línea → se devuelve lo
// apostado (no es ni ganada ni perdida).

export type LegResult = 'won' | 'lost' | 'void'

export interface FixtureScore {
  fixtureId: string
  homeScore: number
  awayScore: number
}

/** Liquida una sola selección contra el marcador (h = local, a = visitante). */
export function settleSelection(
  marketKey: string,
  code: string,
  point: number | undefined,
  h: number,
  a: number
): LegResult {
  const total = h + a
  switch (marketKey) {
    case 'h2h': {
      const winner = h > a ? 'home' : a > h ? 'away' : 'draw'
      return code === winner ? 'won' : 'lost'
    }
    case 'double_chance': {
      if (code === '1X') return h >= a ? 'won' : 'lost'
      if (code === '12') return h !== a ? 'won' : 'lost'
      if (code === 'X2') return a >= h ? 'won' : 'lost'
      return 'lost'
    }
    case 'totals': {
      if (point == null) return 'lost'
      if (total === point) return 'void'
      if (code === 'over') return total > point ? 'won' : 'lost'
      return total < point ? 'won' : 'lost'
    }
    case 'btts': {
      const both = h > 0 && a > 0
      return code === 'yes' ? (both ? 'won' : 'lost') : both ? 'lost' : 'won'
    }
    case 'spreads': {
      if (point == null) return 'lost'
      const adjusted = (code === 'home' ? h : a) + point
      const other = code === 'home' ? a : h
      if (adjusted === other) return 'void'
      return adjusted > other ? 'won' : 'lost'
    }
    default:
      return 'lost'
  }
}

export interface SettleableLeg {
  fixtureId: string
  marketKey?: string
  selectionCode?: string
  point?: number
  // Compatibilidad con apuestas guardadas con el modelo anterior (1X2).
  outcomeCode?: string
}

/**
 * Liquida una apuesta (simple o combinada) contra los marcadores conocidos.
 * Devuelve null si a alguna selección todavía le falta el resultado.
 * Reglas de combinada: si una pata pierde, pierde todo; si todas ganan, gana;
 * si ninguna pierde pero hay alguna anulada (void), se anula (se devuelve lo
 * apostado).
 */
export function settleBet(
  legs: SettleableLeg[],
  scoresByFixture: Map<string, FixtureScore>
): LegResult | null {
  const results: LegResult[] = []
  for (const leg of legs) {
    const s = scoresByFixture.get(leg.fixtureId)
    if (!s) return null
    const marketKey = leg.marketKey ?? 'h2h' // apuestas viejas eran 1X2
    const code = leg.selectionCode ?? leg.outcomeCode ?? ''
    results.push(settleSelection(marketKey, code, leg.point, s.homeScore, s.awayScore))
  }
  if (results.length === 0) return null
  if (results.some((r) => r === 'lost')) return 'lost'
  if (results.every((r) => r === 'won')) return 'won'
  return 'void'
}
