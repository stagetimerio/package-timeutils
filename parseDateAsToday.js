import addDays from 'date-fns/addDays/index.js'
import isValidDate from './isValidDate.js'
import parseDate from './parseDate.js'
import applyDate from './applyDate.js'

/**
 * [parseDateAsToday description]
 * @param  {Date,String} inputDate           The timestamp to parse
 * @param  {Date,String} options.reference   Used instead of 'Today'
 * @param  {Number}      options.tollerance  If the date is so long in the past, it's considered as tomorrow
 * @param  {Boolean}     options.asUTC       How to handle partial date strings
 * @return {Date}
 */
export default function parseDateAsToday (inputDate, {
  reference = null,
  tollerance = 3 * 60 * 60 * 1000, // 3 hours
  asUTC = false,
} = {}) {
  const parsedInput = parseDate(inputDate, { asUTC })
  if (!isValidDate(parsedInput)) return null
  const parsedRef = parseDate(reference, { asUTC }) || new Date()
  let output = applyDate(parsedInput, parsedRef)

  // If the date is too long in the past from now (e.g. 10am, but now is 5pm)
  // Then consider it as tomorrow
  if ((parsedRef - output) > tollerance) {
    return addDays(output, 1)
  }

  // If there is a day change and the hour difference is <3h (e.g. 11pm -> 1am)
  // Then consider it as yesterday
  const tolleranceInHours = tollerance / (60 * 60 * 1000)
  const differenceInterDay = 24 - (parsedInput.getHours() - parsedRef.getHours())
  if (differenceInterDay <= tolleranceInHours) {
    return addDays(output, -1)
  }

  return output
}
