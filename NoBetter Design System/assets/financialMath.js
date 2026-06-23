/* NoBetter — Financial math (the educational engine)
   Ported from the CuentaClara codebase (src/utils/financialMath.ts).
   Deliberately conservative: historical returns, never optimistic projections,
   and every estimate ships with the assumption it used.

   import { bookmakerMargin, impliedProbability, estimateOpportunityCost } from './assets/financialMath.js';
*/

/** Future value if the money had been invested in a broad index fund instead of bet.
    Uses a conservative ~8% nominal annual rate. */
export function estimateOpportunityCost(totalContributed, years, annualReturnAssumed = 0.08) {
  const futureValue = totalContributed * Math.pow(1 + annualReturnAssumed, years);
  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalContributed, annualReturnAssumed, years,
    disclaimer: 'Estimación con una tasa histórica conservadora. Rendimiento pasado no garantiza rendimiento futuro; los mercados también pueden caer.',
  };
}

/** Expected loss from the house margin when wagering repeatedly. Not bad luck — design. */
export function expectedLossFromWagering(totalWagered, margin = 0.07) {
  return Math.round(totalWagered * margin * 100) / 100;
}

/** Future value of periodic contributions (ordinary annuity) — "bet $X/week" vs "invest $X/week". */
export function futureValueOfContributions(perWeek, years, annualReturn = 0.08) {
  const n = Math.round(years * 52);
  const r = annualReturn / 52;
  if (r === 0) return Math.round(perWeek * n * 100) / 100;
  return Math.round(perWeek * ((Math.pow(1 + r, n) - 1) / r) * 100) / 100;
}

/** Implied probability the betting market assigns to an outcome. */
export function impliedProbability(decimalOdds) {
  if (decimalOdds <= 1) return 1;
  return 1 / decimalOdds;
}

/** Combined odds of a parlay (product of decimal odds). */
export function combinedOdds(selections) {
  return selections.reduce((acc, s) => acc * s.decimalOdds, 1);
}

/** Bookmaker margin (overround) of a 1X2 market: sum of implied probs minus 1.
    Returns a fraction (0.075 = 7.5%), or null if not enough valid odds. */
export function bookmakerMargin(decimalOdds) {
  const valid = decimalOdds.filter((o) => o > 1);
  if (valid.length < 2) return null;
  const overround = valid.reduce((acc, o) => acc + 1 / o, 0);
  return overround - 1;
}

/** Probability of repeating a winning streak, assuming independence — the number
    you show the user who "is on a hot streak". */
export function probabilityOfRepeatingStreak(decimalOddsOfEachBet) {
  return decimalOddsOfEachBet.reduce((acc, odds) => acc * impliedProbability(odds), 1);
}

if (typeof window !== 'undefined') {
  window.NoBetterMath = {
    estimateOpportunityCost, expectedLossFromWagering, futureValueOfContributions,
    impliedProbability, combinedOdds, bookmakerMargin, probabilityOfRepeatingStreak,
  };
}
