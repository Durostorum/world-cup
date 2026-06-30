export const BETTING_TIMEZONE = 'America/New_York'

export function flagUrl(fifaCode: string): string {
  const base = import.meta.env.VITE_FLAG_CDN_BASE ?? 'https://flagcdn.com/w40'
  const code = fifaCode.toLowerCase().replace('_', '-')
  return `${base}/${code}.png`
}

export function flagUrlLarge(fifaCode: string): string {
  const code = fifaCode.toLowerCase().replace('_', '-')
  return `https://flagcdn.com/w80/${code}.png`
}
