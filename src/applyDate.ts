import isValidDate from './isValidDate'
import parseDate from './parseDate'
import { addMilliseconds } from 'date-fns/addMilliseconds'
import { getTimezoneOffset } from './getTimezoneOffset'

/**
 * Apply year-month-day to a JS date.
 *
 * @param  {Date|string} time - the JS Date to be changed
 * @param  {Date|string} date - the JS Date to take the year-month-day from
 * @param  {string} [timezone] - an optional IANA timezone like 'Europe/Berlin'
 * @return {Date}
 */
export function applyDate(
  time: Date | string | null,
  date: Date | string | null,
  timezone: string | undefined = undefined
): Date | null {
  const timeInUTC = parseDate(time)
  const dateInUTC = parseDate(date)
  const tz = timezone || 'UTC'
  if (!isValidDate(timeInUTC)) return null
  if (!isValidDate(dateInUTC)) return timeInUTC

  // Change dates from UTC to sepcified timezone
  const timeOffset = getTimezoneOffset(tz, timeInUTC)
  const timeInZone = addMilliseconds(timeInUTC, timeOffset)
  const dateOffset = getTimezoneOffset(tz, dateInUTC)
  const dateInZone = addMilliseconds(dateInUTC, dateOffset)

  // Perform the actual applying of the date
  // Note: Order is important, year -> month -> day (otherwise funny things happen in leap years with Feb 28)
  // Note: Has to use the UTC variants to avoid interference of system timezone
  const outputInZone = new Date(timeInZone)
  outputInZone.setUTCFullYear(dateInZone.getUTCFullYear())
  outputInZone.setUTCMonth(dateInZone.getUTCMonth())
  outputInZone.setUTCDate(dateInZone.getUTCDate())

  // Change output from sepcified timezone back to UTC
  const outputOffset = getTimezoneOffset(tz, addMilliseconds(outputInZone, -dateOffset))
  const inUTC = addMilliseconds(outputInZone, -outputOffset)

  return inUTC
}
