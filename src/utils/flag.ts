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
  'Cote d’Ivoire': 'ci',
  Ecuador: 'ec',
  Curacao: 'cw',
  'Curaçao': 'cw',
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
  // --- Español (respaldo / datos de ejemplo) ---
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

// Traducción inglés -> español, solo para lo que se MUESTRA. Los nombres que
// se escriben igual en ambos idiomas no necesitan entrada.
const TEAM_ES: Record<string, string> = {
  Netherlands: 'Países Bajos',
  Sweden: 'Suecia',
  Germany: 'Alemania',
  'Ivory Coast': 'Costa de Marfil',
  'Cote d’Ivoire': 'Costa de Marfil',
  Curacao: 'Curazao',
  'Curaçao': 'Curazao',
  Tunisia: 'Túnez',
  Japan: 'Japón',
  Brazil: 'Brasil',
  Mexico: 'México',
  Spain: 'España',
  France: 'Francia',
  England: 'Inglaterra',
  Scotland: 'Escocia',
  Wales: 'Gales',
  Belgium: 'Bélgica',
  Italy: 'Italia',
  Croatia: 'Croacia',
  Morocco: 'Marruecos',
  'United States': 'Estados Unidos',
  USA: 'Estados Unidos',
  Qatar: 'Catar',
  Peru: 'Perú',
  Poland: 'Polonia',
  Denmark: 'Dinamarca',
  Switzerland: 'Suiza',
  'South Korea': 'Corea del Sur',
  Cameroon: 'Camerún',
  'Saudi Arabia': 'Arabia Saudita',
  Iran: 'Irán',
  Canada: 'Canadá',
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
