import { isAxiosError } from 'axios'

/**
 * KYC helpers shared by the ID-number check and the document upload: input
 * rules per ID type, and turning API failures into messages a player can act
 * on. Raw validation text ("body/idNumber must match pattern…") never reaches
 * the screen (SB-007).
 */

export type KycIdType = 'BVN' | 'NIN' | 'VOTERS_CARD' | 'DRIVERS_LICENSE'

type IdRule = { pattern: RegExp; hint: string }

const ID_RULES: Record<KycIdType, IdRule> = {
  NIN: { pattern: /^\d{11}$/, hint: 'Your NIN is 11 digits.' },
  BVN: { pattern: /^\d{11}$/, hint: 'Your BVN is 11 digits.' },
  VOTERS_CARD: {
    pattern: /^[A-Z0-9]{9,23}$/,
    hint: 'Use the VIN printed on your voter’s card, letters and numbers only.',
  },
  DRIVERS_LICENSE: {
    pattern: /^[A-Z0-9]{6,20}$/,
    hint: 'Use the licence number printed on your card, letters and numbers only.',
  },
}

/** Strip the spaces and dashes people type or paste, and upper-case it. */
export const normalizeIdNumber = (raw: string) =>
  raw.replace(/[\s-]/g, '').toUpperCase()

/** Why an ID number can't be right for its type, or '' when it looks fine. */
export const idNumberError = (idType: string, raw: string): string => {
  const rule = ID_RULES[idType as KycIdType]
  const value = normalizeIdNumber(raw)
  if (!value || !rule) return ''
  return rule.pattern.test(value) ? '' : rule.hint
}

// Fastify/AJV schema text, e.g. "body/idNumber must NOT have more than 32
// characters" or "querystring must have required property 'x'".
const SCHEMA_ERROR =
  /\b(body|querystring|params)\/|\bmust (match (pattern|format)|not have|have required|be equal|be (string|number|integer|object))|\bschema\b/i

const FIELD_MESSAGES: [RegExp, string][] = [
  [/idnumber/i, 'That ID number doesn’t look right. Check it and try again.'],
  [/idtype|type\b/i, 'Choose the type of ID you’re using.'],
  [/dateofbirth|dob/i, 'Enter your date of birth exactly as it is on your ID.'],
  [/firstname|lastname|name/i, 'Enter your name exactly as it is on your ID.'],
  [/file|selfie|mime|size/i, 'We couldn’t read that file. Upload a clear JPG, PNG, WEBP or PDF under 5 MB.'],
]

/** The API's `message`, if the error carries one. */
const apiMessage = (error: unknown): string =>
  isAxiosError(error)
    ? String(error.response?.data?.message ?? '')
    : error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

/**
 * A readable reason for a failed KYC request. `fallback` covers an empty or
 * unrecognised message.
 */
export const kycErrorMessage = (
  error: unknown,
  fallback = 'We couldn’t verify your details. Check them and try again.',
): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (!error.response)
      return 'We couldn’t reach the server. Check your connection and try again.'
    if (status === 413)
      return 'That file is too large. Upload one under 5 MB.'
    if (status === 415)
      return 'That file type isn’t supported. Upload a JPG, PNG, WEBP or PDF.'
    if (status === 429)
      return 'Too many attempts. Wait a few minutes, then try again.'
    if (status && status >= 500)
      return 'Verification is unavailable right now. Try again in a few minutes, or upload your ID instead.'
  }
  const message = apiMessage(error).trim()
  if (!message) return fallback
  if (SCHEMA_ERROR.test(message)) {
    const match = FIELD_MESSAGES.find(([re]) => re.test(message))
    return match ? match[1] : fallback
  }
  return message
}

/** Smallest side, in pixels, a photo of an ID can have and still be read. */
const MIN_ID_IMAGE_SIDE = 400

/**
 * Checks an ID photo can be opened and is big enough to read. PDFs are left
 * to the server. Resolves to an error message, or '' when it's fine.
 */
export const checkIdImageReadable = (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) return Promise.resolve('')
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      resolve(
        side < MIN_ID_IMAGE_SIDE
          ? 'This photo is too small to read. Take a closer, sharper photo of your ID.'
          : '',
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('We couldn’t open this image. Try another photo or a PDF scan.')
    }
    img.src = url
  })
}
