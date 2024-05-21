import { getTimezoneOffset } from 'date-fns-tz/getTimezoneOffset'
import { addMilliseconds } from 'date-fns/addMilliseconds'

const localTz = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone

/**
 * Converts a date object to a specified timezone, taking into account the source timezone.
 *
 * @param {Date|string} date - The date to be converted, assumed to be in the source timezone.
 * @param {string} [targetTz='UTC'] - The target timezone IANA string to convert the date to.
 * @param {string} [sourceTz=localTz] - The source timezone IANA string of the date. Defaults to the local environment's timezone.
 * @returns {Date} - The date converted to the target timezone.
 *
 * @example
 * // Convert a date from Europe/Berlin timezone to America/Los_Angeles timezone
 * dateToTimezone(new Date('2024-02-22T08:00:00.000Z'), 'America/Los_Angeles', 'Europe/Berlin');
 */
export default function dateToTimezone (date, targetTz = 'UTC', sourceTz = localTz) {
  // Assume date in local environment
  // e.g.2024-02-22T08:00:00.000Z (9 AM Europe/Berlin)
  const localTime = date

  // Convert to UTC
  // e.g. 2024-02-22T08:00:00.000Z (9 AM Europe/Berlin) -> 2024-02-22T09:00:00.000Z (9 AM UTC)
  const localOffset = getTimezoneOffset(sourceTz, localTime)
  const utcTime = addMilliseconds(localTime, localOffset)

  // Convert to target timezone
  // e.g. 2024-02-22T09:00:00.000Z (9 AM UTC) -> 2024-02-22T17:00:00.000Z (9 AM America/Los_Angeles)
  const targetOffset = getTimezoneOffset(targetTz, utcTime)
  const targetTime = addMilliseconds(utcTime, -targetOffset)

  return targetTime
}
