/* NoBetter — Flags & team localization
   Ported from the CuentaClara codebase (src/utils/flag.ts).
   Real national-flag SVGs from flagcdn.com — NEVER emoji flags.
   The product shows a flag for team identity, or an initials box when unknown.

   Usage (ES module):
     import { flagUrl, displayTeam } from './assets/flags.js';
     const url = flagUrl('Brazil');          // https://flagcdn.com/br.svg
     const name = displayTeam('Brazil');     // "Brasil"

   Also attaches to window.NoBetterFlags for non-module scripts.
*/
const FLAG_CODES = {
  // English keys (The Odds API returns English names)
  Afghanistan:'af', Albania:'al', Algeria:'dz', Angola:'ao', Argentina:'ar', Armenia:'am',
  Australia:'au', Austria:'at', Azerbaijan:'az', Bahrain:'bh', Belgium:'be', Bolivia:'bo',
  'Bosnia and Herzegovina':'ba', Brazil:'br', Bulgaria:'bg', 'Burkina Faso':'bf', Cameroon:'cm',
  Canada:'ca', 'Cape Verde':'cv', Chile:'cl', China:'cn', Colombia:'co', 'Costa Rica':'cr',
  Croatia:'hr', Curacao:'cw', 'Curaçao':'cw', Cyprus:'cy', Czechia:'cz', 'Czech Republic':'cz',
  Denmark:'dk', 'DR Congo':'cd', Ecuador:'ec', Egypt:'eg', 'El Salvador':'sv', England:'gb-eng',
  Estonia:'ee', Finland:'fi', France:'fr', Gabon:'ga', Georgia:'ge', Germany:'de', Ghana:'gh',
  Greece:'gr', Guatemala:'gt', Guinea:'gn', Honduras:'hn', Hungary:'hu', Iceland:'is', Iran:'ir',
  Iraq:'iq', Ireland:'ie', Israel:'il', Italy:'it', 'Ivory Coast':'ci', 'Cote d’Ivoire':'ci',
  Jamaica:'jm', Japan:'jp', Jordan:'jo', Kazakhstan:'kz', Kenya:'ke', Kosovo:'xk', Kuwait:'kw',
  Latvia:'lv', Lebanon:'lb', Luxembourg:'lu', Mali:'ml', Mexico:'mx', Montenegro:'me', Morocco:'ma',
  Netherlands:'nl', 'New Zealand':'nz', Nigeria:'ng', 'North Macedonia':'mk', 'Northern Ireland':'gb-nir',
  Norway:'no', Oman:'om', Panama:'pa', Paraguay:'py', Peru:'pe', Poland:'pl', Portugal:'pt',
  Qatar:'qa', Romania:'ro', Russia:'ru', 'Saudi Arabia':'sa', Scotland:'gb-sct', Senegal:'sn',
  Serbia:'rs', Slovakia:'sk', Slovenia:'si', 'South Africa':'za', 'South Korea':'kr',
  'Korea Republic':'kr', Spain:'es', Sweden:'se', Switzerland:'ch', Syria:'sy', Togo:'tg',
  Tunisia:'tn', Turkey:'tr', 'Türkiye':'tr', Ukraine:'ua', 'United Arab Emirates':'ae',
  'United States':'us', USA:'us', Uruguay:'uy', Uzbekistan:'uz', Venezuela:'ve', Wales:'gb-wls', Zambia:'zm',
  // Spanish keys (backup / sample data)
  'Países Bajos':'nl', Suecia:'se', Alemania:'de', 'Costa de Marfil':'ci', Túnez:'tn', Japón:'jp',
  Brasil:'br', México:'mx', España:'es', Francia:'fr', Inglaterra:'gb-eng', Bélgica:'be', Italia:'it',
  Croacia:'hr', Marruecos:'ma', 'Estados Unidos':'us', Catar:'qa', Perú:'pe',
};

const TEAM_ES = {
  Netherlands:'Países Bajos', Sweden:'Suecia', Germany:'Alemania', 'Ivory Coast':'Costa de Marfil',
  'Cote d’Ivoire':'Costa de Marfil', Curacao:'Curazao', 'Curaçao':'Curazao', Tunisia:'Túnez',
  Japan:'Japón', Brazil:'Brasil', Mexico:'México', Spain:'España', France:'Francia', England:'Inglaterra',
  Scotland:'Escocia', Wales:'Gales', Belgium:'Bélgica', Italy:'Italia', Croatia:'Croacia',
  Morocco:'Marruecos', 'United States':'Estados Unidos', USA:'Estados Unidos', Qatar:'Catar', Peru:'Perú',
  Poland:'Polonia', Denmark:'Dinamarca', Switzerland:'Suiza', 'South Korea':'Corea del Sur',
  Cameroon:'Camerún', 'Saudi Arabia':'Arabia Saudita', Iran:'Irán', Canada:'Canadá', Iraq:'Irak',
  Norway:'Noruega', Jordan:'Jordania', Algeria:'Argelia', Uzbekistan:'Uzbekistán', Panama:'Panamá',
  Egypt:'Egipto', Greece:'Grecia', Turkey:'Turquía', 'Türkiye':'Turquía', Ukraine:'Ucrania',
  Russia:'Rusia', Ireland:'Irlanda', 'Northern Ireland':'Irlanda del Norte', Hungary:'Hungría',
  Romania:'Rumanía', Austria:'Austria', Finland:'Finlandia', Iceland:'Islandia', Israel:'Israel',
  China:'China', 'South Africa':'Sudáfrica', 'New Zealand':'Nueva Zelanda',
  'United Arab Emirates':'Emiratos Árabes Unidos', 'Czech Republic':'República Checa', Czechia:'Chequia',
  'DR Congo':'RD del Congo', 'Cape Verde':'Cabo Verde', 'Bosnia and Herzegovina':'Bosnia y Herzegovina',
  'North Macedonia':'Macedonia del Norte', Portugal:'Portugal', Senegal:'Senegal',
};

/** SVG flag URL for a team, or null if unknown (UI should fall back to initials). */
export function flagUrl(team) {
  const code = FLAG_CODES[String(team).trim()];
  return code ? `https://flagcdn.com/${code}.svg` : null;
}
/** Spanish team name if known, else the original. */
export function displayTeam(team) {
  return TEAM_ES[String(team).trim()] ?? team;
}
/** "Spain gana" -> "España gana" (translates known names inside free text). */
export function localize(text) {
  let out = String(text);
  for (const [en, es] of Object.entries(TEAM_ES)) out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), es);
  return out;
}
/** "Netherlands vs. Sweden" -> ["Netherlands","Sweden"] or null. */
export function teamsFromLabel(label) {
  const parts = String(label).split(/\s+vs\.?\s+/i);
  return parts.length === 2 ? [parts[0].trim(), parts[1].trim()] : null;
}
/** Aligned 1 / X / 2 symbol for an outcome code. */
export function outcomeSymbol(code) {
  return code === 'home' ? '1' : code === 'draw' ? 'X' : '2';
}
/** Two-letter initials fallback when no flag is known. */
export function initials(team) {
  return String(team).trim().replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

if (typeof window !== 'undefined') {
  window.NoBetterFlags = { flagUrl, displayTeam, localize, teamsFromLabel, outcomeSymbol, initials, FLAG_CODES, TEAM_ES };
}
