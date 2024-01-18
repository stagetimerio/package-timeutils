import parse from 'date-fns/parse/index.js'
import parseISO from 'date-fns/parseISO/index.js'
import getTimezoneOffset from 'date-fns-tz/getTimezoneOffset'
import addMinutes from 'date-fns/addMinutes'
import addMilliseconds from 'date-fns/addMilliseconds'
import isValidDate from './isValidDate.js'

/**
 * Try parsing the input as date or date string in the most sensible way
 *
 * @param  {any} date - date string to parse
 * @param  {string} [timezone] - uses system timezone if empty, only relevant for yyyy-MM-dd strings
 * @return {Date|null}
 */
export default function parseDate (date, tz = undefined) {
  if (typeof date === 'boolean') return null
  if ([null, undefined].includes(date)) return null
  if (isValidDate(date)) return new Date(date)

  if (typeof date === 'string') {
    // Test for yyyy-MM-dd
    const regex1 = /^(\d{4})-(\d{2})-(\d{2})$/
    if (regex1.test(date)) {
      const inSystemZone = parse(date, 'yyyy-MM-dd', new Date())
      if (!tz) return inSystemZone
      const inUTC = addMinutes(inSystemZone, -inSystemZone.getTimezoneOffset())
      const inOutZone = addMilliseconds(inUTC, getTimezoneOffset(tz, inUTC))
      return inOutZone
    }

    // Test for yyyy-MM-ddTHH:mm:ss
    const regex2 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/
    if (regex2.test(date)) return parse(date, 'yyyy-MM-dd\'T\'HH:mm:ss', new Date())
  }

  const parsedNative = new Date(date)
  if (isValidDate(parsedNative)) return parsedNative

  const parsedISO = parseISO(date)
  if (isValidDate(parsedISO)) return parsedISO

  return null
}
