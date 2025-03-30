import { getTimezoneOffset } from './getTimezoneOffset.js'
import { isValidTimezone } from './isValidTimezone.js'
import { addMilliseconds } from 'date-fns/addMilliseconds'

/**
 * Get the Date of 0:00 today in the given timezone
 *
 * Note: In some countries the DST change happens at 3AM, so we need to get a new offset for the "revert to UTC" operation.
 *
 * @param  {string} [timezone] - assumes 'UTC' if empty
 * @param  {Date} [now] - provide a date for 'today', must be in UTC, used for testing
 * @return {Date}
 */
export default function getToday (timezone = undefined, now = undefined) {
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

  // Revert to UTC (zoned -> UTC)
  const outputOffset = tz ? getTimezoneOffset(tz, inZone) : 0
  return addMilliseconds(inZone, -outputOffset)
}
