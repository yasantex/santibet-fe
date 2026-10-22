/**
 * Content pages come from the API (`/pages`), but every page starts
 * unpublished. These are the pages that existed before the API, with the
 * routes they already live on and the bundled Markdown to show until an admin
 * publishes them. Any other slug lives at `/pages/:slug`.
 */
export interface LegacyContentPage {
  slug: string
  route: string
  title: string
  /** Footer label while the page isn't published. */
  label: string
  fallbackFile: string
}

export const LEGACY_CONTENT_PAGES: LegacyContentPage[] = [
  {
    slug: 'privacy',
    route: '/privacy-policy',
    title: 'Privacy Policy',
    label: 'Privacy Policy',
    fallbackFile: '/contents/privacy.md',
  },
  {
    slug: 'terms',
    route: '/terms-of-service',
    title: 'Terms of Service',
    label: 'Terms & Conditions',
    fallbackFile: '/contents/terms.md',
  },
  {
    slug: 'contact',
    route: '/contact-us',
    title: 'Contact Us',
    label: 'Contact Support',
    fallbackFile: '/contents/contact.md',
  },
]

export const findLegacyContentPage = (slug: string) =>
  LEGACY_CONTENT_PAGES.find((p) => p.slug === slug)

export const contentPageRoute = (slug: string) =>
  findLegacyContentPage(slug)?.route ?? `/pages/${encodeURIComponent(slug)}`
