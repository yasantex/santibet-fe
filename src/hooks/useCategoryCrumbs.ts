import { useMemo } from 'react'
import { useLobbyCategories } from '../data_layer/markets'
import type { Crumb } from '../components/globals/PageNav'

/**
 * Breadcrumbs for a category, matching the header's links: a subcategory
 * ("Fed & Rates") sits under its parent ("Economy") and links to
 * `/category/<parent>?sub=<slug>`.
 */
export const useCategoryCrumbs = (slug?: string, name?: string): Crumb[] => {
  const { data: categories } = useLobbyCategories()
  return useMemo(() => {
    const key = slug?.toLowerCase()
    if (!key && !name) return []
    const cats = categories ?? []
    const cat = key ? cats.find((c) => c.slug.toLowerCase() === key) : undefined
    const label = cat?.name ?? name ?? ''
    const parentSlug = cat?.parentSlug?.toLowerCase()
    const parent = parentSlug
      ? cats.find((c) => c.slug.toLowerCase() === parentSlug)
      : undefined
    if (parent && key) {
      return [
        { label: parent.name, href: `/category/${parentSlug}` },
        { label, href: `/category/${parentSlug}?sub=${key}` },
      ]
    }
    if (!label) return []
    // Unknown to the nav (e.g. the "General" fallback): name it, don't link it.
    return [{ label, href: cat ? `/category/${key}` : undefined }]
  }, [categories, slug, name])
}
