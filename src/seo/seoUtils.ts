import { normalizeSiteUrl } from './site'

export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_APP_SITE_URL)

/** `/og-image.png` when `public/og-image.png` exists (see vite.config.ts). */
export const DEFAULT_IMAGE = __OG_IMAGE__ ? `${SITE_URL}${__OG_IMAGE__}` : ''

export const absoluteUrl = (pathOrUrl: string) =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl}`

/** Collapse whitespace and cut at a word boundary, for meta descriptions. */
export const toDescription = (text: string | null | undefined, max = 160) => {
  const clean = (text ?? '').replace(/[#*_`>[\]]/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`
}
