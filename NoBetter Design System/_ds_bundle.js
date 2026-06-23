/* @ds-bundle: {"format":3,"namespace":"NoBetterDesignSystem_40bf4b","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"LedgerRule","sourcePath":"components/core/LedgerRule.jsx"},{"name":"OddsButton","sourcePath":"components/core/OddsButton.jsx"},{"name":"Tab","sourcePath":"components/core/Tab.jsx"},{"name":"SbBadge","sourcePath":"components/sportsbook/SbBadge.jsx"},{"name":"SbButton","sourcePath":"components/sportsbook/SbButton.jsx"},{"name":"SbOddsTile","sourcePath":"components/sportsbook/SbOddsTile.jsx"}],"sourceHashes":{"assets/financialMath.js":"371ea45d63ba","assets/flags.js":"9db0d8849943","components/core/Badge.jsx":"74928c349084","components/core/Button.jsx":"b93db75b8290","components/core/Card.jsx":"4dfe5db15548","components/core/Input.jsx":"19fce95ecfc9","components/core/LedgerRule.jsx":"9db2a156291d","components/core/OddsButton.jsx":"d2d0ac7e1e03","components/core/Tab.jsx":"4fa7efb57b87","components/sportsbook/SbBadge.jsx":"617da2ff00d5","components/sportsbook/SbButton.jsx":"a541aac1d8fb","components/sportsbook/SbOddsTile.jsx":"c3f3dad76ad3"},"inlinedExternals":[],"unexposedExports":[{"name":"bookmakerMargin","sourcePath":"assets/financialMath.js"},{"name":"combinedOdds","sourcePath":"assets/financialMath.js"},{"name":"displayTeam","sourcePath":"assets/flags.js"},{"name":"estimateOpportunityCost","sourcePath":"assets/financialMath.js"},{"name":"expectedLossFromWagering","sourcePath":"assets/financialMath.js"},{"name":"flagUrl","sourcePath":"assets/flags.js"},{"name":"futureValueOfContributions","sourcePath":"assets/financialMath.js"},{"name":"impliedProbability","sourcePath":"assets/financialMath.js"},{"name":"initials","sourcePath":"assets/flags.js"},{"name":"localize","sourcePath":"assets/flags.js"},{"name":"outcomeSymbol","sourcePath":"assets/flags.js"},{"name":"probabilityOfRepeatingStreak","sourcePath":"assets/financialMath.js"},{"name":"teamsFromLabel","sourcePath":"assets/flags.js"}]} */

