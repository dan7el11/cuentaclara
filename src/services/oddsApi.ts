import type { BetSelection } from '../types'

// La clave de API-Football ya NO vive en el cliente: vive como secreto de
// la Cloud Function `getOdds` (ver /functions). El cliente solo conoce la
// URL pública de esa función, vía VITE_GETODDS_URL.
const GET_ODDS_URL = import.meta.env.VITE_GETODDS_URL as string | undefined

export interface RawFixtureOdds {
  fixtureId: string
  label: string
  market: string
  options: { pick: string; decimalOdds: number; outcomeCode: 'home' | 'draw' | 'away' }[]
}

// Datos de respaldo para poder desarrollar y probar la interfaz sin
// desplegar todavía la Cloud Function. Estos fixtures de ejemplo NO se
// pueden resolver automáticamente (no existen en API-Football) — están
// pensados para probar el flujo manual de "simular que ganó/perdió" en
// Apuestas.tsx, no la resolución automática del backend.
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

/**
 * Devuelve las cuotas disponibles. Si VITE_GETODDS_URL está configurada,
 * llama a tu propia Cloud Function (que a su vez llama a API-Football con
 * la clave guardada como secreto). Si no, usa los fixtures de ejemplo.
 */
export async function fetchUpcomingOdds(sport?: string): Promise<RawFixtureOdds[]> {
  if (!GET_ODDS_URL) {
    return MOCK_FIXTURES
  }

  const query = sport ? `?sport=${encodeURIComponent(sport)}` : ''
  const url = `${GET_ODDS_URL}${query}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`No se pudieron obtener las cuotas (status ${res.status})`)
  }
  return (await res.json()) as RawFixtureOdds[]
}

export function toBetSelection(
  fixture: RawFixtureOdds,
  option: RawFixtureOdds['options'][number]
): BetSelection {
  return {
    fixtureId: fixture.fixtureId,
    fixtureLabel: fixture.label,
    market: fixture.market,
    pick: option.pick,
    decimalOdds: option.decimalOdds,
    outcomeCode: option.outcomeCode,
  }
}
