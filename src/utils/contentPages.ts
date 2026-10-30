/**
 * Content pages come from the API (`/pages`), but every page starts
 * unpublished. These are the pages with a route of their own, each with the
 * bundled Markdown to show until an admin publishes it. Any other slug lives
 * at `/pages/:slug` with no FE change needed.
 *
 * When an admin creates one of these pages, the only thing to do here is make
 * its `slug` match the one the admin used.
 */
export interface KnownContentPage {
  slug: string
  route: string
  title: string
  /** Footer label while the page isn't published. */
  label: string
  fallbackFile: string
  /** Linked from elsewhere (e.g. a bonus), not listed in the footer. */
  hideFromFooter?: boolean
}

export const KNOWN_CONTENT_PAGES: KnownContentPage[] = [
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
  {
    slug: 'about',
    route: '/about-us',
    title: 'About SantiBet',
    label: 'About',
    fallbackFile: '/contents/about.md',
  },
  {
    slug: 'cookie-policy',
    route: '/cookie-policy',
    title: 'Cookie Policy',
    label: 'Cookie Policy',
    fallbackFile: '/contents/cookie.md',
  },
  {
    slug: 'responsible-gambling',
    route: '/responsible-gambling',
    title: 'Responsible Gambling',
    label: 'Responsible Gambling',
    fallbackFile: '/contents/responsibleGambling.md',
  },
  // Bonus T&Cs: the bonus API's `termsUrl` points at these routes. Publish a
  // page with the same slug in admin to replace the bundled summary.
  {
    slug: 'new-member-bonus',
    route: '/terms/new-member-bonus',
    title: '₦1,010 Free Deposit — Terms & Conditions',
    label: 'New member bonus terms',
    fallbackFile: '/contents/new-member-bonus.md',
    hideFromFooter: true,
  },
  {
    slug: '1000-bonus',
    route: '/terms/1000-bonus',
    title: '100% First Deposit Bonus — Terms & Conditions',
    label: 'First deposit bonus terms',
    fallbackFile: '/contents/1000-bonus.md',
    hideFromFooter: true,
  },
]

export const findKnownContentPage = (slug: string) =>
  KNOWN_CONTENT_PAGES.find((p) => p.slug === slug)

export const contentPageRoute = (slug: string) =>
  findKnownContentPage(slug)?.route ?? `/pages/${encodeURIComponent(slug)}`
