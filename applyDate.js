import isValidDate from './isValidDate.js'
import parseDate from './parseDate.js'
import addMilliseconds from 'date-fns/addMilliseconds'
import getTimezoneOffset from 'date-fns-tz/getTimezoneOffset'

/**
 * Apply year-month-day to a JS date.
 *
 * @param  {Date|string} time - the JS Date to be changed
 * @param  {Date|string} date - the JS Date to take the year-month-day from
 * @param  {string} [timezone] - an optional IANA timezone like 'Europe/Berlin'
 * @return {Date}
 */
export default function applyDate (time, date, timezone = undefined) {
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
  // Note: Order is important, day -> month -> year
  // Note: Has to use the UTC variants to avoid interference of system timezone
  let outputInZone = new Date(timeInZone)
  outputInZone.setUTCDate(dateInZone.getUTCDate())
  outputInZone.setUTCMonth(dateInZone.getUTCMonth())
  outputInZone.setUTCFullYear(dateInZone.getUTCFullYear())

  // Compensate for DST shift (Feels wrong, let's see if it sticks)
  const dstShift = dateOffset - timeOffset
  if (dstShift !== 0) outputInZone = addMilliseconds(outputInZone, dstShift)

  // Change output from sepcified timezone back to UTC
  const inUTC = addMilliseconds(outputInZone, -getTimezoneOffset(tz, outputInZone))

  // console.log(
  //   '[applyDate.js 1]',
  //   { tz, dstShift },
  //   { timeInUTC, timeInZone, off: getTimezoneOffset(tz, timeInUTC) },
  //   { dateInUTC, dateInZone, off: getTimezoneOffset(tz, dateInUTC) },
  //   { inZone, inUTC },
  // )

  return inUTC
}

