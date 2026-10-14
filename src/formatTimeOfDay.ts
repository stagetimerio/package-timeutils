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

const wallClockFormats = new Map<string, Intl.DateTimeFormat>()

/**
 * A local Date whose fields show the wall clock of `timezone` at `date`.
 * Wrong by one hour in the hour the system clock skips at its own DST change.
 */
function toWallClock (date: Date, timezone: string): Date {
  let format = wallClockFormats.get(timezone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    wallClockFormats.set(timezone, format)
  }
  const parts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 }
  for (const { type, value } of format.formatToParts(date)) {
    if (type in parts) parts[type as keyof typeof parts] = Number(value)
  }
  // Some Chromium builds show midnight as 24 even with h23.
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second, date.getMilliseconds())
}

/**
 * Format the time of day with timezone support
 *
 * @param  {Date}    date - The date object to format
 * @param  {string}  [options.timezone = 'UTC'] - The IANA timezone name, e.g., 'America/New_York'
 * @param  {string}  [options.format = 'H:mm:ss'] - A date-fns format string (e.g., 'H:mm:ss', 'h:mm aa')
 * @param  {string}  [options.seconds = undefined] - Override: 'always' | 'nonzero' | 'never'. Default: undefined = respect format string as-is.
 * @param  {string}  [options.tenths = undefined] - Override: 'always'. Default: undefined = no tenths shown.
 * @return {string} - The formatted time string
 */
export function formatTimeOfDay (
  date: Date,
  {
    timezone = 'UTC',
    format = 'H:mm:ss',
    seconds,
    tenths,
  }: {
    timezone?: string
    format?: string
    seconds?: SecondsDisplay
    tenths?: TenthsDisplay
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

  try {
    return fnsFormat(date, fmt, { in: tz(timezone) })
  } catch {
    // @date-fns/tz needs timeZoneName 'longOffset': Chromium 95+. BrightSign players run 87.
    try {
      return fnsFormat(toWallClock(date, timezone), fmt)
    } catch {
      return '--:--'
    }
  }
}
