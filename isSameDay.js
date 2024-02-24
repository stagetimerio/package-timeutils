import { formatInTimeZone } from 'date-fns-tz'

const localTz = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone

/**
 * Checks if two ISO timestamp strings are on the same day in a given timezone.
 *
 * @param {Date} date1
 * @param {Date} date2
 * @param {string} timezone - The IANA timezone string
 * @returns {boolean} - True if both dates are on the same day in the specified timezone; false otherwise
 */
export default function isSameDay (date1, date2, timezone = localTz) {
  const dateString1 = formatInTimeZone(date1, timezone, 'yyyy-MM-dd')
  const dateString2 = formatInTimeZone(date2, timezone, 'yyyy-MM-dd')

  return dateString1 === dateString2
}
