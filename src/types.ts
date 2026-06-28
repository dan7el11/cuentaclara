import type { estimateOpportunityCost } from './utils/financialMath'

// Modelo de datos central. Todo lo que tenga "Fake" o "ficticio" en su
// descripción debe quedar visualmente marcado como tal en cualquier
// pantalla que lo muestre — eso es una regla de producto, no solo de tipos.

export interface Wallet {
  uid: string
  balance: number // saldo ficticio, puede ser negativo ("deuda" simulada)
  totalStaked: number // suma histórica de todo lo apostado
  totalLost: number // suma histórica de pérdidas netas (si el saldo cae)
  totalWon: number // suma histórica de ganancias netas
  debtThreshold: number // umbral negativo definido por el usuario al crear la cuenta
  createdAt: number
}

export type BetStatus = 'pending' | 'won' | 'lost' | 'void'

export interface BetSelection {
  fixtureId: string
  fixtureLabel: string // ej. "Ecuador vs. Senegal"
  sport?: string // competición (clave The Odds API), para consultar el resultado real
  marketKey: string // 'h2h' | 'totals' | 'btts' | 'double_chance' | 'spreads'
  marketLabel: string // ej. "Resultado (1X2)", "Más / Menos goles"
  selectionCode: string // home|draw|away|over|under|yes|no|1X|12|X2
  selectionLabel: string // ej. "Más de 2.5 goles" (lo que ve el usuario)
  point?: number // línea, para totals/spreads
  decimalOdds: number // cuota decimal tal cual la entrega la API
}

export interface Bet {
  id: string
  uid: string
  selections: BetSelection[] // 1 selección = simple, 2+ = combinada
  stake: number
  combinedOdds: number // producto de las cuotas de cada selección
  impliedProbability: number // 1 / combinedOdds, calculada al momento de apostar
  potentialPayout: number
  status: BetStatus
  placedAt: number
  resolvedAt?: number
  // Campos desnormalizados para análisis (Firestore array-contains):
  // permiten contar apuestas por partido y por mercado sin recorrer la
  // matriz de selecciones.
  fixtureIds?: string[] // ids de los partidos involucrados
  markets?: string[] // mercados involucrados (ej. "1X2", "Over/Under 2.5")
  // Flujo de análisis post-apuesta (ver SPEC). Se llenan en el backend al
  // liquidar; el cliente degrada con lo computable si todavía no existen.
  analysisSeen?: boolean // false al resolverse, true tras recorrer las 6 pantallas
  analysisData?: AnalysisData
}

/** Momento del partido que pudo cambiar el resultado de la apuesta. */
export interface CriticalMoment {
  minute: number
  type:
    | 'post'
    | 'savedShot'
    | 'var'
    | 'penalty'
    | 'missedPenalty'
    | 'offsideGoal'
    | 'substitution'
    | 'redCard'
  team: 'home' | 'away'
  player?: string
  description: string
  effect: 'wouldHaveWon' | 'wouldHaveLost' | 'neutral'
}

/**
 * Datos de análisis que el backend calcula al liquidar la apuesta (SPEC §4).
 * Todos opcionales: el cliente muestra lo que haya y degrada el resto.
 */
export interface AnalysisData {
  // P1 — datos del partido
  finalScore?: string
  scoreTimeline?: { minute: number; home: number; away: number }[]
  marketTotals?: {
    corners?: { home: number; away: number; total: number }
    cards?: { home: number; away: number; total: number }
    goals?: { home: number; away: number; total: number }
    possession?: { home: number; away: number }
    shotsOnGoal?: { home: number; away: number }
  }
  xgHome?: number
  xgAway?: number
  xgIsProxy?: boolean

  // P2 — margen del resultado
  unitsShort?: number | null
  crossedAtMinute?: number | null
  paceText?: string
  minutesNeeded?: number | null
  criticalMoments?: CriticalMoment[]

  // P3 — lo que decían los datos
  histAvgHome?: number | null
  histAvgAway?: number | null
  histProbability?: number | null
  playerConversionMatch?: number | null
  playerConversionHist?: number | null
  xgVsActual?: 'lucky' | 'unlucky' | 'expected' | null

  // P4 — lo que vendió la cuota
  impliedProb?: number
  trueProb?: number
  houseMargin?: number
  evPer10?: number
  cuotaVsRealGap?: number

  // P6 — conclusión
  repeatProbability?: number
  opportunity1y?: number
  opportunity5y?: number
  opportunity10y?: number
}

/** Agregados de usuarios expuestos al cliente — SOLO porcentajes (SPEC §5). */
export interface MarketStatsPublic {
  winRate: number
  avgNetRatio: number
  bookieImplied: number
  histProbability: number | null
}

export interface Transaction {
  id: string
  uid: string
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'bet_void' | 'deposit_sim'
  amount: number // positivo o negativo según el tipo
  balanceAfter: number
  betId?: string
  createdAt: number
}

export interface MonthlyStatement {
  uid: string
  month: string // "2026-06"
  totalStaked: number
  totalWon: number
  totalLost: number
  netResult: number
  closingBalance: number
  opportunityCost: ReturnType<typeof estimateOpportunityCost> | null
}

export interface VirtualCardData {
  uid: string
  brand: string // marca ficticia de la plataforma, nunca una marca real
  holderName: string
  maskedNumber: string // solo para mostrar, nunca se usa para autenticar
  expiry: string
}
