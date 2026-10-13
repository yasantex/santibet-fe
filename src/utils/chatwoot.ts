/**
 * Thin, typed wrapper around the Chatwoot website widget SDK.
 *
 * The SDK is a third-party script (`<baseUrl>/packs/js/sdk.js`) that boots an
 * iframe and exposes `window.$chatwoot` once it fires `chatwoot:ready`. Every
 * call made before that is queued and flushed on ready, so callers never have
 * to care whether the widget has loaded yet.
 *
 * Config comes from env (see .env.example). With no website token the whole
 * integration is a no-op — `isChatwootConfigured` is false and every call is
 * dropped — so local dev and preview builds work without a Chatwoot inbox.
 */

const BASE_URL = (import.meta.env.VITE_APP_CHATWOOT_BASE_URL || '').replace(
  /\/+$/,
  '',
)
const WEBSITE_TOKEN = import.meta.env.VITE_APP_CHATWOOT_WEBSITE_TOKEN || ''

export const isChatwootConfigured = Boolean(BASE_URL && WEBSITE_TOKEN)

/** Attribute values Chatwoot accepts for contact / conversation attributes. */
export type ChatwootAttributeValue = string | number | boolean | null

export type ChatwootAttributes = Record<string, ChatwootAttributeValue>

export interface ChatwootUser {
  email?: string
  name?: string
  avatar_url?: string
  /** Must be E.164 (`+234…`) — Chatwoot rejects anything else. */
  phone_number?: string
  /**
   * HMAC-SHA256(identifier, inbox HMAC token), computed by OUR backend. When
   * the inbox enforces identity validation, setUser without it is rejected.
   */
  identifier_hash?: string
  description?: string
}

interface ChatwootSDK {
  hasLoaded: boolean
  isOpen?: boolean
  toggle: (state?: 'open' | 'close') => void
  toggleBubbleVisibility: (visibility: 'show' | 'hide') => void
  setUser: (identifier: string, user: ChatwootUser) => void
  setCustomAttributes: (attributes: ChatwootAttributes) => void
  deleteCustomAttribute: (key: string) => void
  setConversationCustomAttributes: (attributes: ChatwootAttributes) => void
  setLabel: (label: string) => void
  removeLabel: (label: string) => void
  setLocale: (locale: string) => void
  reset: () => void
}

interface ChatwootSettings {
  hideMessageBubble?: boolean
  position?: 'left' | 'right'
  locale?: string
  type?: 'standard' | 'expanded_bubble'
  darkMode?: 'light' | 'auto'
  showPopoutButton?: boolean
  showUnreadMessagesDialog?: boolean
}

declare global {
  interface Window {
    $chatwoot?: ChatwootSDK
    chatwootSettings?: ChatwootSettings
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void
    }
  }
}

type PendingCall = (sdk: ChatwootSDK) => void

let loadPromise: Promise<void> | null = null
let ready = false
const pending: PendingCall[] = []

const flush = () => {
  const sdk = window.$chatwoot
  if (!sdk) return
  while (pending.length) {
    const call = pending.shift()!
    try {
      call(sdk)
    } catch (error) {
      if (import.meta.env.DEV) console.error('[chatwoot]', error)
    }
  }
}

/** Runs `call` now if the widget is ready, otherwise once it is. */
const withSdk = (call: PendingCall) => {
  if (!isChatwootConfigured) return
  if (ready && window.$chatwoot) {
    try {
      call(window.$chatwoot)
    } catch (error) {
      if (import.meta.env.DEV) console.error('[chatwoot]', error)
    }
    return
  }
  pending.push(call)
}

/**
 * Injects the SDK once. Safe to call repeatedly; resolves when the widget has
 * fired `chatwoot:ready` (or rejects if the script fails to load).
 */
export const loadChatwoot = (settings: ChatwootSettings = {}) => {
  if (!isChatwootConfigured) return Promise.resolve()
  if (loadPromise) return loadPromise

  window.chatwootSettings = {
    // We render our own launcher (SupportLauncher) so it can sit clear of the
    // bet-slip FAB, back-to-top button and the mobile bottom nav.
    hideMessageBubble: true,
    position: 'right',
    locale: 'en',
    type: 'standard',
    darkMode: 'auto',
    showPopoutButton: false,
    showUnreadMessagesDialog: true,
    ...settings,
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const onReady = () => {
      ready = true
      flush()
      resolve()
    }
    window.addEventListener('chatwoot:ready', onReady, { once: true })

    const script = document.createElement('script')
    script.src = `${BASE_URL}/packs/js/sdk.js`
    script.async = true
    script.defer = true
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken: WEBSITE_TOKEN,
        baseUrl: BASE_URL,
      })
    }
    script.onerror = () => {
      window.removeEventListener('chatwoot:ready', onReady)
      // Allow a later retry (e.g. the user taps the launcher once back online).
      loadPromise = null
      script.remove()
      reject(new Error('Failed to load the Chatwoot widget'))
    }
    document.body.appendChild(script)
  })

  return loadPromise
}

export const isChatwootReady = () => ready

export const chatwoot = {
  open: () => withSdk((sdk) => sdk.toggle('open')),
  close: () => withSdk((sdk) => sdk.toggle('close')),
  setUser: (identifier: string, user: ChatwootUser) =>
    withSdk((sdk) => sdk.setUser(identifier, user)),
  setCustomAttributes: (attributes: ChatwootAttributes) =>
    withSdk((sdk) => sdk.setCustomAttributes(attributes)),
  setConversationCustomAttributes: (attributes: ChatwootAttributes) =>
    withSdk((sdk) => sdk.setConversationCustomAttributes(attributes)),
  setLabel: (label: string) => withSdk((sdk) => sdk.setLabel(label)),
  setLocale: (locale: string) => withSdk((sdk) => sdk.setLocale(locale)),
  /**
   * Clears the widget's contact + conversation cookies. Must run on logout so
   * the next person on this browser never sees the previous user's chats.
   */
  reset: () => {
    // Drop anything queued for the old identity before resetting.
    pending.length = 0
    withSdk((sdk) => sdk.reset())
  },
}

/** Chatwoot only accepts E.164 phone numbers; anything else is dropped. */
export const toE164 = (phone: string | null | undefined) => {
  if (!phone) return undefined
  const compact = phone.replace(/[\s()-]/g, '')
  if (/^\+[1-9]\d{6,14}$/.test(compact)) return compact
  // Local Nigerian format (0803…) → +234803…
  if (/^0[789]\d{9}$/.test(compact)) return `+234${compact.slice(1)}`
  if (/^234[789]\d{9}$/.test(compact)) return `+${compact}`
  return undefined
}
