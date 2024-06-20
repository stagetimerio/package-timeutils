import { getSeconds } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

/**
 * Format the time of day with timezone and format
 *
 * @param  {Date}    date - The date object to format
 * @param  {string}  [options.timezone = 'UTC'] - The IANA timezone name, e.g., 'America/New_York'
 * @param  {string}  [options.format = '24h'] - The time format, either '12h' or '24h'
 * @param  {string}  [options.seconds = 'always'] - When to display seconds: 'always', 'nonzero', or 'never'
 * @return {string} - The formatted time string
 */
export function formatTimeOfDay (
  date,
  {
    timezone = 'UTC',
    format = '24h',
    seconds = 'always',
  } = {},
) {
  const formatOptions = {
    '12h': 'hh:mm a',
    '24h': 'HH:mm',
  }

  let timeFormat = formatOptions[format]

  // Append seconds to the format string based on the seconds option
  if (seconds === 'always' || (seconds === 'nonzero' && getSeconds(date) !== 0)) {
    timeFormat = timeFormat.replace(':mm', ':mm:ss')
  }

  return formatInTimeZone(date, timezone, timeFormat)
}
