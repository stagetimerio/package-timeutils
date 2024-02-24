import getTimezoneOffset from 'date-fns-tz/getTimezoneOffset'
import addMilliseconds from 'date-fns/addMilliseconds'
import addMinutes from 'date-fns/addMinutes'

/**
 * Get the Date of 0:00 today in the given timezone
 *
 * @param  {string} [timezone] - assumes 'UTC' if empty
 * @param  {Date} [now] - provide a date for 'today', must be in UTC, used for testing
 * @return {Date}
 */
export default function getToday (timezone = undefined, now = undefined) {
  if (now !== undefined && !(now instanceof Date)) {
    throw new Error('The 2nd argument must be undefined or an instance of date.')
  }
  // Step 1: Undo system timezone for new Date() (system -> UTC)
  const inSystem = new Date()
  const inUTC = now || addMinutes(inSystem, -inSystem.getTimezoneOffset())

  // Step 2: Apply target timezone (UTC -> zoned)
  const tzOffset = timezone ? getTimezoneOffset(timezone, inUTC) : 0
  const inZone = addMilliseconds(inUTC, tzOffset)

  // console.log(
  //   '[getToday.js]',
  //   { timezone },
  //   { inSystem, inUTC, inZone },
  // )

  // Step 3: Move time to 0:00:00
  inZone.setUTCHours(0, 0, 0, 0)

  // Step 4: Revert to UTC (zoned -> UTC)
  return addMilliseconds(inZone, -tzOffset)
}
