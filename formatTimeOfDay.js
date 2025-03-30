import { getSeconds, format as fnsFormat } from 'date-fns'
import { tz } from '@date-fns/tz'
// import { formatInTimeZone } from 'date-fns-tz'

/**
 * Format the time of day with timezone and format
 *
 * @param  {Date}    date - The date object to format
 * @param  {string}  [options.timezone = 'UTC'] - The IANA timezone name, e.g., 'America/New_York'
 * @param  {string}  [options.format = '24h'] - The time format, either '12h', '12h_a' or '24h'
 * @param  {string}  [options.seconds = 'always'] - When to display seconds: 'always', 'nonzero', or 'never'
 * @param  {boolean} [options.leadingZero = false] - Whether to display leading zero in hours
 * @return {string} - The formatted time string
 */
export function formatTimeOfDay (
  date,
  {
    timezone = 'UTC',
    format = '24h',
    seconds = 'always',
    leadingZero = false,
  } = {},
) {
  if (!(date instanceof Date)) throw new Error('`date` must be an instance of Date')

  const formatOptions = {
    '24h': leadingZero ? 'HH:mm' : 'H:mm',
    '12h': leadingZero ? 'hh:mm' : 'h:mm',
    '12h_a': leadingZero ? 'hh:mm a' : 'h:mm a',
  }

  let timeFormat = formatOptions[format]

  // Append seconds to the format string based on the seconds option
  if (seconds === 'always' || (seconds === 'nonzero' && getSeconds(date) !== 0)) {
    timeFormat = timeFormat.replace(':mm', ':mm:ss')
  }

  return fnsFormat(date, timeFormat, { in: tz(timezone) })
}
