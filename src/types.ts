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
  market: string // ej. "1X2", "Doble oportunidad"
  pick: string // ej. "Ecuador gana"
  decimalOdds: number // cuota decimal tal cual la entrega la API
  outcomeCode: 'home' | 'draw' | 'away' // usado por la Cloud Function para resolver sola
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
}

export interface Transaction {
  id: string
  uid: string
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'deposit_sim'
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
