// Banderas reales (no emoji) a partir del nombre del equipo.
// Las cuotas llegan con label tipo "Ecuador vs. Senegal"; de ahí
// derivamos los dos equipos y su bandera vía flagcdn.com.
// Si un equipo no está en el mapa, devolvemos null y la UI muestra
// un marcador neutro en lugar de una bandera rota.

const FLAG_CODES: Record<string, string> = {
  Ecuador: 'ec',
  Senegal: 'sn',
  Brasil: 'br',
  Argentina: 'ar',
  México: 'mx',
  Uruguay: 'uy',
  España: 'es',
  Francia: 'fr',
  Inglaterra: 'gb-eng',
  Portugal: 'pt',
  'Países Bajos': 'nl',
  Alemania: 'de',
  Croacia: 'hr',
  Colombia: 'co',
  Chile: 'cl',
  Perú: 'pe',
  'Estados Unidos': 'us',
  Catar: 'qa',
  Bélgica: 'be',
  Italia: 'it',
  Japón: 'jp',
  Marruecos: 'ma',
}

/** Devuelve la URL SVG de la bandera, o null si no se conoce el equipo. */
export function flagUrl(team: string): string | null {
  const code = FLAG_CODES[team.trim()]
  return code ? `https://flagcdn.com/${code}.svg` : null
}

/** "Ecuador vs. Senegal" -> ["Ecuador", "Senegal"] (o null si no se puede dividir). */
export function teamsFromLabel(label: string): [string, string] | null {
  const parts = label.split(/\s+vs\.?\s+/i)
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()]
  return null
}

/** Etiqueta corta y alineable para cada resultado: 1 / X / 2. */
export function outcomeSymbol(code: 'home' | 'draw' | 'away'): string {
  return code === 'home' ? '1' : code === 'draw' ? 'X' : '2'
}
