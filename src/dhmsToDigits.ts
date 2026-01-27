import type { DHMS, DurationFormat, ZeroDisplay } from './types'

// Helper functions to extract specific digits from a number.
const ones = (num: number): number => Math.floor(num % 10)
const tens = (num: number): number => Math.floor((num / 10) % 10)
const hundreds = (num: number): number => Math.floor((num / 100) % 10)
const thousands = (num: number): number => Math.floor((num / 1000) % 10)

/**
 * Convert duration in days, hours, minutes, and seconds to an array of digits and symbols based on format.
 *
 * @param  {DHMS} dhms
 * @param  {DurationFormat} options.format
 * @param  {string} options.overtimePrefix
 * @param  {ZeroDisplay} options.leadingZeros – Controls zero-value components at the high end
 * @param  {ZeroDisplay} options.trailingZeros – Controls zero-value components at the low end
 * @return {(string|number)[]} – The individual digits of the countdown clock
 */
export function dhmsToDigits (
  dhms: DHMS,
  {
    format = 'HHHMMSS' as DurationFormat,
    overtimePrefix = '+',
    leadingZeros = 'nonzero' as ZeroDisplay,
    trailingZeros = 'always' as ZeroDisplay,
  }: {
    format?: DurationFormat
    overtimePrefix?: string
    leadingZeros?: ZeroDisplay
    trailingZeros?: ZeroDisplay
  } = {},
): (string | number)[] {
  const isZero = dhms.days + dhms.hours + dhms.minutes + dhms.seconds === 0
  const showDays = format.includes('D')
  const showHours = format.includes('H')
  const showMinutes = format.includes('M')
  const showSeconds = format.includes('S')
  const showDecimals = format.includes('F')
  const sepLetter = format.includes('L') // Determines if letters should be used as separators.

  //
  // Compute effective values with overflow
  //

  let days = dhms.days
  // Increase day count if not showing hours/minutes/seconds but there are leftover hours/minutes/seconds.
  if (!showHours && !showMinutes && !showSeconds && (dhms.hours + dhms.minutes + dhms.seconds))
    days += 1

  // Include days as hours if not showing days.
  let hours = dhms.hours + (showDays ? 0 : days * 24)
  // Increase hour count if not showing minutes/seconds but there are leftover minutes/seconds.
  if (!showMinutes && !showSeconds && (dhms.minutes + dhms.seconds)) hours += 1

  // Include hours as minutes if not showing hours.
  let minutes = dhms.minutes + (showHours ? 0 : hours * 60)
  // Increase minute count if not showing seconds but there are leftover seconds.
  if (!showSeconds && dhms.seconds) minutes += 1

  // Include minutes as seconds if not showing minutes.
  const seconds = dhms.seconds + (showMinutes ? 0 : minutes * 60)

  //
  // Compute display flags for each component
  //

  let displayDays = showDays
  let displayHours = showHours
  let displayMinutes = showMinutes
  let displaySeconds = showSeconds

  if (leadingZeros === 'always') {
    // Show all format components regardless of value — skip leading-zero hiding
  } else {
    // Hide leading zero components (current default behavior)
    if (showDays) {
      displayDays = days > 0 || (!showHours && !showMinutes && !showSeconds)
    }
    if (showHours) {
      displayHours = hours > 0 || (displayDays && days > 0) || (!showDays && !showMinutes && !showSeconds)
    }
  }

  if (trailingZeros === 'nonzero') {
    if (sepLetter) {
      // Letter format: hide ALL zero-value components (they are self-labeling)
      if (displayDays && days === 0) displayDays = false
      if (displayHours && hours === 0) displayHours = false
      if (displayMinutes && minutes === 0) displayMinutes = false
      if (displaySeconds && seconds === 0) displaySeconds = false
      // Ensure at least one component remains visible
      if (!displayDays && !displayHours && !displayMinutes && !displaySeconds) {
        if (showSeconds) displaySeconds = true
        else if (showMinutes) displayMinutes = true
        else if (showHours) displayHours = true
        else displayDays = true
      }
    } else {
      // Colon format: hide trailing zero components only
      if (displaySeconds && seconds === 0 && (displayMinutes || displayHours || displayDays)) {
        displaySeconds = false
      }
      if (!displaySeconds && displayMinutes && minutes === 0 && (displayHours || displayDays)) {
        displayMinutes = false
      }
      if (!displaySeconds && !displayMinutes && displayHours && hours === 0 && displayDays) {
        displayHours = false
      }
    }
  } else if (trailingZeros === 'never') {
    // Remove the lowest displayed component
    if (displaySeconds && (displayMinutes || displayHours || displayDays)) {
      displaySeconds = false
    } else if (displayMinutes && (displayHours || displayDays)) {
      displayMinutes = false
    } else if (displayHours && displayDays) {
      displayHours = false
    }
  }

  //
  // Build digits array
  //

  const digits: (string | number)[] = []

  // Prefix
  // Add prefix for negative (aka. overtime) durations if decimals are shown or if time is not zero.
  if (dhms.negative && (showDecimals || !isZero)) {
    digits.push(overtimePrefix)
  }

  // Days
  if (displayDays) {
    if (days > 100) digits.push(hundreds(days))
    if (days > 10) digits.push(tens(days))
    digits.push(ones(days))
    if (sepLetter) {
      digits.push('d')
      if (displayHours || displayMinutes || displaySeconds) digits.push(' ')
    } else if (displayHours || displayMinutes || displaySeconds) {
      digits.push(':')
    }
  }

  // Hours
  if (displayHours) {
    // Append thousands and hundreds place of hours if hours are three digits and days are not shown.
    if (hours >= 100 && !displayDays) {
      if (hours > 1000) digits.push(thousands(hours))
      digits.push(hundreds(hours))
    }
    // Append tens place of hours if more than 10 hours or if days are shown with colon separator.
    if (hours >= 10 || (displayDays && !sepLetter)) {
      digits.push(tens(hours))
    }
    digits.push(ones(hours))
    if (sepLetter) {
      digits.push('h')
      if (displayMinutes || displaySeconds) digits.push(' ')
    } else if (displayMinutes || displaySeconds) {
      digits.push(':')
    }
  }

  // Minutes
  if (displayMinutes) {
    if (minutes || displayHours || displayDays) {
      // Append thousands and hundreds place of minutes if minutes are three digits and hours are not shown.
      if (minutes >= 100 && !displayHours) {
        if (minutes > 1000) digits.push(thousands(minutes))
        digits.push(hundreds(minutes))
      }
      // Append tens place of minutes if more than 10 minutes or if there is no letter separator and hours are shown.
      if (minutes >= 10 || (!sepLetter && displayHours)) {
        digits.push(tens(minutes))
      }
    }
    digits.push(ones(minutes))
    if (sepLetter) {
      digits.push('m')
      if (displaySeconds) digits.push(' ')
    } else if (displaySeconds) {
      digits.push(':')
    }
  }

  // Seconds
  if (displaySeconds) {
    // Append thousands and hundreds place of seconds if seconds are three digits and minutes are not shown.
    if (seconds >= 100 && !displayMinutes) {
      if (seconds > 1000) digits.push(thousands(seconds))
      digits.push(hundreds(seconds))
    }
    // Pad seconds to 2 digits when a previous component is displayed with colon separator,
    // or when trailingZeros is 'always' (preserves backward compat for countdown displays).
    if (trailingZeros === 'always' || seconds >= 10 || (!sepLetter && (displayMinutes || displayHours || displayDays))) {
      digits.push(tens(seconds))
    }
    digits.push(ones(seconds))
    if (sepLetter) digits.push('s')
  }

  // Decimals
  if (showDecimals) {
    digits.push('.')
    digits.push(ones(dhms.decimals))
  }

  return digits
}
