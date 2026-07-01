export function probabilityToDecimalOdds(p: number): number {
  const clamped = Math.min(Math.max(p, 0.02), 0.98)
  return Math.min(Math.max(1 / clamped, 1.01), 50)
}

export function oddsToImpliedPercent(odds: number): number {
  return Math.round((100 / odds) * 10) / 10
}

export function calculatePayout(stake: number, odds: number): number {
  return Math.round(stake * odds)
}
