/**
 * Site-wide SEO data, shared by the app (`<Seo>`) and the build step that
 * writes per-route HTML, robots.txt, sitemap.xml and llms.txt
 * (`seo/vitePluginSeo.ts`). Plain data only: no DOM, no Node.
 */

export const DEFAULT_SITE_URL = 'https://santibet.com'

export const SITE_NAME = 'SantiBet'
export const LEGAL_NAME = 'AWA LAWA LIMITED'
export const TITLE_SUFFIX = ' | SantiBet'

export const DEFAULT_TITLE =
  'SantiBet: Predict Sports, Politics, Crypto & Entertainment in Nigeria'

export const DEFAULT_DESCRIPTION =
  'SantiBet is a Nigerian prediction market. Back YES or NO on football, ' +
  'BBNaija, elections, Afrobeats and crypto prices with Naira, USDT or USDC, ' +
  'and get paid automatically when the market resolves. 18+.'

export const SUPPORT_EMAIL = 'support@santibet.com'

export const SOCIAL_PROFILES = [
  'https://www.instagram.com/santibetng',
  'https://www.tiktok.com/@santibetng',
  'https://www.facebook.com/santibetng',
  'https://www.linkedin.com/company/santibet/',
]

/** Strip the trailing slash so paths can be appended directly. */
export const normalizeSiteUrl = (url: string | undefined) =>
  (url || DEFAULT_SITE_URL).replace(/\/+$/, '')

export const fullTitle = (title?: string) =>
  !title ? DEFAULT_TITLE : title.endsWith(SITE_NAME) ? title : `${title}${TITLE_SUFFIX}`

export interface RouteSeo {
  path: string
  title: string
  description: string
  /** Logged-in, auth or utility pages: `noindex`, left out of the sitemap. */
  noindex?: boolean
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  priority?: number
  /** Bundled Markdown to render into the static HTML for non-JS crawlers. */
  markdownFile?: string
}

const CONTENT = (
  path: string,
  title: string,
  description: string,
  markdownFile: string,
): RouteSeo => ({
  path,
  title,
  description,
  markdownFile,
  changefreq: 'monthly',
  priority: 0.4,
})

/**
 * Every fixed route. Dynamic routes (/markets/:id, /events/:id,
 * /category/:slug, /pages/:slug) set their own tags from API data.
 */
export const STATIC_ROUTES: RouteSeo[] = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    changefreq: 'hourly',
    priority: 1,
  },
  {
    path: '/live',
    title: 'Live Prediction Markets',
    description:
      'Markets trading right now on SantiBet: live football matches, ' +
      'in-play odds and fast-moving crypto prices. Back YES or NO as it happens.',
    changefreq: 'always',
    priority: 0.9,
  },
  {
    path: '/browse',
    title: 'Browse All Prediction Markets',
    description:
      'Browse every open SantiBet market by category: sports, politics, ' +
      'entertainment, crypto, business and tech. Sort by trending, newest or closing soon.',
    changefreq: 'hourly',
    priority: 0.9,
  },
  {
    path: '/leaderboard',
    title: 'Leaderboard: Top Predictors',
    description:
      'See the top SantiBet predictors ranked by winnings and points, and ' +
      'how you stack up.',
    changefreq: 'daily',
    priority: 0.5,
  },
  {
    path: '/faqs',
    title: 'Frequently Asked Questions',
    description:
      'Answers about SantiBet: how prediction markets work, deposits and ' +
      'withdrawals in Naira, USDT and USDC, how markets resolve, bonuses and account verification.',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    path: '/help-center',
    title: 'Help Center',
    description:
      'Get help with your SantiBet account, deposits, withdrawals and ' +
      'predictions, or contact our support team.',
    changefreq: 'monthly',
    priority: 0.5,
  },
  CONTENT(
    '/about-us',
    'About SantiBet',
    'SantiBet is a Nigerian prediction platform operated by AWA LAWA LIMITED ' +
      'under an Operational Accord with the Ekiti State Lotteries and Gaming Commission.',
    'about.md',
  ),
  CONTENT(
    '/contact-us',
    'Contact Us',
    'Contact SantiBet support by live chat, email or phone for help with ' +
      'your account, deposits, withdrawals or a market.',
    'contact.md',
  ),
  CONTENT(
    '/terms-of-service',
    'Terms of Service',
    'The terms and conditions for using SantiBet, the Nigerian prediction market.',
    'terms.md',
  ),
  CONTENT(
    '/privacy-policy',
    'Privacy Policy',
    'How SantiBet collects, uses and protects your personal data.',
    'privacy.md',
  ),
  CONTENT(
    '/cookie-policy',
    'Cookie Policy',
    'How santibet.com uses cookies and how to manage your cookie choices.',
    'cookie.md',
  ),
  CONTENT(
    '/responsible-gambling',
    'Responsible Gambling',
    'SantiBet tools and advice for playing responsibly: deposit limits, ' +
      'self-exclusion, and where to get help. You must be 18+ to play.',
    'responsibleGambling.md',
  ),
  CONTENT(
    '/terms/new-member-bonus',
    'New Member Bonus Terms',
    'Terms and conditions for the SantiBet ₦1,010 free deposit new member bonus.',
    'new-member-bonus.md',
  ),
  CONTENT(
    '/terms/1000-bonus',
    'First Deposit Bonus Terms',
    'Terms and conditions for the SantiBet 100% first deposit bonus.',
    '1000-bonus.md',
  ),

  // Not for search results.
  ...(
    [
      ['/signin', 'Sign In'],
      ['/signup', 'Create Account'],
      ['/forgot-password', 'Forgot Password'],
      ['/two-fa', 'Two-Factor Authentication'],
      ['/verify-account', 'Verify Account'],
      ['/agent-signup', 'Agent Signup'],
      ['/account', 'Account'],
      ['/account-profile', 'Profile'],
      ['/account-wallet', 'Wallet'],
      ['/account-portfolio', 'Portfolio'],
      ['/account-favorites', 'Favorites'],
      ['/notifications', 'Notifications'],
      ['/rewards', 'Rewards'],
      ['/bonuses', 'Bonuses'],
      ['/orders', 'Orders'],
      ['/refer-earn', 'Refer & Earn'],
    ] as const
  ).map(([path, title]) => ({
    path,
    title,
    description: DEFAULT_DESCRIPTION,
    noindex: true,
  })),
]

/** Path prefixes that are never indexed, whatever follows them. */
export const NOINDEX_PREFIXES = ['/recover-password/', '/r/', '/kyc']

export const findStaticRoute = (pathname: string) => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return STATIC_ROUTES.find((r) => r.path === path)
}
