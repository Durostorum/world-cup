import { useEffect, useState } from 'react'
import { api } from './api'
import { mergeWithFixtureCatalog } from './match-catalog'
import { sortByKickoff } from './match-utils'
import type { Match } from './types'

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getMatches()
      .then((r) => setMatches(mergeWithFixtureCatalog(r.matches).sort(sortByKickoff)))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load matches')
        setMatches(mergeWithFixtureCatalog([]).sort(sortByKickoff))
      })
      .finally(() => setLoading(false))
  }, [])

  return { matches, error, loading }
}
