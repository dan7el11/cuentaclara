// Proxy de cuotas para Netlify Functions usando The Odds API
// (the-odds-api.com). Plan gratuito: 500 peticiones/mes, con cuotas
// reales de casas de apuestas, incluido el Mundial.
//
// La clave vive SOLO acá, como variable de entorno del servidor
// (ODDS_API_KEY en Netlify). Nunca se expone en el navegador. El cliente
// llama a /.netlify/functions/getOdds?sport=... (ver VITE_GETODDS_URL) y
// recibe la forma que ya espera: RawFixtureOdds[].
//
// Modos:
//   ?sport=<key>  -> cuotas 1X2 de esa competición (por defecto el Mundial)
//   ?scores=1     -> resultados de partidos terminados (para resolver apuestas)
//   ?list=1       -> competiciones de fútbol disponibles para tu clave
//   ?debug=1      -> metadatos crudos (cuántos partidos, ejemplo, cuota restante)

const BASE_URL = 'https://api.the-odds-api.com/v4'

type Outcome = 'home' | 'draw' | 'away'

interface RawFixtureOdds {
  fixtureId: string
  label: string
  market: string
  sport: string // clave de la competición (para resolver luego con /scores)
  kickoff: string // hora de inicio en ISO 8601 (commence_time)
  options: { pick: string; decimalOdds: number; outcomeCode: Outcome }[]
}

const cors = { 'Access-Control-Allow-Origin': '*' }

// Caché en memoria del contenedor. Mientras la función esté "caliente",
// varias visitas a la misma competición no gastan peticiones de la API
// (plan gratis = 500/mes). TTL corto: las cuotas no cambian cada segundo.
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { at: number; data: any }>()

/** Resultado (home/draw/away) a partir del marcador de un partido terminado. */
function outcomeFromGame(game: any): Outcome | null {
  if (!game?.completed || !Array.isArray(game.scores)) return null
  const home = game.scores.find((s: any) => s.name === game.home_team)
  const away = game.scores.find((s: any) => s.name === game.away_team)
  if (!home || !away) return null
  const hs = Number(home.score)
  const as = Number(away.score)
  if (Number.isNaN(hs) || Number.isNaN(as)) return null
  return hs > as ? 'home' : as > hs ? 'away' : 'draw'
}

export default async (req: Request) => {
  const key = process.env.ODDS_API_KEY
  if (!key) {
    return Response.json(
      { error: 'Falta la variable ODDS_API_KEY en el servidor de Netlify.' },
      { status: 500, headers: cors }
    )
  }

  const params = new URL(req.url).searchParams

  // ?list=1 -> devuelve las competiciones de fútbol activas para tu clave,
  // para encontrar la clave exacta de cada liga (sport_key).
  if (params.get('list') === '1') {
    const res = await fetch(`${BASE_URL}/sports/?apiKey=${key}`)
    if (!res.ok) {
      return Response.json(
        { error: `The Odds API respondió ${res.status}`, body: await res.text() },
        { status: res.status, headers: cors }
      )
    }
    const all: any[] = await res.json()
    const soccer = all
      .filter((s) => String(s.group).toLowerCase() === 'soccer')
      .map((s) => ({ key: s.key, title: s.title, active: s.active }))
    return Response.json(soccer, { headers: cors })
  }

  // ?scores=1 -> resultados de partidos terminados (últimos 3 días) para
  // resolver apuestas. Devuelve solo los que ya tienen un ganador calculable.
  if (params.get('scores') === '1') {
    const sport = params.get('sport') ?? 'soccer_fifa_world_cup'
    const cacheKey = `scores|${sport}`
    const hit = cache.get(cacheKey)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return Response.json(hit.data, {
        headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' },
      })
    }
    const res = await fetch(`${BASE_URL}/sports/${sport}/scores/?apiKey=${key}&daysFrom=3`)
    if (!res.ok) {
      return Response.json(
        { error: `The Odds API respondió ${res.status}`, body: await res.text() },
        { status: res.status, headers: cors }
      )
    }
    const games: any[] = await res.json()
    const results = games
      .map((g) => ({ fixtureId: String(g.id ?? ''), outcome: outcomeFromGame(g) }))
      .filter((r): r is { fixtureId: string; outcome: Outcome } => r.outcome !== null)
    cache.set(cacheKey, { at: Date.now(), data: results })
    return Response.json(results, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' },
    })
  }

  // Competición a consultar. Por defecto, el Mundial.
  const sport = params.get('sport') ?? 'soccer_fifa_world_cup'
  const regions = params.get('regions') ?? 'eu'
  const url = `${BASE_URL}/sports/${sport}/odds/?apiKey=${key}&regions=${regions}&markets=h2h&oddsFormat=decimal`

  // Servir desde caché si está fresca, sin gastar peticiones de la API.
  const cacheKey = `${sport}|${regions}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS && params.get('debug') !== '1') {
    return Response.json(hit.data, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' },
    })
  }

  try {
    const apiRes = await fetch(url)
    if (!apiRes.ok) {
      return Response.json(
        { error: `The Odds API respondió ${apiRes.status}`, body: await apiRes.text() },
        { status: apiRes.status, headers: cors }
      )
    }
    const events: any[] = await apiRes.json()

    if (params.get('debug') === '1') {
      return Response.json(
        {
          count: events.length,
          requestsRemaining: apiRes.headers.get('x-requests-remaining'),
          requestsUsed: apiRes.headers.get('x-requests-used'),
          sample: events[0] ?? null,
        },
        { headers: cors }
      )
    }

    const fixtures: RawFixtureOdds[] = events.map((ev) => {
      const home = ev.home_team ?? '?'
      const away = ev.away_team ?? '?'
      // Tomamos el primer bookmaker con mercado h2h (1X2).
      const h2h = ev.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h')
      const outcomes: any[] = h2h?.outcomes ?? []

      const optionFor = (code: Outcome) => {
        const name = code === 'home' ? home : code === 'away' ? away : 'Draw'
        const o = outcomes.find((x) => x.name === name)
        if (!o) return null
        const pick = code === 'home' ? `${home} gana` : code === 'away' ? `${away} gana` : 'Empate'
        return { pick, decimalOdds: Number(o.price), outcomeCode: code }
      }

      // Orden fijo 1 / X / 2.
      const options = (['home', 'draw', 'away'] as Outcome[])
        .map(optionFor)
        .filter((o): o is NonNullable<typeof o> => o !== null)

      return {
        fixtureId: String(ev.id ?? ''),
        label: `${home} vs. ${away}`,
        market: '1X2',
        sport,
        kickoff: String(ev.commence_time ?? ''),
        options,
      }
    })

    // Ordenar por hora de inicio (el primero será el destacado en el cliente).
    fixtures.sort((a, b) => a.kickoff.localeCompare(b.kickoff))

    cache.set(cacheKey, { at: Date.now(), data: fixtures })
    return Response.json(fixtures, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' },
    })
  } catch (err) {
    return Response.json({ error: 'Error al consultar cuotas' }, { status: 500, headers: cors })
  }
}
