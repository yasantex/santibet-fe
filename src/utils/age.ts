// Age gate for date-of-birth inputs. Santibet is 18+ only.
export const MIN_AGE = 18

export const UNDERAGE_MESSAGE = `You must be at least ${MIN_AGE} years old to use Santibet`

/** Latest birth date that is still MIN_AGE today (local calendar date). */
export const latestAdultBirthDate = (today = new Date()) =>
  new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate())

/** Parses "YYYY-MM-DD" (or an ISO string) as a local calendar date. */
const parseDob = (value: string | Date) => {
  if (value instanceof Date) return value
  const [y, m, d] = value.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** True when the date of birth makes the person MIN_AGE or older today. */
export const isAdult = (dob: string | Date, today = new Date()) => {
  const date = parseDob(dob)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() <= latestAdultBirthDate(today).getTime()
}
