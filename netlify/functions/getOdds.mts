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

// Mercados que pedimos para el detalle de un partido. Cada uno cuesta ~1
// petición por región, así que el detalle se cachea (ver CACHE_TTL_MS).
const DETAIL_MARKETS = 'h2h,totals,btts,double_chance,spreads'

interface MarketSelection {
  selectionCode: string // home|draw|away|over|under|yes|no|1X|12|X2
  label: string
  point?: number
  decimalOdds: number
}
interface DetailMarket {
  key: string
  label: string
  selections: MarketSelection[]
}

/** Primer bookmaker que tenga el mercado pedido. */
function findMarket(ev: any, key: string): any | null {
  for (const bk of ev.bookmakers ?? []) {
    const m = (bk.markets ?? []).find((mm: any) => mm.key === key)
    if (m) return m
  }
  return null
}

/** Construye los mercados normalizados de un evento para el detalle. */
function buildDetailMarkets(ev: any, home: string, away: string): DetailMarket[] {
  const out: DetailMarket[] = []

  const h2h = findMarket(ev, 'h2h')
  if (h2h) {
    const sel: MarketSelection[] = []
    for (const code of ['home', 'draw', 'away']) {
      const name = code === 'home' ? home : code === 'away' ? away : 'Draw'
      const o = (h2h.outcomes ?? []).find((x: any) => x.name === name)
      if (o) {
        sel.push({
          selectionCode: code,
          label: code === 'home' ? `${home} gana` : code === 'away' ? `${away} gana` : 'Empate',
          decimalOdds: Number(o.price),
        })
      }
    }
    if (sel.length) out.push({ key: 'h2h', label: 'Resultado (1X2)', selections: sel })
  }

  const dc = findMarket(ev, 'double_chance')
  if (dc) {
    const sel: MarketSelection[] = []
    for (const o of dc.outcomes ?? []) {
      const n: string = o.name ?? ''
      const hasHome = n.includes(home)
      const hasAway = n.includes(away)
      const hasDraw = n.toLowerCase().includes('draw')
      let code: string | null = null
      let label = ''
      if (hasHome && hasDraw) (code = '1X'), (label = `${home} o empate`)
      else if (hasHome && hasAway) (code = '12'), (label = 'Cualquiera gana (no empate)')
      else if (hasDraw && hasAway) (code = 'X2'), (label = `${away} o empate`)
      if (code) sel.push({ selectionCode: code, label, decimalOdds: Number(o.price) })
    }
    if (sel.length) out.push({ key: 'double_chance', label: 'Doble oportunidad', selections: sel })
  }

  const totals = findMarket(ev, 'totals')
  if (totals) {
    const sel: MarketSelection[] = (totals.outcomes ?? [])
      .map((o: any) => {
        const isOver = String(o.name).toLowerCase() === 'over'
        return {
          selectionCode: isOver ? 'over' : 'under',
          label: `${isOver ? 'Más' : 'Menos'} de ${o.point} goles`,
          point: Number(o.point),
          decimalOdds: Number(o.price),
        }
      })
      .sort((a: MarketSelection, b: MarketSelection) => (a.point ?? 0) - (b.point ?? 0))
    if (sel.length) out.push({ key: 'totals', label: 'Más / Menos goles', selections: sel })
  }

  const btts = findMarket(ev, 'btts')
  if (btts) {
    const sel: MarketSelection[] = (btts.outcomes ?? []).map((o: any) => {
      const yes = String(o.name).toLowerCase() === 'yes'
      return {
        selectionCode: yes ? 'yes' : 'no',
        label: yes ? 'Ambos anotan: Sí' : 'Ambos anotan: No',
        decimalOdds: Number(o.price),
      }
    })
    if (sel.length) out.push({ key: 'btts', label: 'Ambos equipos anotan', selections: sel })
  }

  const spreads = findMarket(ev, 'spreads')
  if (spreads) {
    const sel: MarketSelection[] = (spreads.outcomes ?? [])
      .map((o: any) => {
        const isHome = o.name === home
        const p = Number(o.point)
        return {
          selectionCode: isHome ? 'home' : 'away',
          label: `${isHome ? home : away} ${p > 0 ? '+' : ''}${p}`,
          point: p,
          decimalOdds: Number(o.price),
        }
      })
      .sort((a: MarketSelection, b: MarketSelection) => (a.point ?? 0) - (b.point ?? 0))
    if (sel.length) out.push({ key: 'spreads', label: 'Hándicap (goles)', selections: sel })
  }

  return out
}

/** Marcador final (h/a) de un partido terminado, o null si aún no aplica. */
function scoresFromGame(game: any): { homeScore: number; awayScore: number } | null {
  if (!game?.completed || !Array.isArray(game.scores)) return null
  const home = game.scores.find((s: any) => s.name === game.home_team)
  const away = game.scores.find((s: any) => s.name === game.away_team)
  if (!home || !away) return null
  const hs = Number(home.score)
  const as = Number(away.score)
  if (Number.isNaN(hs) || Number.isNaN(as)) return null
  return { homeScore: hs, awayScore: as }
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
      .map((g) => {
        const s = scoresFromGame(g)
        return s ? { fixtureId: String(g.id ?? ''), ...s } : null
      })
      .filter((r): r is { fixtureId: string; homeScore: number; awayScore: number } => r !== null)
    cache.set(cacheKey, { at: Date.now(), data: results })
    return Response.json(results, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' },
    })
  }

  // ?event=<id>&sport=<key> -> todos los mercados de un partido (detalle).
  const eventId = params.get('event')
  if (eventId) {
    const sport = params.get('sport') ?? 'soccer_fifa_world_cup'
    const regions = params.get('regions') ?? 'eu'
    const cacheKey = `event|${sport}|${eventId}|${regions}`
    const hit = cache.get(cacheKey)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return Response.json(hit.data, {
        headers: { ...cors, 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' },
      })
    }
    const url = `${BASE_URL}/sports/${sport}/events/${eventId}/odds/?apiKey=${key}&regions=${regions}&markets=${DETAIL_MARKETS}&oddsFormat=decimal`
    const res = await fetch(url)
    if (!res.ok) {
      return Response.json(
        { error: `The Odds API respondió ${res.status}`, body: await res.text() },
        { status: res.status, headers: cors }
      )
    }
    const ev: any = await res.json()
    const home = ev.home_team ?? '?'
    const away = ev.away_team ?? '?'
    const detail = {
      fixtureId: String(ev.id ?? eventId),
      label: `${home} vs. ${away}`,
      sport,
      kickoff: String(ev.commence_time ?? ''),
      home,
      away,
      markets: buildDetailMarkets(ev, home, away),
    }
    cache.set(cacheKey, { at: Date.now(), data: detail })
    return Response.json(detail, {
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
