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
    slug: 'faq',
    route: '/faqs',
    title: 'Frequently Asked Questions',
    label: 'FAQs',
    fallbackFile: '/contents/faq.md',
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

export interface MarkdownSection {
  heading: string
  body: string
}

/**
 * Splits Markdown on `## ` headings — the FAQ uses one per question. Text
 * before the first heading comes back as `intro`. Headings inside fenced code
 * blocks are left alone.
 */
export const splitMarkdownSections = (markdown: string) => {
  const intro: string[] = []
  const sections: { heading: string; lines: string[] }[] = []
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const heading = !inFence && /^##\s+(.+?)\s*#*\s*$/.exec(line)
    if (heading) {
      sections.push({ heading: heading[1], lines: [] })
    } else if (sections.length) {
      sections[sections.length - 1].lines.push(line)
    } else {
      intro.push(line)
    }
  }

  return {
    intro: intro.join('\n').trim(),
    sections: sections.map<MarkdownSection>((s) => ({
      heading: s.heading,
      body: s.lines.join('\n').trim(),
    })),
  }
}
