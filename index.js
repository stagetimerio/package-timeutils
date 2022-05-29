import parseISO from 'date-fns/parseISO'
import addDays from 'date-fns/addDays'

export function millisecondsToHms (ms = 0) {
  return {
    hours: Math.floor(ms / 3600000) || 0,
    minutes: Math.floor((ms % 3600000) / 60000) || 0,
    seconds: Math.floor((ms % 60000) / 1000) || 0,
    decimals: Math.floor((ms % 1000) / 100) || 0,
  }
}

export function millisecondsToDhms (ms = 0) {
  const negative = ms < 0 ? 1 : 0
  const decimalMs = Math.abs(Math.floor(ms % 1000)) || 0
  const roundedMs = Math.abs(Math.ceil(ms/1000)) * 1000

  return {
    negative,
    days: Math.floor(roundedMs / 86400000) || 0,
    hours: Math.floor((roundedMs % 86400000) / 3600000) || 0,
    minutes: Math.floor((roundedMs % 3600000) / 60000) || 0,
    seconds: Math.floor((roundedMs % 60000) / 1000) || 0,
    decimals: Math.floor(decimalMs / 100),
  }
}

export function hmsToMilliseconds ({ hours = 0, minutes = 0, seconds = 0 } = {}) {
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000)
}

export function dhmsToMilliseconds ({
  negative = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  decimals = 0,
}) {
  let ms = (days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + (decimals * 100)
  if (!negative && decimals > 0) ms -= 1000
  const prefix = negative ? -1 : 1
  return prefix * ms
}

export function isValidDate (date) {
  return date instanceof Date && !isNaN(date)
}

export function parseDate (date) {
  if ([null, undefined].includes(date)) return null
  if (isValidDate(date)) return date
  const parsedNative = new Date(date)
  if (isValidDate(parsedNative)) return parsedNative
  const parsedISO = parseISO(date)
  if (isValidDate(parsedISO)) return parsedISO
  return null
}

/**
 * Apply year-month-day to a JS date
 * @param  {Date|string} date
 * @param  {Date|string} ymdDate
 * @return {Date}
 */
export function applyDate (date, ymdDate) {
  const parsed = parseDate(date)
  const ymd = parseDate(ymdDate)
  if (!isValidDate(parsed)) return null
  if (!isValidDate(ymd)) return parsed
  const clone = new Date(parsed)
  clone.setFullYear(ymd.getFullYear())
  clone.setMonth(ymd.getMonth())
  clone.setDate(ymd.getDate())
  clone.setUTCHours(parsed.getUTCHours())
  return clone
}

export function parseDateAsToday (date, {
  reference = null,
  tollerance = 3 * 60 * 60 * 1000, // 6 hours
} = {}) {
  let parsed = parseDate(date)
  if (!parsed) return null
  const parsedRef = parseDate(reference) || new Date()
  parsed = applyDate(parsed, parsedRef)
  while ((parsedRef - parsed) > tollerance) {
    parsed = addDays(parsed, 1)
  }
  return parsed
}

export function timerToStartDate (timer) {
  if (!timer) return null
  let start = parseDateAsToday(timer.startTime)
  if (timer.startDate) {
    start = applyDate(start, timer.startDate)
  }
  return start
}

export function timerToFinishDate (timer) {
  if (!timer) return null
  const start = timerToStartDate(timer)
  let finish = null
  if (start) {
    finish = parseDateAsToday(timer.finishTime, { reference: start, tollerance: 0 })
  } else {
    finish = parseDateAsToday(timer.finishTime)
  }
  if (timer.finishDate) {
    finish = applyDate(finish, timer.finishDate)
  }
  return finish
}

export default {
  millisecondsToHms,
  hmsToMilliseconds,
  isValidDate,
  parseDate,
  parseDateAsToday,
  applyDate,
  timerToStartDate,
  timerToFinishDate,
}
