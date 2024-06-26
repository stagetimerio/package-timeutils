// TODO: Needs Tests

import * as countdownFormats from './countdownFormats.js'

// Helper functions to extract specific digits from a number.
const ones = num => Math.floor(num % 10)
const tens = num => Math.floor((num / 10) % 10)
const hundreds = num => Math.floor((num / 100) % 10)
const thousands = num => Math.floor((num / 1000) % 10)

/**
 * type DHMS = {
 *   negative: boolean // Rename to overtime
 *   days: number
 *   hours: number
 *   minutes: number
 *   seconds: number
 *   decimals: number
 * }
 */

/**
 * Convert duration in days, hours, minutes, and seconds to an array of digits and symbols based on format.
 * @param  {DHMS} dhms
 * @param  {string} options.format
 * @param  {string} options.overtimePrefix
 * @return {string[]} – The individual digits of the countdown clock
 */
export function dhmsToDigits (
  dhms,
  {
    format = countdownFormats.DEFAULT,
    overtimePrefix = '+',
  } = {},
) {
  const isZero = (dhms.days + dhms.hours + dhms.minutes + dhms.seconds) === 0
  const showDays = format.includes('D')
  const showHours = format.includes('H')
  const showMinutes = format.includes('M')
  const showSeconds = format.includes('S')
  const showDecimals = format.includes('F')
  const sepLetter = format.includes('L') // Determines if letters should be used as separators.
  const digits = [] // Array to hold the result.

  //
  // Prefix
  // Add prefix for negative (aka. overtime) durations if decimals are shown or if time is not zero.
  //

  if (dhms.negative && (showDecimals || !isZero)) {
    digits.push(overtimePrefix)
  }

  //
  // Days
  // Calculate and add days to the digits array if applicable.
  //

  let days = dhms.days
  // Increase day count if not showing hours/minutes/seconds but there are leftover hours/minutes/seconds.
  if (!showHours && !showMinutes && !showSeconds && (dhms.hours + dhms.minutes + dhms.seconds)) days += 1
  // Append days to digits array if days are shown and there are days to show, or if it's the only component shown.
  if (showDays && (days || (!showHours && !showMinutes && !showSeconds))) {
    // Append hundreds place of days if more than 100 days.
    if (days > 100) {
      digits.push(hundreds(days))
    }
    // Append tens place of days if more than 10 days.
    if (days > 10) {
      digits.push(tens(days))
    }
    // Always append ones place of days.
    digits.push(ones(days))
    // Append separator for days if required.
    if (sepLetter) digits.push('d', ' ')
    else digits.push(':')
  }

  //
  // Hours
  // Calculate and add hours to the digits array if applicable.
  //

  // Include days as hours if not showing days.
  let hours = dhms.hours + (showDays ? 0 : days * 24)
  // Increase hour count if not showing minutes/seconds but there are leftover minutes/seconds.
  if (!showMinutes && !showSeconds && (dhms.minutes + dhms.seconds)) hours += 1
  // Append hours to digits array if hours are shown.
  if (showHours && (hours || days || (!showMinutes && !showSeconds))) {
    // Append thousands and hundreds place of hours if hours are three digits and days are not shown.
    if (hours >= 100 && !showDays) {
      if (hours > 1000) digits.push(thousands(hours))
      digits.push(hundreds(hours))
    }
    // Append tens place of hours if more than 10 hours or if days are shown but no separator letter.
    if (hours >= 10 || (showDays && !sepLetter && days > 0)) {
      digits.push(tens(hours))
    }
    // Always append ones place of hours.
    digits.push(ones(hours))
    // Append separator for hours if required.
    if (sepLetter) digits.push('h', ' ')
    else digits.push(':')
  }

  //
  // Minutes
  // Calculate and add minutes to the digits array if applicable.
  //

  // Include hours as minutes if not showing hours.
  let minutes = dhms.minutes + (showHours ? 0 : hours * 60)
  // Increase minute count if not showing seconds but there are leftover seconds.
  if (!showSeconds && dhms.seconds) minutes += 1
  // Append minutes to digits array if minutes are shown.
  if (showMinutes) {
    if (minutes || hours) {
      // Append thousands and hundreds place of minutes if minutes are three digits and hours are not shown.
      if (minutes >= 100 && !showHours) {
        if (minutes > 1000) digits.push(thousands(minutes))
        digits.push(hundreds(minutes))
      }
      // Append tens place of minutes if more than 10 minutes or if there is no separator and hours are shown.
      if (minutes >= 10 || (!sepLetter && hours > 0)) {
        digits.push(tens(minutes))
      }
    }
    // Always append ones place of minutes.
    digits.push(ones(minutes))
    // Append separator for minutes if required.
    if (sepLetter) digits.push('m', ' ')
    else digits.push(':')
  }

  //
  // Seconds
  // Calculate and add seconds to the digits array if applicable.
  //

  // Include minutes as seconds if not showing minutes.
  const seconds = dhms.seconds + (showMinutes ? 0 : minutes * 60)
  // Append seconds to digits array if seconds are shown.
  if (showSeconds) {
    // Append thousands and hundreds place of seconds if seconds are three digits and minutes are not shown.
    if (seconds >= 100 && !showMinutes) {
      if (seconds > 1000) digits.push(thousands(seconds))
      digits.push(hundreds(seconds))
    }
    // Always append tens and ones place of seconds.
    digits.push(tens(seconds))
    digits.push(ones(seconds))
    // Append separator for seconds if required.
    if (sepLetter) digits.push('s')
  }

  //
  // Decimals
  // Add decimal point and decimals to the digits array if applicable.
  //

  if (showDecimals) {
    // Append decimal point.
    digits.push('.')
    // Append tenths and hundredths place of decimals.
    digits.push(ones(dhms.decimals))
  }

  // Return the final array of digits and symbols.
  return digits
}
