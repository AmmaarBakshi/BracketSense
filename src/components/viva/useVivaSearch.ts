import { useMemo } from 'react'
import { VIVA_CARDS, type VivaCategory } from '../../learning/viva'

/** Filter viva cards by free text (question + answer) and category. */
export function useVivaSearch(query: string, category: VivaCategory | 'All') {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    return VIVA_CARDS.filter((c) => (category === 'All' || c.category === category) && (!q || `${c.q} ${c.a.join(' ')} ${c.hook ?? ''}`.toLowerCase().includes(q)))
  }, [query, category])
}
