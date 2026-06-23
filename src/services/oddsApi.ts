import type { BetSelection } from '../types'
import type { FixtureScore } from '../utils/settlement'

// La clave de The Odds API vive como secreto del servidor (función Netlify
// getOdds). El cliente solo conoce la URL pública, vía VITE_GETODDS_URL.
const GET_ODDS_URL = import.meta.env.VITE_GETODDS_URL as string | undefined

// Lista / destacado: solo 1X2 (una superficie liviana).
export interface RawFixtureOdds {
  fixtureId: string
  label: string
  market: string
  sport?: string
  kickoff?: string
  options: { pick: string; decimalOdds: number; outcomeCode: 'home' | 'draw' | 'away' }[]
}

// Detalle de un partido: todos los mercados disponibles.
export interface MarketSelectionDTO {
  selectionCode: string
  label: string
  point?: number
  decimalOdds: number
}
export interface DetailMarket {
  key: string
  label: string
  selections: MarketSelectionDTO[]
}
export interface FixtureDetail {
  fixtureId: string
  label: string
  sport: string
  kickoff: string
  home: string
  away: string
  markets: DetailMarket[]
}

// Datos de respaldo para desarrollar sin backend desplegado (modo demo).
const MOCK_FIXTURES: RawFixtureOdds[] = [
  {
    fixtureId: 'mock-1',
    label: 'Ecuador vs. Senegal',
    market: '1X2',
    options: [
      { pick: 'Ecuador gana', decimalOdds: 2.45, outcomeCode: 'home' },
      { pick: 'Empate', decimalOdds: 3.1, outcomeCode: 'draw' },
      { pick: 'Senegal gana', decimalOdds: 2.9, outcomeCode: 'away' },
    ],
  },
  {
    fixtureId: 'mock-2',
    label: 'Brasil vs. Argentina',
    market: '1X2',
    options: [
      { pick: 'Brasil gana', decimalOdds: 2.2, outcomeCode: 'home' },
      { pick: 'Empate', decimalOdds: 3.3, outcomeCode: 'draw' },
      { pick: 'Argentina gana', decimalOdds: 3.0, outcomeCode: 'away' },
    ],
  },
]

/** Cuotas 1X2 de los próximos partidos de una competición. */
export async function fetchUpcomingOdds(sport?: string): Promise<RawFixtureOdds[]> {
  if (!GET_ODDS_URL) return MOCK_FIXTURES
  const query = sport ? `?sport=${encodeURIComponent(sport)}` : ''
  const res = await fetch(`${GET_ODDS_URL}${query}`)
  if (!res.ok) throw new Error(`No se pudieron obtener las cuotas (status ${res.status})`)
  return (await res.json()) as RawFixtureOdds[]
}

/** Todos los mercados de un partido (página de detalle). */
export async function fetchFixtureDetail(sport: string, fixtureId: string): Promise<FixtureDetail> {
  if (!GET_ODDS_URL) throw new Error('Detalle no disponible en modo demo')
  const res = await fetch(
    `${GET_ODDS_URL}?event=${encodeURIComponent(fixtureId)}&sport=${encodeURIComponent(sport)}`
  )
  if (!res.ok) throw new Error(`No se pudo obtener el partido (status ${res.status})`)
  return (await res.json()) as FixtureDetail
}

/**
 * Marcadores de partidos terminados, para resolver apuestas pendientes.
 * Sin backend configurado no hay resultados reales que consultar.
 */
export async function fetchScores(sport: string): Promise<FixtureScore[]> {
  if (!GET_ODDS_URL) return []
  const res = await fetch(`${GET_ODDS_URL}?scores=1&sport=${encodeURIComponent(sport)}`)
  if (!res.ok) throw new Error(`No se pudieron obtener resultados (status ${res.status})`)
  return (await res.json()) as FixtureScore[]
}

/** Identidad estable de una selección (para alternarla en el boleto). */
export function selectionKey(s: {
  fixtureId: string
  marketKey: string
  selectionCode: string
  point?: number
}): string {
  return `${s.fixtureId}|${s.marketKey}|${s.selectionCode}|${s.point ?? ''}`
}

/** Selección 1X2 desde la lista/destacado. */
export function toBetSelection(
  fixture: RawFixtureOdds,
  option: RawFixtureOdds['options'][number]
): BetSelection {
  return {
    fixtureId: fixture.fixtureId,
    fixtureLabel: fixture.label,
    sport: fixture.sport,
    marketKey: 'h2h',
    marketLabel: 'Resultado (1X2)',
    selectionCode: option.outcomeCode,
    selectionLabel: option.pick,
    decimalOdds: option.decimalOdds,
  }
}

/** Selección desde la página de detalle (cualquier mercado). */
export function toDetailSelection(
  detail: FixtureDetail,
  market: DetailMarket,
  sel: MarketSelectionDTO
): BetSelection {
  return {
    fixtureId: detail.fixtureId,
    fixtureLabel: detail.label,
    sport: detail.sport,
    marketKey: market.key,
    marketLabel: market.label,
    selectionCode: sel.selectionCode,
    selectionLabel: sel.label,
    point: sel.point,
    decimalOdds: sel.decimalOdds,
  }
}
