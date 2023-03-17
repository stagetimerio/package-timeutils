import parse from 'date-fns/parse/index.js'
import parseISO from 'date-fns/parseISO/index.js'
import isValidDate from './isValidDate.js'

/**
 * [parseDate description]
 * @param  {any}       date
 * @param  {Boolean}   options.asUTC   How to handle partial date strings
 * @return {Date|null}
 */
export default function parseDate (date, { asUTC = false } = {}) {
  if (typeof date === 'boolean') return null
  if ([null, undefined].includes(date)) return null
  if (isValidDate(date)) return new Date(date)

  if (typeof date === 'string') {
    // Test for yyyy-MM-dd
    const regex1 = /^(\d{4})-(\d{2})-(\d{2})$/
    if (regex1.test(date)) return asUTC
      ? new Date(Date.parse(date + 'T00:00:00.000Z'))
      : parse(date, 'yyyy-MM-dd', new Date())

    // Test for yyyy-MM-ddTHH:mm:ss
    const regex2 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/
    if (regex2.test(date)) return asUTC
      ? new Date(Date.parse(date + '.000Z'))
      : parse(date, 'yyyy-MM-dd\'T\'HH:mm:ss', new Date())
  }

  const parsedNative = new Date(date)
  if (isValidDate(parsedNative)) return parsedNative

  const parsedISO = parseISO(date)
  if (isValidDate(parsedISO)) return parsedISO
  return null
}
