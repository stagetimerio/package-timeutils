import { formatDistance } from 'date-fns/formatDistance'
import millisecondsToDhms from './millisecondsToDhms'

function singularPlural (n: number, singular: string, plural: string, space: string): string {
  const quantity = n === -1 ? 'Unlimited' : n
  return quantity + space + (n === 1 ? singular : plural)
}

/**
 * Format a duration in milliseconds to a human-readable word string.
 *
 * In approximate mode (default), uses date-fns `formatDistance` for natural
 * language like "about 1 hour" or "3 days".
 *
 * In exact mode, breaks into days/hrs/mins/secs with singular/plural labels,
 * skipping zero-value components.
 *
 * @param milliseconds – Duration in milliseconds
 * @param options.exact – Use exact breakdown instead of approximate wording (default: false)
 * @param options.space – Character between number and unit label (default: ' ')
 * @returns Formatted duration string
 *
 * @example formatDurationInWords(3600000) // 'about 1 hour'
 * @example formatDurationInWords(5400000, { exact: true }) // '1 hr 30 mins'
 * @example formatDurationInWords(5400000, { exact: true, space: '\u00A0' }) // '1\u00A0hr 30\u00A0mins'
 */
export function formatDurationInWords (
  milliseconds: number,
  { exact = false, space = ' ' }: { exact?: boolean; space?: string } = {},
): string {
  const zero = new Date().setHours(0, 0, 0, 0)
  if (!exact) return formatDistance(zero, zero + Math.abs(milliseconds))
  const dhms = millisecondsToDhms(milliseconds)
  const parts: string[] = []
  if (dhms.days) parts.push(singularPlural(dhms.days, 'day', 'days', space))
  if (dhms.hours) parts.push(singularPlural(dhms.hours, 'hr', 'hrs', space))
  if (dhms.minutes) parts.push(singularPlural(dhms.minutes, 'min', 'mins', space))
  if (dhms.seconds) parts.push(singularPlural(dhms.seconds, 'sec', 'secs', space))
  return parts.join(' ')
}
