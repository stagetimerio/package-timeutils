import { getSeconds, format as fnsFormat } from 'date-fns'
import { tz } from '@date-fns/tz'
import type { SecondsDisplay } from './types'

/**
 * Check whether a format string includes seconds (`:ss`)
 */
export function formatStrHasSeconds (formatStr: string): boolean {
  return formatStr.includes(':ss')
}

/**
 * Format the time of day with timezone support
 *
 * @param  {Date}    date - The date object to format
 * @param  {string}  [options.timezone = 'UTC'] - The IANA timezone name, e.g., 'America/New_York'
 * @param  {string}  [options.formatStr = 'H:mm:ss'] - A date-fns format string (e.g., 'H:mm:ss', 'h:mm aa')
 * @param  {string}  [options.seconds] - Override: 'nonzero' | 'never' (most restrictive wins)
 * @param  {boolean} [options.leadingZero = false] - Whether to display leading zero in hours
 * @return {string} - The formatted time string
 */
export function formatTimeOfDay (
  date: Date,
  {
    timezone = 'UTC',
    formatStr = 'H:mm:ss',
    seconds,
    leadingZero = false,
  }: {
    timezone?: string
    formatStr?: string
    seconds?: SecondsDisplay
    leadingZero?: boolean
  } = {}
): string {
  if (!(date instanceof Date)) return '--:--'

  let fmt = formatStr

  // 1. Apply seconds override (most restrictive wins)
  if (formatStrHasSeconds(fmt)) {
    if (seconds === 'never' || (seconds === 'nonzero' && getSeconds(date) === 0)) {
      fmt = fmt.replace(':ss', '')
    }
  }
  // If format lacks seconds and seconds override wants them, we don't add — most restrictive wins

  // 2. Apply leadingZero
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
