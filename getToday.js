import getTimezoneOffset from 'date-fns-tz/getTimezoneOffset'
import addMilliseconds from 'date-fns/addMilliseconds'

/**
 * Get the Date of 0:00 today in the given timezone aware
 *
 * @param  {string} [timezone] - assumes 'UTC' if empty
 * @param  {Date} [now] - provide a date for 'today', used for testing
 * @return {Date}
 */
export default function getToday (timezone = undefined, now = undefined) {
  const today = now || new Date()
  const tzOffset = timezone ? getTimezoneOffset(timezone, today) : 0
  const zoned = addMilliseconds(today, tzOffset)
  zoned.setUTCHours(0, 0, 0, 0)
  return zoned
}
