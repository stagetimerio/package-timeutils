import { expect } from 'chai'
import { tzOffset } from '@date-fns/tz'
import { getToday, getTimezoneOffset, parseCalendarDay } from '../src/index'

// Every day of one year (each DST change once), in zones that are far from UTC,
// have odd minutes, or change DST at unusual times. Intl is the oracle, not the code under test.
const ZONES = [
  'Australia/Sydney',
  'Australia/Lord_Howe', // DST change is 30 min
  'Australia/Eucla', // +8:45
  'Pacific/Auckland',
  'Pacific/Chatham', // +12:45 / +13:45
  'Pacific/Kiritimati', // +14
  'Pacific/Niue', // -11
  'Pacific/Marquesas', // -9:30
  'America/St_Johns', // -3:30 / -2:30
  'America/Santiago', // DST change at midnight
  'America/Havana', // DST change at midnight
  'Asia/Kathmandu', // +5:45
]
const HOUR_MS = 3600000
const DAY_MS = 24 * HOUR_MS
const DAYS = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 6, 1) + i * DAY_MS).toISOString().slice(0, 10))

describe('timezone sweep 2026-07 to 2027-06', () => {
  test.each(ZONES)('%s: every calendar day resolves to its first instant', (timezone) => {
    const localDay = new Intl.DateTimeFormat('sv', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    const failures: string[] = []

    for (const day of DAYS) {
      const midnight = parseCalendarDay(day, { timezone }).getTime()
      if (localDay.format(midnight) !== day || localDay.format(midnight - 60000) === day) {
        failures.push(`parseCalendarDay ${day}`)
        continue
      }
      // A day is at least 23h long, so the last instant is still on the day.
      for (const ms of [midnight + 60000, midnight + 23 * HOUR_MS - 60000]) {
        if (getToday(timezone, new Date(ms)).getTime() !== midnight) failures.push(`getToday ${new Date(ms).toISOString()}`)
      }
    }

    expect(failures).to.deep.equal([])
  })

  test.each(ZONES)('%s: getTimezoneOffset matches the @date-fns/tz fallback', (timezone) => {
    const failures = DAYS
      .map((day) => new Date(`${day}T12:00:00.000Z`))
      .filter((date) => getTimezoneOffset(timezone, date) !== tzOffset(timezone, date) * 60000)
      .map((date) => date.toISOString())

    expect(failures).to.deep.equal([])
  })
})
