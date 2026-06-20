// Banderas reales (no emoji) a partir del nombre del equipo.
//
// IMPORTANTE: The Odds API (soccer) devuelve los nombres de selección en
// INGLÉS ("Netherlands vs. Sweden"), así que el mapa principal está en
// inglés. Mantenemos también los nombres en español por si algún feed o
// dato de respaldo los usa. Si un equipo no está, devolvemos null y la UI
// muestra un marcador con iniciales en lugar de una bandera rota.

const FLAG_CODES: Record<string, string> = {
  // --- Inglés (The Odds API) ---
  Netherlands: 'nl',
  Sweden: 'se',
  Germany: 'de',
  'Ivory Coast': 'ci',
  'Cote d\u2019Ivoire': 'ci',
  Ecuador: 'ec',
  'Curacao': 'cw',
  'Cura\u00e7ao': 'cw',
  Tunisia: 'tn',
  Japan: 'jp',
  Senegal: 'sn',
  Brazil: 'br',
  Argentina: 'ar',
  Mexico: 'mx',
  Uruguay: 'uy',
  Spain: 'es',
  France: 'fr',
  England: 'gb-eng',
  Scotland: 'gb-sct',
  Wales: 'gb-wls',
  Portugal: 'pt',
  Belgium: 'be',
  Italy: 'it',
  Croatia: 'hr',
  Morocco: 'ma',
  'United States': 'us',
  USA: 'us',
  Canada: 'ca',
  Qatar: 'qa',
  Colombia: 'co',
  Chile: 'cl',
  Peru: 'pe',
  Poland: 'pl',
  Denmark: 'dk',
  Switzerland: 'ch',
  Serbia: 'rs',
  'South Korea': 'kr',
  Australia: 'au',
  Ghana: 'gh',
  Cameroon: 'cm',
  Nigeria: 'ng',
  'Saudi Arabia': 'sa',
  Iran: 'ir',
  'Costa Rica': 'cr',
  // --- Español (respaldo) ---
  'Países Bajos': 'nl',
  Suecia: 'se',
  Alemania: 'de',
  'Costa de Marfil': 'ci',
  Túnez: 'tn',
  Japón: 'jp',
  Brasil: 'br',
  México: 'mx',
  España: 'es',
  Francia: 'fr',
  Inglaterra: 'gb-eng',
  Bélgica: 'be',
  Italia: 'it',
  Croacia: 'hr',
  Marruecos: 'ma',
  'Estados Unidos': 'us',
  Catar: 'qa',
  Perú: 'pe',
}

/** Devuelve la URL SVG de la bandera, o null si no se conoce el equipo. */
export function flagUrl(team: string): string | null {
  const code = FLAG_CODES[team.trim()]
  return code ? `https://flagcdn.com/${code}.svg` : null
}

/** "Netherlands vs. Sweden" -> ["Netherlands", "Sweden"] (o null). */
export function teamsFromLabel(label: string): [string, string] | null {
  const parts = label.split(/\s+vs\.?\s+/i)
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()]
  return null
}

/** Etiqueta corta y alineable para cada resultado: 1 / X / 2. */
export function outcomeSymbol(code: 'home' | 'draw' | 'away'): string {
  return code === 'home' ? '1' : code === 'draw' ? 'X' : '2'
}
