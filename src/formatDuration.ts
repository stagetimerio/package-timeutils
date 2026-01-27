import millisecondsToDhms from './millisecondsToDhms'
import { dhmsToDigits } from './dhmsToDigits'
import type { DurationFormat, ZeroDisplay } from './types'

/**
 * Format a duration in milliseconds to a human-readable digit string.
 *
 * Pipeline: `millisecondsToDhms(ms)` → `dhmsToDigits(dhms)` → `join`
 *
 * @param ms – Duration in milliseconds (negative = overtime)
 * @param options.format – Components to display, e.g. 'HHHMMSS', 'MMMSSF', 'L_DHMS' (default: 'HHHMMSS')
 * @param options.overtimePrefix – Prefix for negative durations (default: '' — no prefix)
 * @param options.leadingZeros – Show zero-value components at the left: 'always' | 'nonzero' | 'never' (default: 'nonzero')
 * @param options.trailingZeros – Show zero-value components at the right: 'always' | 'nonzero' | 'never' (default: 'always')
 * @param options.ceil – Round sub-second values up (default: true)
 * @returns Formatted duration string, or '' for invalid input
 *
 * @example formatDuration(5400000) // '1:30:00'
 * @example formatDuration(330000, { leadingZeros: 'always' }) // '0:05:30'
 * @example formatDuration(149459000, { format: 'L_DHMS' }) // '1d 17h 30m 59s'
 */
export function formatDuration (
  ms: number = 0,
  {
    format = 'HHHMMSS' as DurationFormat,
    overtimePrefix = '',
    leadingZeros = 'nonzero' as ZeroDisplay,
    trailingZeros = 'always' as ZeroDisplay,
    ceil = true,
  }: {
    format?: DurationFormat
    overtimePrefix?: string
    leadingZeros?: ZeroDisplay
    trailingZeros?: ZeroDisplay
    ceil?: boolean
  } = {},
): string {
  if (typeof ms !== 'number' || isNaN(ms)) return ''
  const dhms = millisecondsToDhms(ms, { ceil })
  const digits = dhmsToDigits(dhms, { format, overtimePrefix, leadingZeros, trailingZeros })
  return digits.join('').trim()
}