(() => {

const __ds_ns = (window.NoBetterDesignSystem_40bf4b = window.NoBetterDesignSystem_40bf4b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/financialMath.js
try { (() => {
/* NoBetter — Financial math (the educational engine)
   Ported from the CuentaClara codebase (src/utils/financialMath.ts).
   Deliberately conservative: historical returns, never optimistic projections,
   and every estimate ships with the assumption it used.

   import { bookmakerMargin, impliedProbability, estimateOpportunityCost } from './assets/financialMath.js';
*/

/** Future value if the money had been invested in a broad index fund instead of bet.
    Uses a conservative ~8% nominal annual rate. */
function estimateOpportunityCost(totalContributed, years, annualReturnAssumed = 0.08) {
  const futureValue = totalContributed * Math.pow(1 + annualReturnAssumed, years);
  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalContributed,
    annualReturnAssumed,
    years,
    disclaimer: 'Estimación con una tasa histórica conservadora. Rendimiento pasado no garantiza rendimiento futuro; los mercados también pueden caer.'
  };
}

/** Expected loss from the house margin when wagering repeatedly. Not bad luck — design. */
function expectedLossFromWagering(totalWagered, margin = 0.07) {
  return Math.round(totalWagered * margin * 100) / 100;
}

/** Future value of periodic contributions (ordinary annuity) — "bet $X/week" vs "invest $X/week". */
function futureValueOfContributions(perWeek, years, annualReturn = 0.08) {
  const n = Math.round(years * 52);
  const r = annualReturn / 52;
  if (r === 0) return Math.round(perWeek * n * 100) / 100;
  return Math.round(perWeek * ((Math.pow(1 + r, n) - 1) / r) * 100) / 100;
}

/** Implied probability the betting market assigns to an outcome. */
function impliedProbability(decimalOdds) {
  if (decimalOdds <= 1) return 1;
  return 1 / decimalOdds;
}

/** Combined odds of a parlay (product of decimal odds). */
function combinedOdds(selections) {
  return selections.reduce((acc, s) => acc * s.decimalOdds, 1);
}

/** Bookmaker margin (overround) of a 1X2 market: sum of implied probs minus 1.
    Returns a fraction (0.075 = 7.5%), or null if not enough valid odds. */
function bookmakerMargin(decimalOdds) {
  const valid = decimalOdds.filter(o => o > 1);
  if (valid.length < 2) return null;
  const overround = valid.reduce((acc, o) => acc + 1 / o, 0);
  return overround - 1;
}

/** Probability of repeating a winning streak, assuming independence — the number
    you show the user who "is on a hot streak". */
function probabilityOfRepeatingStreak(decimalOddsOfEachBet) {
  return decimalOddsOfEachBet.reduce((acc, odds) => acc * impliedProbability(odds), 1);
}
if (typeof window !== 'undefined') {
  window.NoBetterMath = {
    estimateOpportunityCost,
    expectedLossFromWagering,
    futureValueOfContributions,
    impliedProbability,
    combinedOdds,
    bookmakerMargin,
    probabilityOfRepeatingStreak
  };
}
Object.assign(__ds_scope, { estimateOpportunityCost, expectedLossFromWagering, futureValueOfContributions, impliedProbability, combinedOdds, bookmakerMargin, probabilityOfRepeatingStreak });
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/financialMath.js", error: String((e && e.message) || e) }); }

// assets/flags.js
try { (() => {
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
  // Spanish keys (backup / sample data)
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
  Perú: 'pe'
};
const TEAM_ES = {
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
  Portugal: 'Portugal',
  Senegal: 'Senegal'
};

/** SVG flag URL for a team, or null if unknown (UI should fall back to initials). */
function flagUrl(team) {
  const code = FLAG_CODES[String(team).trim()];
  return code ? `https://flagcdn.com/${code}.svg` : null;
}
/** Spanish team name if known, else the original. */
function displayTeam(team) {
  return TEAM_ES[String(team).trim()] ?? team;
}
/** "Spain gana" -> "España gana" (translates known names inside free text). */
function localize(text) {
  let out = String(text);
  for (const [en, es] of Object.entries(TEAM_ES)) out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), es);
  return out;
}
/** "Netherlands vs. Sweden" -> ["Netherlands","Sweden"] or null. */
function teamsFromLabel(label) {
  const parts = String(label).split(/\s+vs\.?\s+/i);
  return parts.length === 2 ? [parts[0].trim(), parts[1].trim()] : null;
}
/** Aligned 1 / X / 2 symbol for an outcome code. */
function outcomeSymbol(code) {
  return code === 'home' ? '1' : code === 'draw' ? 'X' : '2';
}
/** Two-letter initials fallback when no flag is known. */
function initials(team) {
  return String(team).trim().replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
if (typeof window !== 'undefined') {
  window.NoBetterFlags = {
    flagUrl,
    displayTeam,
    localize,
    teamsFromLabel,
    outcomeSymbol,
    initials,
    FLAG_CODES,
    TEAM_ES
  };
}
Object.assign(__ds_scope, { flagUrl, displayTeam, localize, teamsFromLabel, outcomeSymbol, initials });
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/flags.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
/** Small status/label chip. Use sparingly — one prominent badge per surface. */
function Badge({
  children,
  variant = 'default',
  dot = false,
  uppercase = false
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.03em',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid transparent',
    lineHeight: 1.4,
    whiteSpace: 'nowrap'
  };
  const variants = {
    default: {
      background: 'transparent',
      color: 'var(--color-text-muted)',
      borderColor: 'var(--color-border)'
    },
    slate: {
      background: 'var(--color-primary-bg)',
      color: 'var(--color-primary)',
      borderColor: 'var(--color-primary-border)'
    },
    ochre: {
      background: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      borderColor: 'var(--color-warning-border)'
    },
    burgundy: {
      background: 'var(--color-danger)',
      color: 'var(--color-paper)',
      borderColor: 'transparent'
    },
    sage: {
      background: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      borderColor: 'var(--color-success-border)'
    },
    ink: {
      background: 'var(--color-ink)',
      color: 'var(--color-paper)',
      borderColor: 'transparent'
    },
    /* Reserved for the "ficticia" money label */
    ficticia: {
      background: 'rgba(185,139,62,0.9)',
      color: 'var(--color-ink)',
      borderColor: 'transparent',
      fontSize: '10px',
      letterSpacing: '0.08em'
    }
  };
  const v = variants[variant] || variants.default;
  const isUpper = uppercase || variant === 'ficticia';
  const dotEl = dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'currentColor',
      display: 'inline-block',
      flexShrink: 0
    }
  }) : null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      ...v,
      textTransform: isUpper ? 'uppercase' : 'none',
      letterSpacing: isUpper ? '0.08em' : v.letterSpacing || '0.03em'
    }
  }, dotEl, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
/** Primary and secondary action buttons for all interactive surfaces. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '0.01em',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    ...(fullWidth ? {
      width: '100%'
    } : {})
  };
  const sizes = {
    sm: {
      fontSize: '12px',
      padding: '5px 12px',
      borderRadius: '6px'
    },
    md: {
      fontSize: '13px',
      padding: '8px 16px',
      borderRadius: '8px'
    },
    lg: {
      fontSize: '14px',
      padding: '10px 20px',
      borderRadius: '8px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-paper)',
      borderColor: 'var(--color-primary)'
    },
    secondary: {
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      borderColor: 'var(--color-border)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-primary)',
      borderColor: 'transparent'
    },
    danger: {
      background: 'var(--color-danger)',
      color: 'var(--color-paper)',
      borderColor: 'var(--color-danger)'
    },
    success: {
      background: 'var(--color-success)',
      color: 'var(--color-paper)',
      borderColor: 'var(--color-success)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-primary)',
      borderColor: 'var(--color-primary)'
    },
    dark: {
      background: 'rgba(255,255,255,0.10)',
      color: '#fff',
      borderColor: 'rgba(255,255,255,0.30)'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    style: {
      ...base,
      ...s,
      ...v
    },
    disabled: disabled,
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/** Surface container. All data panels, sections, and modal content use this. */
function Card({
  children,
  style,
  header,
  footer,
  flush = false,
  tinted = false,
  gradient = false
}) {
  const cardStyle = {
    background: gradient ? 'var(--gradient-slate)' : tinted ? 'var(--color-surface-tinted)' : 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    ...style
  };
  const bodyStyle = flush ? {} : {
    padding: 'var(--card-pad)'
  };
  const headerStyle = {
    padding: '16px var(--card-pad)',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-serif)',
    fontSize: 'var(--text-lg)',
    color: gradient ? 'var(--color-paper)' : 'var(--color-text)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: cardStyle
  }, header && /*#__PURE__*/React.createElement("div", {
    style: headerStyle
  }, header), /*#__PURE__*/React.createElement("div", {
    style: bodyStyle
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px var(--card-pad)',
      borderTop: '1px solid var(--color-border)'
    }
  }, footer));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
