import { millisecondsToDhms } from './millisecondsToDhms'
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
 * @param options.maxUnits – Cap the output to the N highest-order components that would otherwise show (default: undefined — no cap). Applied after leading/trailing-zero handling, so pair with trailingZeros: 'nonzero' to drop trailing zero units first.
 * @param options.ceil – Round sub-second values up (default: true, forced false when format includes 'F')
 * @returns Formatted duration string, or '' for invalid input
 *
 * @example formatDuration(5400000) // '1:30:00'
 * @example formatDuration(330000, { leadingZeros: 'always' }) // '0:05:30'
 * @example formatDuration(149459000, { format: 'L_DHMS' }) // '1d 17h 30m 59s'
 * @example formatDuration(149459000, { format: 'L_DHMS', maxUnits: 2 }) // '1d 17h'
 */
export function formatDuration (
  ms: number = 0,
  {
    format = 'HHHMMSS' as DurationFormat,
    overtimePrefix = '',
    leadingZeros = 'nonzero' as ZeroDisplay,
    trailingZeros = 'always' as ZeroDisplay,
    maxUnits,
    ceil = true,
  }: {
    format?: DurationFormat
    overtimePrefix?: string
    leadingZeros?: ZeroDisplay
    trailingZeros?: ZeroDisplay
    maxUnits?: number
    ceil?: boolean
  } = {},
): string {
  if (typeof ms !== 'number' || isNaN(ms)) return ''
  const showDecimals = format.includes('F')
  const dhms = millisecondsToDhms(ms, { ceil: showDecimals ? false : ceil })
  const digits = dhmsToDigits(dhms, { format, overtimePrefix, leadingZeros, trailingZeros, maxUnits })
  return digits.join('').trim()
}
