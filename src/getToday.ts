import { getTimezoneOffset } from './getTimezoneOffset'
import { isValidTimezone } from './isValidTimezone'
import { addMilliseconds } from 'date-fns/addMilliseconds'

/**
 * Get the Date of 0:00 today in the given timezone
 *
 * @param  {string} [timezone] - assumes 'UTC' if empty
 * @param  {Date} [now] - provide a date for 'today', must be in UTC, used for testing
 * @return {Date}
 */
export function getToday (
  timezone: string | undefined = undefined,
  now: Date | undefined = undefined,
): Date {
  if (now !== undefined && !(now instanceof Date)) {
    throw new Error('The 2nd argument must be undefined or an instance of date.')
  }

  // Validate timezone - default to UTC if invalid or undefined
  const tz = timezone && isValidTimezone(timezone) ? timezone : 'UTC'

  // Determine now (new Date() carries no timezone info, always in UTC)
  const inUTC = now || new Date()

  // Apply target timezone (UTC -> zoned)
  const inputOffset = tz ? getTimezoneOffset(tz, inUTC) : 0
  const inZone = addMilliseconds(inUTC, inputOffset)

  // Move time to 0:00:00
  inZone.setUTCHours(0, 0, 0, 0)

  // Revert to UTC (zoned -> UTC). The first offset is read up to 14h away from
  // local midnight and can sit across a DST change; the second read is at midnight.
  const first = addMilliseconds(inZone, -getTimezoneOffset(tz, inZone))
  const second = addMilliseconds(inZone, -getTimezoneOffset(tz, first))
  if (second.getTime() + getTimezoneOffset(tz, second) === inZone.getTime()) return second

  // Midnight is skipped by a DST change (e.g. Chile, Cuba): the later instant is the first of the day.
  return first > second ? first : second
}
