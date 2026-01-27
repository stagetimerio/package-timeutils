import { parse } from 'date-fns/parse'
import { parseISO } from 'date-fns/parseISO'
import { getTimezoneOffset } from './getTimezoneOffset'
import { addMinutes } from 'date-fns/addMinutes'
import { addMilliseconds } from 'date-fns/addMilliseconds'
import isValidDate from './isValidDate'

/**
 * Parses a given input into a date object, handling different date formats and timezones.
 *
 * @param {any} rawInput - The date input to parse. Can be a date string or a date object.
 * @param {string} [tz] - The timezone to use for parsing. Only relevant for 'yyyy-MM-dd' date strings. If not provided, uses the system's timezone.
 * @return {Date|null} - Returns a Date object if parsing is successful; otherwise, returns null.
 *
 * @example
 * // Basic parsing with system timezone
 * parseDate('2023-01-01')
 *
 * @example
 * // Parsing with a specific timezone
 * parseDate('2023-01-01', 'Europe/Berlin')
 *
 * @example
 * // Parsing a full datetime string
 * parseDate('2023-01-01T12:00:00')
 */
export default function parseDate (
  rawInput: unknown,
  tz: string | undefined = undefined,
): Date | null {
  if (typeof rawInput === 'boolean') return null
  if (rawInput === null || rawInput === undefined) return null
  if (isValidDate(rawInput)) return new Date(rawInput)

  if (typeof rawInput === 'string') {
    // Test for yyyy-MM-dd
    const regex1 = /^(\d{4})-(\d{2})-(\d{2})$/
    if (regex1.test(rawInput)) {
      const inSystemZone = parse(rawInput, 'yyyy-MM-dd', new Date())
      if (!tz) return inSystemZone
      const inUTC = addMinutes(inSystemZone, -inSystemZone.getTimezoneOffset())
      const inOutZone = addMilliseconds(inUTC, getTimezoneOffset(tz, inUTC))
      return inOutZone
    }

    // Test for yyyy-MM-ddTHH:mm:ss
    const regex2 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/
    if (regex2.test(rawInput))
      return parse(rawInput, 'yyyy-MM-dd\'T\'HH:mm:ss', new Date())
  }

  const parsedNative = new Date(rawInput as string | number)
  if (isValidDate(parsedNative)) return parsedNative

  if (typeof rawInput === 'string') {
    const parsedISO = parseISO(rawInput)
    if (isValidDate(parsedISO)) return parsedISO
  }

  return null
}
