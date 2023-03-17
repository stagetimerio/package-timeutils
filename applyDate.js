import isValidDate from './isValidDate.js'
import parseDate from './parseDate.js'

/**
 * Apply year-month-day to a JS date
 * TODO: apply date has to be timezone aware
 * @param  {Date|string} inTime
 * @param  {Date|string} inDate
 * @param  {Object}      options.asUTC [How to handle partial date strings]
 * @return {Date}
 */
export default function applyDate (inTime, inDate, { asUTC = false } = {}) {
  const parsedTime = parseDate(inTime, { asUTC })
  const parsedDate = parseDate(inDate, { asUTC })
  if (!isValidDate(parsedTime)) return null
  if (!isValidDate(parsedDate)) return parsedTime
  let output

  // Move date
  // Note: order is important, day -> month -> year
  output = new Date(parsedTime)
  output.setDate(parsedDate.getDate())
  output.setMonth(parsedDate.getMonth())
  output.setFullYear(parsedDate.getFullYear())

  return output
}
