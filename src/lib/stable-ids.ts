/** Deterministic UUIDs shared by the client catalog and database seed. */

export function stableTeamId(fifaCode: string) {
  const hex = [...fifaCode.toLowerCase().padEnd(3, '0')]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(12, '0')
    .slice(0, 12)
  return `00000000-0000-4000-a000-${hex}`
}

export function stableMatchId(fifaMatchNumber: number) {
  return `00000000-0000-4000-8000-${String(fifaMatchNumber).padStart(12, '0')}`
}
