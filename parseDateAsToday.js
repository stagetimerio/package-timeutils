import parseDate from './parseDate.js'
import { applyDate } from './applyDate.js'
import getToday from './getToday.js'
import { addDays } from 'date-fns/addDays'

/**
 * Parses a given timestamp and sets it as today's date, with adjustments based on provided options.
 *
 * @param {Date | string} rawInput - The timestamp to parse. Can be a Date object or a string representing a date.
 * @param {Object} options - Optional parameters to refine the parsing behavior.
 * @param {string} [options.timezone] - The timezone to consider for parsing. If not provided, the system's timezone is used.
 * @param {Date} [options.after] - Ensures the parsed date is after or at this date. If the parsed date is earlier, it's adjusted to the next day.
 * @param {Date} [options.now] - A specific date to consider as 'today', primarily used for testing. Defaults to the current date if not provided.
 * @returns {Date} - The parsed and adjusted date as per the provided options.
 *
 * @example
 * // For a scenario where you need to parse a time as today's date in a specific timezone
 * parseDateAsToday('10:00', { timezone: 'Europe/Berlin' });
 *
 * @example
 * // When ensuring the parsed date is after a certain date
 * parseDateAsToday('10:00', { after: new Date('2022-01-01') });
 *
 * @throws {Error} - Throws an error if 'after' or 'now' options are provided but are not valid Date instances.
 */
export default function parseDateAsToday (rawInput, {
  timezone = undefined,
  after = undefined, // behaves like 'greater than or equal'
  now = undefined,
} = {}) {
  // Validate parameters
  if (after !== undefined && !(after instanceof Date)) {
    throw new Error('The `after` argument must be undefined or an instance of Date.')
  }
  if (now !== undefined && !(now instanceof Date)) {
    throw new Error('The `now` argument must be undefined or an instance of Date.')
  }

  // Parse input
  const today = getToday(timezone, now)
  const parsedInput = parseDate(rawInput, timezone)

  // Consider the `after` date when applying the date
  const dateToApply = after && after > today ? after : today
  let output = applyDate(parsedInput, dateToApply, timezone)

  // Double-check if the output is really after `after`, otherwise add one day
  if (output < after) output = addDays(output, 1)

  return output
}
