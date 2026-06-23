// Banderas reales (no emoji) a partir del nombre del equipo.
//
// IMPORTANTE: The Odds API (soccer) devuelve los nombres de selección en
// INGLÉS ("Netherlands vs. Sweden"), así que el mapa principal está en
// inglés. Mantenemos también los nombres en español por si algún feed o
// dato de respaldo los usa. Si un equipo no está, devolvemos null y la UI
// muestra un marcador con iniciales en lugar de una bandera rota.

const FLAG_CODES: Record<string, string> = {
  // --- Inglés (The Odds API) — lista amplia de selecciones ---
  Afghanistan: 'af',
  Albania: 'al',
  Algeria: 'dz',
  Angola: 'ao',
  Argentina: 'ar',
  Armenia: 'am',
  Australia: 'au',
  Austria: 'at',
  Azerbaijan: 'az',
  Bahrain: 'bh',
  Belgium: 'be',
  Bolivia: 'bo',
  'Bosnia and Herzegovina': 'ba',
  Brazil: 'br',
  Bulgaria: 'bg',
  'Burkina Faso': 'bf',
  Cameroon: 'cm',
  Canada: 'ca',
  'Cape Verde': 'cv',
  Chile: 'cl',
  China: 'cn',
  Colombia: 'co',
  'Costa Rica': 'cr',
  Croatia: 'hr',
  Curacao: 'cw',
  'Curaçao': 'cw',
  Cyprus: 'cy',
  Czechia: 'cz',
  'Czech Republic': 'cz',
  Denmark: 'dk',
  'DR Congo': 'cd',
  Ecuador: 'ec',
  Egypt: 'eg',
  'El Salvador': 'sv',
  England: 'gb-eng',
  Estonia: 'ee',
  Finland: 'fi',
  France: 'fr',
  Gabon: 'ga',
  Georgia: 'ge',
  Germany: 'de',
  Ghana: 'gh',
  Greece: 'gr',
  Guatemala: 'gt',
  Guinea: 'gn',
  Honduras: 'hn',
  Hungary: 'hu',
  Iceland: 'is',
  Iran: 'ir',
  Iraq: 'iq',
  Ireland: 'ie',
  Israel: 'il',
  Italy: 'it',
  'Ivory Coast': 'ci',
  'Cote d’Ivoire': 'ci',
  Jamaica: 'jm',
  Japan: 'jp',
  Jordan: 'jo',
  Kazakhstan: 'kz',
  Kenya: 'ke',
  Kosovo: 'xk',
  Kuwait: 'kw',
  Latvia: 'lv',
  Lebanon: 'lb',
  Luxembourg: 'lu',
  Mali: 'ml',
  Mexico: 'mx',
  Montenegro: 'me',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Nigeria: 'ng',
  'North Macedonia': 'mk',
  'Northern Ireland': 'gb-nir',
  Norway: 'no',
  Oman: 'om',
  Panama: 'pa',
  Paraguay: 'py',
  Peru: 'pe',
  Poland: 'pl',
  Portugal: 'pt',
  Qatar: 'qa',
  Romania: 'ro',
  Russia: 'ru',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  Serbia: 'rs',
  Slovakia: 'sk',
  Slovenia: 'si',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Korea Republic': 'kr',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Syria: 'sy',
  Togo: 'tg',
  Tunisia: 'tn',
  Turkey: 'tr',
  'Türkiye': 'tr',
  Ukraine: 'ua',
  'United Arab Emirates': 'ae',
  'United States': 'us',
  USA: 'us',
  Uruguay: 'uy',
  Uzbekistan: 'uz',
  Venezuela: 've',
  Wales: 'gb-wls',
  Zambia: 'zm',
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
  Iraq: 'Irak',
  Norway: 'Noruega',
  Jordan: 'Jordania',
  Algeria: 'Argelia',
  Uzbekistan: 'Uzbekistán',
  Panama: 'Panamá',
  Egypt: 'Egipto',
  Greece: 'Grecia',
  Turkey: 'Turquía',
  'Türkiye': 'Turquía',
  Ukraine: 'Ucrania',
  Russia: 'Rusia',
  Ireland: 'Irlanda',
  'Northern Ireland': 'Irlanda del Norte',
  Hungary: 'Hungría',
  Romania: 'Rumanía',
  Austria: 'Austria',
  Finland: 'Finlandia',
  Iceland: 'Islandia',
  Israel: 'Israel',
  China: 'China',
  'South Africa': 'Sudáfrica',
  'New Zealand': 'Nueva Zelanda',
  'United Arab Emirates': 'Emiratos Árabes Unidos',
  'Czech Republic': 'República Checa',
  Czechia: 'Chequia',
  'DR Congo': 'RD del Congo',
  'Cape Verde': 'Cabo Verde',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'North Macedonia': 'Macedonia del Norte',
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
export function localize(text: string | undefined | null): string {
  if (!text) return ''
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
