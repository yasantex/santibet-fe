import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Plugin, ResolvedConfig } from 'vite'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  LEGAL_NAME,
  SITE_NAME,
  SOCIAL_PROFILES,
  STATIC_ROUTES,
  SUPPORT_EMAIL,
  fullTitle,
  type RouteSeo,
} from '../src/seo/site.ts'

/**
 * SantiBet is a client-rendered SPA, so the HTML a crawler downloads is an
 * empty shell. Google runs the JavaScript, but most AI/answer-engine crawlers
 * (GPTBot, ClaudeBot, PerplexityBot…) and link-preview bots don't. This
 * plugin gives them something to read:
 *
 * - index.html gets default title/description/Open Graph tags, site-wide
 *   Organization + WebSite JSON-LD, and a <noscript> summary with links.
 * - At build, each fixed route gets its own `dist/<route>/index.html` with
 *   that route's tags, and content pages get their bundled Markdown rendered
 *   into the <noscript> block. Hosts serve these before the SPA fallback.
 * - robots.txt, sitemap.xml and llms.txt are written to `dist/`.
 *
 * The app removes the `data-static-seo` tags on boot and renders its own
 * (`src/seo/Seo.tsx`), so the two never conflict.
 */

interface Options {
  siteUrl: string
  /** Absolute API base including `/api`, for the category list in the sitemap. */
  apiBaseUrl: string
  /** Site path of the share image, or '' if there isn't one. */
  ogImage: string
}

