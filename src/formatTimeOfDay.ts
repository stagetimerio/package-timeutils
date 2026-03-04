import { getSeconds, format as fnsFormat } from 'date-fns'
import { tz } from '@date-fns/tz'
import type { SecondsDisplay, TenthsDisplay } from './types'

const AM_PM_SUFFIX = /(\s+aa)$/

/**
 * Check whether a format string includes seconds (`:ss`)
 */
export function formatHasSeconds (format: string): boolean {
  return format.includes(':ss')
}

/**
 * Insert a fragment before the AM/PM suffix in a format string, or append at end.
 */
function insertBeforeSuffix (fmt: string, fragment: string): string {
  const match = fmt.match(AM_PM_SUFFIX)
  if (match) return fmt.replace(match[0], fragment + match[0])
  return fmt + fragment
}

/**
 * Format the time of day with timezone support
 *
 * @param  {Date}    date - The date object to format
 * @param  {string}  [options.timezone = 'UTC'] - The IANA timezone name, e.g., 'America/New_York'
 * @param  {string}  [options.format = 'H:mm:ss'] - A date-fns format string (e.g., 'H:mm:ss', 'h:mm aa')
 * @param  {string}  [options.seconds = undefined] - Override: 'always' | 'nonzero' | 'never'. Default: undefined = respect format string as-is.
 * @param  {string}  [options.tenths = undefined] - Override: 'always'. Default: undefined = no tenths shown.
 * @param  {boolean} [options.leadingZero = false] - Whether to display leading zero in hours
 * @return {string} - The formatted time string
 */
export function formatTimeOfDay (
  date: Date,
  {
    timezone = 'UTC',
    format = 'H:mm:ss',
    seconds,
    tenths,
    leadingZero = false,
  }: {
    timezone?: string
    format?: string
    seconds?: SecondsDisplay
    tenths?: TenthsDisplay
    leadingZero?: boolean
  } = {},
): string {
  if (!(date instanceof Date)) return '--:--'

  let fmt = format

  // 1. Apply seconds override
  //    'always' forces :ss even if format lacks it
  //    'nonzero'/'never' can only strip :ss — if format lacks seconds, most restrictive wins
  if (seconds === 'always') {
    if (!formatHasSeconds(fmt)) {
      fmt = insertBeforeSuffix(fmt, ':ss')
    }
  } else if (formatHasSeconds(fmt)) {
    if (seconds === 'never' || (seconds === 'nonzero' && getSeconds(date) === 0)) {
      fmt = fmt.replace(':ss', '')
    }
  }

  // 2. Apply tenths override (date-fns `S` = fractional second, single digit = tenths)
  if (tenths === 'always') {
    fmt = insertBeforeSuffix(fmt, '.S')
  }

  // 3. Apply leadingZero
  if (leadingZero) {
    // Replace single-char hour tokens with double-char: H → HH, h → hh
    // Only replace standalone H/h (not already HH/hh)
    fmt = fmt.replace(/\bH\b/g, 'HH').replace(/\bh\b/g, 'hh')
  }

  try {
    return fnsFormat(date, fmt, { in: tz(timezone) })
  } catch {
    return '--:--'
  }
}
