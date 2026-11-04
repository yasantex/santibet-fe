// Club-name filler that never identifies the team ("FC", "SK", "U23"…).
const FILLER = new Set([
  'fc', 'sk', 'cf', 'cd', 'fk', 'ac', 'sc', 'afc', 'cfc', 'club', 'de', 'del',
  'la', 'el', 'the', 'sv', 'bk', 'if', 'ud', 'sd', 'rc', 'rcd', 'ca', 'as',
  'ss', 'us', 'vfb', 'vfl', 'tsg', 'fsv', 'sl', 'nk', 'hnk', 'gnk', 'ks',
  'u17', 'u19', 'u20', 'u21', 'u23', 'w', 'women',
])

const letters = (word: string) => word.replace(/[^\p{L}]/gu, '')

const significantWords = (name: string) => {
  const words = name.split(/\s+/).map(letters).filter(Boolean)
  const kept = words.filter((w) => !FILLER.has(w.toLowerCase()))
  return kept.length ? kept : words
}

/** "Galatasaray SK" → "GAL", "VfB Stuttgart" → "STU". */
const abbreviate = (name: string) =>
  (significantWords(name)[0] ?? name).slice(0, 3).toUpperCase()

/** Two-word fallback for a clash: "Manchester City" → "MCI". */
const initialsAbbr = (name: string) => {
  const [first, second] = significantWords(name)
  return second
    ? (first[0] + second.slice(0, 2)).toUpperCase()
    : abbreviate(name)
}

/** Teams from a match title: "A vs. B" (a "- More Markets" suffix dropped). */
export const teamsFromTitle = (title: string) =>
  title
    .replace(/\s+-\s+More Markets$/i, '')
    .split(/\s+vs\.?\s+/i)
    .map((t) => t.trim())
    .filter(Boolean)

/**
 * Short codes for a match's teams, unique within the match. The API's own
 * code wins (`known`, e.g. API-Sports "VAS"); otherwise one is made from the
 * name, since Polymarket imports don't carry codes.
 */
export const teamCodes = (
  teams: string[],
  known: (string | null | undefined)[] = [],
) => {
  if (teams.length && teams.every((_, i) => known[i]))
    return known.map((k) => k!.toUpperCase())
  const codes = teams.map(abbreviate)
  const clash = codes.some((c, i) => codes.indexOf(c) !== i)
  return clash ? teams.map(initialsAbbr) : codes
}

/**
 * Shorten an outcome label for a selection button: a team name becomes its
 * code ("Galatasaray SK" → "GAL", "Galatasaray SK -1.5" → "GAL -1.5"); a draw
 * reads "Draw"; anything else (Yes, O 2.5…) is left as is.
 */
export const shortOutcomeLabel = (
  teams: string[],
  known: (string | null | undefined)[] = [],
) => {
  const codes = teamCodes(teams, known)
  return (label: string) => {
    if (/^draw\b/i.test(label)) return 'Draw'
    const lower = label.toLowerCase()
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i].toLowerCase()
      if (lower === team) return codes[i]
      if (lower.startsWith(`${team} `)) return codes[i] + label.slice(team.length)
    }
    return label
  }
}
