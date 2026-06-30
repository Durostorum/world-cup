import { flagUrl, flagUrlLarge } from '../lib/flags'

interface TeamFlagProps {
  fifaCode: string
  name: string
  size?: 'sm' | 'lg'
  className?: string
}

export function TeamFlag({ fifaCode, name, size = 'sm', className = '' }: TeamFlagProps) {
  const src = size === 'lg' ? flagUrlLarge(fifaCode) : flagUrl(fifaCode)
  const imgClass = size === 'lg' ? 'h-10 w-14 rounded object-cover shadow-sm' : 'h-4 w-6 rounded-sm object-cover shadow-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${className}`}>
      <img src={src} alt="" className={imgClass} loading="lazy" />
      {name}
    </span>
  )
}

export function TeamFlagOnly({ fifaCode, size = 'lg' }: { fifaCode: string; size?: 'sm' | 'lg' }) {
  const src = size === 'lg' ? flagUrlLarge(fifaCode) : flagUrl(fifaCode)
  const imgClass = size === 'lg' ? 'h-10 w-14 rounded object-cover shadow-sm' : 'h-4 w-6 rounded-sm object-cover shadow-sm'
  return <img src={src} alt="" className={imgClass} loading="lazy" />
}
