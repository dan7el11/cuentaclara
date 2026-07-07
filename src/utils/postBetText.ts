import type { AnalysisData, MarketStatsPublic, Wallet } from '../types'

// Motor de texto del flujo post-apuesta (SPEC §6/§7). La intensidad afecta
// SOLO el tono de la frase de cierre, nunca los datos. Sin lenguaje alarmista
// ni culposo: la fuerza está en los datos, no en el dramatismo.

export type Intensity = 'soft' | 'medium' | 'strong'

/**
 * Intensidad según el impacto sobre el saldo ficticio.
 * lossRatio = stake / saldoAntes ; debtProximity = saldoDespués / umbralDeuda.
 */
export function intensity(lossRatio: number, debtProximity: number, won: boolean): Intensity {
  if (won) return 'soft'
  if (debtProximity >= 0.85) return 'strong'
  if (lossRatio >= 0.25) return 'strong'
  if (lossRatio >= 0.1) return 'medium'
  return 'soft'
}

/** Calcula la intensidad a partir de la apuesta y el saldo. */
export function intensityFor(
  stake: number,
  result: 'won' | 'lost',
  wallet: Wallet | null
): Intensity {
  if (!wallet || result === 'won') return result === 'won' ? 'soft' : 'medium'
  const balanceBefore = wallet.balance + (result === 'lost' ? stake : 0)
  const lossRatio = balanceBefore > 0 ? stake / balanceBefore : 1
  // debtThreshold suele ser un piso (negativo o bajo): proximidad = cuán cerca está.
  const denom = wallet.debtThreshold || 1
  const debtProximity = denom !== 0 ? wallet.balance / denom : 0
  return intensity(lossRatio, debtProximity, false)
}

type Result = 'won' | 'lost'

function pick(map: Record<Intensity, string>, i: Intensity): string {
  return map[i]
}

/** Pantalla 2 — margen del resultado. */
export function cierreP2(result: Result, i: Intensity, data: AnalysisData): string {
  if (result === 'lost') {
    if (data.minutesNeeded != null && data.minutesNeeded > 120) {
      const base = `Al ritmo del partido, hacían falta ${data.minutesNeeded} minutos para acertar.`
      return pick(
        {
          soft: `${base} No estuvo cerca.`,
          medium: `${base} Nunca estuvo cerca.`,
          strong: `${base} Esto no fue mala suerte: era el resultado esperable.`,
        },
        i
      )
    }
    if (data.unitsShort != null) {
      return pick(
        {
          soft: `Te faltó ${data.unitsShort}. Cerca, pero cerca no cuenta.`,
          medium: `Te faltó ${data.unitsShort}. En las apuestas, casi acertar es perder.`,
          strong: `Te faltó ${data.unitsShort}. El "casi" es exactamente lo que te hace volver a apostar.`,
        },
        i
      )
    }
    return 'Esta apuesta no llegó a estar del lado ganador.'
  }
  if (data.crossedAtMinute != null) {
    return `Hasta el minuto ${data.crossedAtMinute} ibas perdiendo esta apuesta. Acertaste, pero el margen fue chico y dependió de factores que no controlabas.`
  }
  const close = (data.criticalMoments ?? []).filter((m) => m.effect === 'wouldHaveLost').length
  if (close > 0) {
    return `Acertaste, pero hubo ${close} ${close === 1 ? 'momento' : 'momentos'} donde esta apuesta estuvo a punto de caer.`
  }
  return 'Acertaste. Aun así, el margen entre ganar y perder fue más fino de lo que parece.'
}

/** Pantalla 3 — lo que decían los datos. */
export function cierreP3(result: Result, i: Intensity, data: AnalysisData): string {
  const oneInN = data.histProbability ? Math.round(1 / data.histProbability) : null
  if (result === 'lost') {
    if (!oneInN) return 'Los datos previos no favorecían tu apuesta.'
    return pick(
      {
        soft: `El historial decía que esto pasa 1 de cada ${oneInN} veces.`,
        medium: `El historial decía 1 de cada ${oneInN}. Apostaste contra los datos.`,
        strong: `El historial decía 1 de cada ${oneInN}. La información estaba disponible y apuntaba en contra.`,
      },
      i
    )
  }
  if (!oneInN) return 'Acertaste algo que los datos no anticipaban con claridad.'
  const lucky = data.xgVsActual === 'lucky' ? ' Y encima el resultado superó lo que los remates hacían esperar: hubo suerte.' : ''
  return `Acertaste algo que pasa 1 de cada ${oneInN} veces.${lucky}`
}

/** Pantalla 4 — lo que te vendió la cuota. Idéntica en datos para ambos. */
export function cierreP4(result: Result, i: Intensity, data: { houseMargin: number; evPer10: number }): string {
  const margenPct = (data.houseMargin * 100).toFixed(1)
  const ev = Math.abs(data.evPer10).toFixed(2)
  const common = `La casa se garantizaba el ${margenPct}% sin importar el resultado. Por cada $10, el valor esperado es −$${ev}.`
  if (result === 'won') {
    return `${common} Ganaste esta vez, pero apostar a esto 10 veces te deja en pérdida en promedio.`
  }
  return pick(
    {
      soft: common,
      medium: `${common} La cuota nunca estuvo de tu lado.`,
      strong: `${common} La cuota estaba diseñada para que, en promedio, perdieras.`,
    },
    i
  )
}

/** Pantalla 5 — clasificación general (solo %). */
export function cierreP5(result: Result, i: Intensity, market: MarketStatsPublic): string {
  const winPct = Math.round(market.winRate * 100)
  const lossPct = 100 - winPct
  const netPct = Math.abs(Math.round(market.avgNetRatio * 100))
  if (result === 'lost') {
    return pick(
      {
        soft: `El ${lossPct}% de quienes apostaron lo mismo también perdió.`,
        medium: `Estuviste en el ${lossPct}% que perdió. El grupo perdió en promedio el ${netPct}% de lo apostado.`,
        strong: `El ${lossPct}% perdió, igual que vos. Esto no es tu caso particular: es cómo funciona el mercado.`,
      },
      i
    )
  }
  return `Fuiste parte del ${winPct}% que acertó. El ${lossPct}% restante perdió en promedio el ${netPct}% de lo que puso.`
}

/** Pantalla 6 — la conclusión. */
export function cierreP6(result: Result, i: Intensity, repeatProbability: number | null): string {
  const oneInN = repeatProbability ? Math.round(1 / repeatProbability) : null
  if (result === 'won') {
    return `Acertaste. Pero esto se repite 1 de cada ${oneInN ?? '—'} veces. La pregunta no es si predijiste bien, sino cuántas veces podés repetirlo antes de que los números te alcancen.`
  }
  return pick(
    {
      soft: 'No fue mala suerte: era el resultado más probable.',
      medium: 'No fue mala suerte. Los datos, la cuota y el resto de usuarios apuntaban al mismo lado.',
      strong: 'Nada de esto fue azar en tu contra. Es el diseño del sistema funcionando como debe.',
    },
    i
  )
}
