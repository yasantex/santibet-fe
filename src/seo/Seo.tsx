import { DEFAULT_DESCRIPTION, SITE_NAME, fullTitle } from './site'
import { DEFAULT_IMAGE, absoluteUrl } from './seoUtils'

export interface SeoProps {
  /** Page title without the "| SantiBet" suffix. */
  title?: string
  description?: string
  /** Canonical path, no query string (e.g. `/markets/123`). */
  path?: string
  image?: string | null
  noindex?: boolean
  type?: 'website' | 'article'
  /** Schema.org objects, rendered as JSON-LD. */
  jsonLd?: object | object[]
}

/**
 * Title, description, canonical, Open Graph and Twitter tags for the current
 * page. React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` and
 * removes them when the page unmounts. Render exactly one per page: the
 * layout's `RouteSeo` covers fixed routes, dynamic pages render their own.
 */
const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  noindex = false,
  type = 'website',
  jsonLd,
}: SeoProps) => {
  const pageTitle = fullTitle(title)
  const url = path ? absoluteUrl(path) : undefined
  const img = image ? absoluteUrl(image) : DEFAULT_IMAGE

  return (
    <>
      <title>{pageTitle}</title>
      <meta name='description' content={description} />
      <meta
        name='robots'
        content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}
      />
      {url && !noindex && <link rel='canonical' href={url} />}

      <meta property='og:site_name' content={SITE_NAME} />
      <meta property='og:type' content={type} />
      <meta property='og:title' content={pageTitle} />
      <meta property='og:description' content={description} />
      {url && <meta property='og:url' content={url} />}
      {img && <meta property='og:image' content={img} />}

      <meta name='twitter:card' content={img ? 'summary_large_image' : 'summary'} />
      <meta name='twitter:title' content={pageTitle} />
      <meta name='twitter:description' content={description} />
      {img && <meta name='twitter:image' content={img} />}

      {jsonLd && !noindex && <JsonLd data={jsonLd} />}
    </>
  )
}

/** Schema.org structured data. `<` is escaped so text can't close the tag. */
export const JsonLd = ({ data }: { data: object | object[] }) => (
  <script
    type='application/ld+json'
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, '\\u003c'),
    }}
  />
)

export default Seo
