// Banderas reales (no emoji) a partir del nombre del equipo.
//
// The Odds API entrega los equipos EN INGLÉS ("Spain vs. England"), así que
// el mapa principal está en inglés. Mantenemos también las claves en español
// para los datos de ejemplo (MOCK_FIXTURES) y compatibilidad hacia atrás.
// Si un equipo no está, devolvemos null y la UI muestra un marcador neutro
// en lugar de una bandera rota.

const FLAG_CODES: Record<string, string> = {
  // Inglés (como los entrega The Odds API)
  Spain: 'es',
  England: 'gb-eng',
  Brazil: 'br',
  Argentina: 'ar',
  Mexico: 'mx',
  Uruguay: 'uy',
  France: 'fr',
  Portugal: 'pt',
  Netherlands: 'nl',
  Germany: 'de',
  Croatia: 'hr',
  Colombia: 'co',
  Chile: 'cl',
  Peru: 'pe',
  'United States': 'us',
  Qatar: 'qa',
  Belgium: 'be',
  Italy: 'it',
  Japan: 'jp',
  Morocco: 'ma',
  Ecuador: 'ec',
  Senegal: 'sn',
  Canada: 'ca',
  'South Korea': 'kr',
  Switzerland: 'ch',
  Denmark: 'dk',
  Poland: 'pl',
  Serbia: 'rs',
  Australia: 'au',
  Ghana: 'gh',
  Nigeria: 'ng',
  Cameroon: 'cm',
  // Español (datos de ejemplo / compatibilidad)
  España: 'es',
  Brasil: 'br',
  México: 'mx',
  Francia: 'fr',
  Inglaterra: 'gb-eng',
  'Países Bajos': 'nl',
  Alemania: 'de',
  Croacia: 'hr',
  Perú: 'pe',
  'Estados Unidos': 'us',
  Catar: 'qa',
  Bélgica: 'be',
  Italia: 'it',
  Japón: 'jp',
  Marruecos: 'ma',
}

// Traducción inglés -> español, solo para lo que se MUESTRA. Los nombres que
// se escriben igual en ambos idiomas no necesitan entrada.
const TEAM_ES: Record<string, string> = {
  Spain: 'España',
  England: 'Inglaterra',
  Brazil: 'Brasil',
  Mexico: 'México',
  France: 'Francia',
  Netherlands: 'Países Bajos',
  Germany: 'Alemania',
  Croatia: 'Croacia',
  Peru: 'Perú',
  'United States': 'Estados Unidos',
  Qatar: 'Catar',
  Belgium: 'Bélgica',
  Italy: 'Italia',
  Japan: 'Japón',
  Morocco: 'Marruecos',
  'South Korea': 'Corea del Sur',
  Switzerland: 'Suiza',
  Denmark: 'Dinamarca',
  Poland: 'Polonia',
  Canada: 'Canadá',
  Cameroon: 'Camerún',
}

/** Devuelve la URL SVG de la bandera, o null si no se conoce el equipo. */
export function flagUrl(team: string): string | null {
  const code = FLAG_CODES[team.trim()]
  return code ? `https://flagcdn.com/${code}.svg` : null
}

/** Nombre del equipo en español si lo conocemos; si no, el original. */
export function displayTeam(team: string): string {
  return TEAM_ES[team.trim()] ?? team
}

/**
 * Traduce nombres de equipos dentro de un texto libre (etiqueta del partido
 * o "pick" del boleto), p. ej. "Spain gana" -> "España gana". Reemplaza cada
 * nombre conocido por su versión en español.
 */
export function localize(text: string): string {
  let out = text
  for (const [en, es] of Object.entries(TEAM_ES)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), es)
  }
  return out
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