const SEO_START = '<!--seo:start-->'
const SEO_END = '<!--seo:end-->'
const NOSCRIPT_START = '<!--seo-noscript:start-->'
const NOSCRIPT_END = '<!--seo-noscript:end-->'

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const jsonLdScript = (data: object, attrs = '') =>
  `<script type="application/ld+json"${attrs}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

const between = (html: string, start: string, end: string, content: string) => {
  const a = html.indexOf(start)
  const b = html.indexOf(end)
  if (a === -1 || b === -1) throw new Error(`[seo] markers ${start} … ${end} missing from index.html`)
  return html.slice(0, a + start.length) + content + html.slice(b)
}

const INDEXABLE = STATIC_ROUTES.filter((r) => !r.noindex)

export default function seoPlugin({ siteUrl, apiBaseUrl, ogImage }: Options): Plugin {
  let config: ResolvedConfig
  const image = ogImage ? `${siteUrl}${ogImage}` : ''

  const headTags = (route: RouteSeo | undefined, canonical: boolean) => {
    const title = route && route.path !== '/' ? fullTitle(route.title) : DEFAULT_TITLE
    const description = route?.description ?? DEFAULT_DESCRIPTION
    const url = route ? `${siteUrl}${route.path === '/' ? '/' : route.path}` : ''
    const robots = route?.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'
    const a = ' data-static-seo'
    return [
      `<title${a}>${esc(title)}</title>`,
      `<meta${a} name="description" content="${esc(description)}" />`,
      `<meta${a} name="robots" content="${robots}" />`,
      canonical && url && !route?.noindex ? `<link${a} rel="canonical" href="${url}" />` : '',
      `<meta${a} property="og:site_name" content="${SITE_NAME}" />`,
      `<meta${a} property="og:type" content="website" />`,
      `<meta${a} property="og:locale" content="en_NG" />`,
      `<meta${a} property="og:title" content="${esc(title)}" />`,
      `<meta${a} property="og:description" content="${esc(description)}" />`,
      canonical && url ? `<meta${a} property="og:url" content="${url}" />` : '',
      image ? `<meta${a} property="og:image" content="${image}" />` : '',
      `<meta${a} name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta${a} name="twitter:title" content="${esc(title)}" />`,
      `<meta${a} name="twitter:description" content="${esc(description)}" />`,
      image ? `<meta${a} name="twitter:image" content="${image}" />` : '',
    ]
      .filter(Boolean)
      .join('\n    ')
  }

  const siteJsonLd = () =>
    jsonLdScript({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: SITE_NAME,
          legalName: LEGAL_NAME,
          url: `${siteUrl}/`,
          logo: `${siteUrl}/favicon.svg`,
          sameAs: SOCIAL_PROFILES,
          areaServed: { '@type': 'Country', name: 'Nigeria' },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: SUPPORT_EMAIL,
            url: `${siteUrl}/contact-us`,
            availableLanguage: 'English',
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          name: SITE_NAME,
          url: `${siteUrl}/`,
          inLanguage: 'en-NG',
          description: DEFAULT_DESCRIPTION,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
      ],
    })

  /** Links to every public section, so crawlers can discover them. */
  const siteNav = () =>
    `<nav><ul>${INDEXABLE.map(
      (r) => `<li><a href="${r.path}">${esc(r.path === '/' ? 'Home' : r.title)}</a></li>`,
    ).join('')}</ul></nav>`

  const noscript = (route: RouteSeo | undefined, bodyHtml = '') => {
    const heading = route && route.path !== '/' ? route.title : DEFAULT_TITLE
    const description = route?.description ?? DEFAULT_DESCRIPTION
    return (
      `<noscript><main><h1>${esc(heading)}</h1><p>${esc(description)}</p>` +
      `${bodyHtml}<p>Enable JavaScript to use ${SITE_NAME}.</p></main>${siteNav()}</noscript>`
    )
  }

  const renderMarkdown = async (file: string) => {
    const md = await readFile(path.join(config.publicDir, 'contents', file), 'utf8')
    return renderToStaticMarkup(
      createElement(Markdown, { remarkPlugins: [remarkGfm], skipHtml: true }, md),
    )
  }

  /** Top-level categories with markets, for the sitemap. Optional: a failed
   *  fetch (offline build, API down) just leaves them out. */
  const fetchCategories = async (): Promise<string[]> => {
    try {
      const res = await fetch(`${apiBaseUrl}/lobby/categories`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const list = (await res.json()) as {
        slug: string
        parentSlug: string | null
        eventCount: number
      }[]
      return list
        .filter((c) => !c.parentSlug && c.eventCount > 0)
        .map((c) => c.slug.toLowerCase())
    } catch (error) {
      config.logger.warn(`[seo] categories left out of sitemap: ${String(error)}`)
      return []
    }
  }

  const sitemap = (categories: string[]) => {
    const today = new Date().toISOString().slice(0, 10)
    const entry = (loc: string, changefreq = 'daily', priority = 0.5) =>
      `  <url><loc>${esc(loc)}</loc><lastmod>${today}</lastmod>` +
      `<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(1)}</priority></url>`
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...INDEXABLE.map((r) =>
        entry(`${siteUrl}${r.path}`, r.changefreq, r.priority ?? 0.5),
      ),
      ...categories.map((slug) =>
        entry(`${siteUrl}/category/${encodeURIComponent(slug)}`, 'hourly', 0.8),
      ),
      '</urlset>',
      '',
    ].join('\n')
  }

  const robots = () => {
    const disallow = ['/api/', '/r/', '/kyc', '/recover-password/']
      .map((p) => `Disallow: ${p}`)
      .join('\n')
    // AI crawlers are named so the intent is explicit: SantiBet wants to be
    // cited in AI answers. Each group repeats the rules (groups don't inherit).
    const agents = [
      '*',
      'Googlebot',
      'Bingbot',
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-User',
      'Claude-SearchBot',
      'PerplexityBot',
      'Google-Extended',
      'Applebot-Extended',
    ]
    return (
      agents.map((a) => `User-agent: ${a}\nAllow: /\n${disallow}`).join('\n\n') +
      `\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    )
  }

  /** https://llmstxt.org: a plain summary for language models. */
  const llmsTxt = () => {
    const link = (r: RouteSeo) => `- [${r.title}](${siteUrl}${r.path}): ${r.description}`
    const content = INDEXABLE.filter((r) => r.markdownFile)
    const sections = INDEXABLE.filter((r) => !r.markdownFile && r.path !== '/')
    return [
      `# ${SITE_NAME}`,
      '',
      `> ${DEFAULT_DESCRIPTION}`,
      '',
      'Key facts:',
      '',
      `- ${SITE_NAME} is a prediction market for Nigeria: every market is a YES/NO (or multiple-choice) question about a real-world event, priced by what players back.`,
      '- Categories: sports (football, basketball and more), politics and elections, entertainment (e.g. BBNaija, Afrobeats charts), crypto prices, business, economy and tech.',
      '- Wallets fund and withdraw in Nigerian Naira (NGN), USDT or USDC.',
      '- Winnings are paid automatically when a market resolves.',
      `- Operated by ${LEGAL_NAME}, a company registered in Nigeria, under an Operational Accord with the Ekiti State Lotteries and Gaming Commission.`,
      '- Players must be 18 or older.',
      `- Support: ${SUPPORT_EMAIL}, ${siteUrl}/contact-us`,
      '',
      '## Markets',
      '',
      ...sections.map(link),
      '',
      '## About, policies and terms',
      '',
      ...content.map(link),
      '',
    ].join('\n')
  }

  return {
    name: 'santibet-seo',

    configResolved(resolved) {
      config = resolved
    },

    transformIndexHtml(html) {
      const home = STATIC_ROUTES.find((r) => r.path === '/')
      // index.html is also the SPA fallback for every unknown URL, so it
      // carries no canonical/og:url; the app adds the right one at runtime.
      html = between(html, SEO_START, SEO_END, `\n    ${headTags(home, false)}\n    ${siteJsonLd()}\n    `)
      return between(html, NOSCRIPT_START, NOSCRIPT_END, noscript(home))
    },

    async closeBundle() {
      if (config.command !== 'build') return
      const outDir = path.resolve(config.root, config.build.outDir)
      const shell = await readFile(path.join(outDir, 'index.html'), 'utf8')

      for (const route of STATIC_ROUTES) {
        if (route.path === '/') continue
        const body = route.markdownFile ? await renderMarkdown(route.markdownFile) : ''
        let html = between(shell, SEO_START, SEO_END, `\n    ${headTags(route, true)}\n    ${siteJsonLd()}\n    `)
        html = between(html, NOSCRIPT_START, NOSCRIPT_END, noscript(route, body))
        const dir = path.join(outDir, route.path)
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, 'index.html'), html)
      }

      const categories = await fetchCategories()
      await writeFile(path.join(outDir, 'sitemap.xml'), sitemap(categories))
      await writeFile(path.join(outDir, 'robots.txt'), robots())
      await writeFile(path.join(outDir, 'llms.txt'), llmsTxt())
      config.logger.info(
        `[seo] ${STATIC_ROUTES.length - 1} route pages, sitemap (${INDEXABLE.length + categories.length} URLs), robots.txt, llms.txt`,
      )
    },
  }
}