/** Text input with optional label, prefix/suffix, and validation state. */
function Input({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
  size = 'md',
  error,
  prefix,
  suffix,
  disabled = false,
  id,
  mono = false
}) {
  const inputStyle = {
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    fontVariantNumeric: mono ? 'tabular-nums' : undefined,
    fontSize: size === 'sm' ? '12px' : '13px',
    padding: size === 'sm' ? '6px 10px' : '8px 12px',
    paddingLeft: prefix ? size === 'sm' ? '26px' : '30px' : size === 'sm' ? '10px' : '12px',
    paddingRight: suffix ? size === 'sm' ? '26px' : '30px' : size === 'sm' ? '10px' : '12px',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: disabled ? 'var(--color-surface-tinted)' : 'var(--color-surface)',
    color: 'var(--color-text)',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s'
  };
  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  };
  const adornStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-subtle)',
    fontSize: '12px',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    pointerEvents: 'none'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: labelStyle
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      ...adornStyle,
      left: '10px'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", {
    id: id,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    style: inputStyle
  }), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      ...adornStyle,
      right: '10px'
    }
  }, suffix)), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--color-danger)',
      fontFamily: 'var(--font-sans)'
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/LedgerRule.jsx
try { (() => {
/** Dashed horizontal rule — NoBetter's signature brand motif.
    Evokes a checkbook ledger stub; used as section divider throughout. */
function LedgerRule({
  style,
  margin
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '1px',
      backgroundImage: 'var(--ledger-rule-bg)',
      margin: margin !== undefined ? margin : undefined,
      ...style
    }
  });
}
Object.assign(__ds_scope, { LedgerRule });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/LedgerRule.jsx", error: String((e && e.message) || e) }); }

// components/core/OddsButton.jsx
try { (() => {
/** Odds selection button — the core interactive element of the betting interface.
    Appears in two contexts: on the dark gradient header (onDark=true) and in
    the standard fixture list (onDark=false). */
function OddsButton({
  label,
  odds,
  active = false,
  onClick,
  onDark = false,
  disabled = false
}) {
  const base = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    minWidth: '72px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-lg)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    border: '1px solid',
    background: 'transparent',
    opacity: disabled ? 0.5 : 1
  };
  const states = {
    darkActive: {
      borderColor: '#fff',
      background: '#fff',
      color: 'var(--color-ink)'
    },
    darkInactive: {
      borderColor: 'rgba(255,255,255,0.20)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff'
    },
    lightActive: {
      borderColor: 'var(--color-primary)',
      background: 'var(--color-primary)',
      color: 'var(--color-paper)'
    },
    lightInactive: {
      borderColor: 'var(--color-border)',
      background: 'transparent',
      color: 'var(--color-text)'
    }
  };
  const state = onDark ? active ? states.darkActive : states.darkInactive : active ? states.lightActive : states.lightInactive;
  return /*#__PURE__*/React.createElement("button", {
    style: {
      ...base,
      ...state
    },
    onClick: !disabled ? onClick : undefined
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      opacity: 0.70,
      letterSpacing: '0.04em'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '15px',
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums'
    }
  }, typeof odds === 'number' ? odds.toFixed(2) : odds));
}
Object.assign(__ds_scope, { OddsButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/OddsButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tab.jsx
try { (() => {
/** Navigation tab — used in the sticky header for top-level route switching. */
function Tab({
  children,
  active = false,
  onClick,
  href
}) {
  const style = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
    paddingBottom: '4px',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.5
  };
  if (href) {
    return /*#__PURE__*/React.createElement("a", {
      href: href,
      style: style
    }, children);
  }
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: style,
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { Tab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tab.jsx", error: String((e && e.message) || e) }); }

// components/sportsbook/SbBadge.jsx
try { (() => {
/** Dark-theme status chip. Use inside a .sb-theme container.
    The `truth` and `ficticia` variants carry NoBetter's editorial message. */
function SbBadge({
  children,
  variant = 'default',
  dot = false,
  live = false
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '6px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap'
  };
  const variants = {
    default: {
      background: 'var(--sb-surface-3)',
      color: 'var(--sb-text-2)'
    },
    accent: {
      background: 'var(--sb-accent-soft)',
      color: 'var(--sb-accent)'
    },
    live: {
      background: 'var(--sb-live)',
      color: '#fff'
    },
    truth: {
      background: 'var(--sb-truth-bg)',
      color: 'var(--sb-truth)'
    },
    cash: {
      background: 'rgba(31,209,122,0.14)',
      color: 'var(--sb-cash)'
    },
    ficticia: {
      background: 'var(--sb-truth-bg)',
      color: 'var(--sb-truth)'
    }
  };
  const v = variants[variant] || variants.default;
  const showDot = dot || live;
  const dotEl = showDot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'currentColor',
      display: 'inline-block',
      animation: live ? 'sbpulse 1.4s ease-in-out infinite' : 'none'
    }
  }) : null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      ...v
    }
  }, dotEl, children);
}
Object.assign(__ds_scope, { SbBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sportsbook/SbBadge.jsx", error: String((e && e.message) || e) }); }

// components/sportsbook/SbButton.jsx
try { (() => {
/** Sportsbook action button (dark theme). Use inside a .sb-theme container. */
function SbButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  glow = false
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    letterSpacing: '0.01em',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.14s ease',
    whiteSpace: 'nowrap',
    ...(fullWidth ? {
      width: '100%'
    } : {})
  };
  const sizes = {
    sm: {
      fontSize: '12px',
      padding: '7px 14px',
      borderRadius: '8px'
    },
    md: {
      fontSize: '14px',
      padding: '11px 18px',
      borderRadius: '9px'
    },
    lg: {
      fontSize: '15px',
      padding: '14px 22px',
      borderRadius: '10px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--sb-accent)',
      color: 'var(--sb-on-accent)',
      borderColor: 'var(--sb-accent)',
      boxShadow: glow ? 'var(--sb-shadow-accent)' : 'none'
    },
    secondary: {
      background: 'var(--sb-surface-3)',
      color: 'var(--sb-text)',
      borderColor: 'var(--sb-border)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--sb-text-2)',
      borderColor: 'transparent'
    },
    success: {
      background: 'var(--sb-cash)',
      color: '#06210F',
      borderColor: 'var(--sb-cash)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--sb-accent)',
      borderColor: 'var(--sb-accent)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    style: {
      ...base,
      ...(sizes[size] || sizes.md),
      ...(variants[variant] || variants.primary)
    }
  }, children);
}
Object.assign(__ds_scope, { SbButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sportsbook/SbButton.jsx", error: String((e && e.message) || e) }); }

// components/sportsbook/SbOddsTile.jsx
try { (() => {
/** Odds tile for the dark sportsbook — the core betting interaction.
    Use inside a .sb-theme container. Optional up/down market-movement arrow. */
function SbOddsTile({
  label,
  odds,
  active = false,
  move,
  onClick,
  disabled = false
}) {
  const base = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '60px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.12s ease',
    fontFamily: 'var(--font-sans)'
  };
  const state = active ? {
    background: 'var(--sb-accent)',
    borderColor: 'var(--sb-accent)',
    color: 'var(--sb-on-accent)',
    boxShadow: 'var(--sb-shadow-accent)'
  } : {
    background: 'var(--sb-surface-3)',
    borderColor: 'var(--sb-border)',
    color: 'var(--sb-text)'
  };
  const moveColor = move === 'up' ? 'var(--sb-up)' : move === 'down' ? 'var(--sb-down)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    style: {
      ...base,
      ...state
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '10px',
      fontWeight: 600,
      opacity: active ? 0.85 : 0.5,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '3px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '15px',
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums'
    }
  }, typeof odds === 'number' ? odds.toFixed(2) : odds), move && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '8px',
      color: active ? 'var(--sb-on-accent)' : moveColor
    }
  }, move === 'up' ? '\u25B2' : '\u25BC')));
}
Object.assign(__ds_scope, { SbOddsTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sportsbook/SbOddsTile.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.LedgerRule = __ds_scope.LedgerRule;

__ds_ns.OddsButton = __ds_scope.OddsButton;

__ds_ns.Tab = __ds_scope.Tab;

__ds_ns.SbBadge = __ds_scope.SbBadge;

__ds_ns.SbButton = __ds_scope.SbButton;

__ds_ns.SbOddsTile = __ds_scope.SbOddsTile;

})();
