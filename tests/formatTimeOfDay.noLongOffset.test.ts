import { expect } from 'chai'
import { formatTimeOfDay } from '../src/index'

// Chromium < 95 (BrightSign players) rejects timeZoneName 'longOffset'.
// A file of its own: @date-fns/tz keeps a formatter per zone once one is built.
const DateTimeFormat = Intl.DateTimeFormat
const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (locales, options) {
  if (options?.timeZoneName === 'longOffset') throw new RangeError('Value longOffset out of range')
  return new DateTimeFormat(locales, options)
})

afterAll(() => spy.mockRestore())

const DATE = new Date('2023-06-17T15:10:30.750Z')

describe('formatTimeOfDay without longOffset', () => {
  it('shows the wall clock of the zone', () => {
    expect(formatTimeOfDay(DATE, { timezone: 'UTC' })).to.equal('15:10:30')
    expect(formatTimeOfDay(DATE, { timezone: 'Europe/Berlin' })).to.equal('17:10:30')
    expect(formatTimeOfDay(DATE, { timezone: 'America/Los_Angeles' })).to.equal('8:10:30')
    expect(formatTimeOfDay(DATE, { timezone: 'Australia/Sydney' })).to.equal('1:10:30')
    expect(formatTimeOfDay(DATE, { timezone: 'Asia/Kathmandu' })).to.equal('20:55:30')
    expect(formatTimeOfDay(DATE, { timezone: 'America/St_Johns' })).to.equal('12:40:30')
    expect(spy).toHaveBeenCalledWith('en-US', expect.objectContaining({ timeZoneName: 'longOffset' }))
  })

  it('shows midnight as 0', () => {
    expect(formatTimeOfDay(new Date('2023-06-17T22:05:00Z'), { timezone: 'Europe/Berlin', format: 'HH:mm' })).to.equal('00:05')
  })

  it('applies 12-hour format, seconds and tenths', () => {
    expect(formatTimeOfDay(DATE, { timezone: 'Europe/Berlin', format: 'h:mm aa' })).to.equal('5:10 PM')
    expect(formatTimeOfDay(DATE, { timezone: 'Europe/Berlin', seconds: 'never' })).to.equal('17:10')
    expect(formatTimeOfDay(DATE, { timezone: 'Europe/Berlin', tenths: 'always' })).to.equal('17:10:30.7')
  })

  it('returns --:-- for an unknown timezone or an invalid date', () => {
    expect(formatTimeOfDay(DATE, { timezone: 'Not/A/Timezone' })).to.equal('--:--')
    expect(formatTimeOfDay(new Date(NaN), { timezone: 'Europe/Berlin' })).to.equal('--:--')
  })
})

