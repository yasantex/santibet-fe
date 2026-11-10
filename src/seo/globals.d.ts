/** Set by vite.config.ts: `/og-image.png` if `public/og-image.png` exists, else ''. */
declare const __OG_IMAGE__: string

interface ImportMetaEnv {
  /** Public origin used for canonical URLs, e.g. https://santibet.com. */
  readonly VITE_APP_SITE_URL?: string
}
