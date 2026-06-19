// Proxy de cuotas para Netlify Functions.
//
// La clave de API-Football vive SOLO acá, como variable de entorno del
// servidor (APIFOOTBALL_KEY en Netlify > Site settings > Environment
// variables). Nunca se expone en el navegador. El cliente llama a
// /.netlify/functions/getOdds (ver VITE_GETODDS_URL) en vez de a
// API-Football directamente.
//
// Devuelve la misma forma que ya espera el cliente: RawFixtureOdds[].

const BASE_URL = 'https://v3.football.api-sports.io'

type Outcome = 'home' | 'draw' | 'away'

interface RawFixtureOdds {
  fixtureId: string
  label: string
  market: string
  options: { pick: string; decimalOdds: number; outcomeCode: Outcome }[]
}

export default async (req: Request) => {
  const key = process.env.APIFOOTBALL_KEY
  if (!key) {
    return Response.json(
      { error: 'Falta la variable APIFOOTBALL_KEY en el servidor de Netlify.' },
      { status: 500 }
    )
  }

  const params = new URL(req.url).searchParams
  const league = params.get('league') ?? undefined
  // Por defecto 2024: el endpoint /odds de API-Football solo trae cuotas de
  // temporadas/ligas cubiertas por tu plan. Pasá ?season=AAAA para cambiarla.
  const season = params.get('season') ?? '2024'
  const url = `${BASE_URL}/odds?${league ? `league=${league}&` : ''}season=${season}`

  try {
    const apiRes = await fetch(url, { headers: { 'x-apisports-key': key } })
    if (!apiRes.ok) {
      return Response.json(
        { error: `API-Football respondió ${apiRes.status}` },
        { status: apiRes.status }
      )
    }
    const json: any = await apiRes.json()

    const toOutcome = (label: string): Outcome | null => {
      const l = String(label).toLowerCase()
      if (l === 'home') return 'home'
      if (l === 'draw') return 'draw'
      if (l === 'away') return 'away'
      return null
    }

    // Mapeo a RawFixtureOdds[]. Asume bookmakers[0].bets[0]; ajustalo si la
    // respuesta real de tu plan tiene otra forma.
    const fixtures: RawFixtureOdds[] = (json.response ?? []).map((item: any) => {
      const values = item.bookmakers?.[0]?.bets?.[0]?.values ?? []
      return {
        fixtureId: String(item.fixture?.id ?? ''),
        label: `${item.teams?.home?.name ?? '?'} vs. ${item.teams?.away?.name ?? '?'}`,
        market: '1X2',
        options: values
          .map((v: any) => ({
            pick: v.value,
            decimalOdds: parseFloat(v.odd),
            outcomeCode: toOutcome(v.value),
          }))
          .filter((o: any) => o.outcomeCode !== null),
      }
    })

    return Response.json(fixtures, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return Response.json({ error: 'Error al consultar cuotas' }, { status: 500 })
  }
}
