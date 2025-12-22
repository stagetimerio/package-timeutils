import { isSameDay as fnsIsSameDay } from 'date-fns'
import { tz } from '@date-fns/tz'

const localTz = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone

/**
 * Checks if two ISO timestamp strings are on the same day in a given timezone.
 *
 * @param {Date} date1
 * @param {Date} date2
 * @param {string} timezone - The IANA timezone string
 * @returns {boolean} - True if both dates are on the same day in the specified timezone; false otherwise
 */
export default function isSameDay(
  date1: Date,
  date2: Date,
  timezone: string | undefined = localTz
): boolean {
  return fnsIsSameDay(date1, date2, { in: tz(timezone ?? 'UTC') })
}
