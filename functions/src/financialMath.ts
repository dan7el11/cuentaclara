// Espejo mínimo de src/utils/financialMath.ts. Se duplica a propósito en
// vez de compartir un paquete porque el cliente y las functions son dos
// proyectos npm separados; si esto crece, vale la pena moverlo a un
// paquete compartido (workspace) en vez de mantener dos copias.

export function estimateOpportunityCost(
  totalContributed: number,
  years: number,
  annualReturnAssumed = 0.08
) {
  const futureValue = totalContributed * Math.pow(1 + annualReturnAssumed, years)
  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalContributed,
    annualReturnAssumed,
    years,
  }
}
