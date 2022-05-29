import { default as chai } from 'chai'
import {
  millisecondsToHms,
  millisecondsToDhms,
  dhmsToMilliseconds,
  hmsToMilliseconds,
  isValidDate,
  parseDate,
  applyDate,
  parseDateAsToday,
  timerToStartDate,
  timerToFinishDate,
} from '../index.js'
import { format } from 'date-fns'

const { expect } = chai
const yyyyMMdd = format(new Date(), 'yyyy-MM-dd')

describe('timeUtils', () => {
  test('millisecondsToHms', () => {
    expect(millisecondsToHms(0)).to.deep.equal({ hours: 0, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToHms(100)).to.deep.equal({ hours: 0, minutes: 0, seconds: 0, decimals: 1 })
    expect(millisecondsToHms(1000)).to.deep.equal({ hours: 0, minutes: 0, seconds: 1, decimals: 0 })
    expect(millisecondsToHms(60000)).to.deep.equal({ hours: 0, minutes: 1, seconds: 0, decimals: 0 })
    expect(millisecondsToHms(3600000)).to.deep.equal({ hours: 1, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToHms(3723400)).to.deep.equal({ hours: 1, minutes: 2, seconds: 3, decimals: 4 })
  })

  test('millisecondsToDhms ceil = true', () => {
    expect(millisecondsToDhms(97323400)).to.deep.equal({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4 })
    expect(millisecondsToDhms(3723400)).to.deep.equal({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 4, decimals: 4 })
    expect(millisecondsToDhms(3600000)).to.deep.equal({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(60000)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(1500)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5 })
    expect(millisecondsToDhms(1000)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })
    expect(millisecondsToDhms(500)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })
    expect(millisecondsToDhms(0)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(-500)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5 })
    expect(millisecondsToDhms(-1000)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })
    expect(millisecondsToDhms(-1500)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })
    expect(millisecondsToDhms(-97323400)).to.deep.equal({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4 })
  })

  test('millisecondsToDhms ceil = false', () => {
    const opt = { ceil: false }
    expect(millisecondsToDhms(97323400, opt)).to.deep.equal({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4 })
    expect(millisecondsToDhms(3723400, opt)).to.deep.equal({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 3, decimals: 4 })
    expect(millisecondsToDhms(3600000, opt)).to.deep.equal({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(60000, opt)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(1500, opt)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })
    expect(millisecondsToDhms(1000, opt)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })
    expect(millisecondsToDhms(500, opt)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5 })
    expect(millisecondsToDhms(0, opt)).to.deep.equal({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0 })
    expect(millisecondsToDhms(-500, opt)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })
    expect(millisecondsToDhms(-1000, opt)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })
    expect(millisecondsToDhms(-1500, opt)).to.deep.equal({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5 })
    expect(millisecondsToDhms(-97323400, opt)).to.deep.equal({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4 })
  })

  test('dhmsToMilliseconds ceil = true', () => {
    expect(dhmsToMilliseconds({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4 })).to.deep.equal(97323400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 4, decimals: 4 })).to.deep.equal(3723400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0 })).to.deep.equal(3600000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0 })).to.deep.equal(60000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5 })).to.deep.equal(1500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })).to.deep.equal(1000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })).to.deep.equal(500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0 })).to.deep.equal(0)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5 })).to.deep.equal(-500)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })).to.deep.equal(-1000)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })).to.deep.equal(-1500)
    expect(dhmsToMilliseconds({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4 })).to.deep.equal(-97323400)
  })

  test('dhmsToMilliseconds ceil = false', () => {
    const ceil = false
    expect(dhmsToMilliseconds({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4, ceil })).to.deep.equal(97323400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 3, decimals: 4, ceil })).to.deep.equal(3723400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0, ceil })).to.deep.equal(3600000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0, ceil })).to.deep.equal(60000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5, ceil })).to.deep.equal(1500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0, ceil })).to.deep.equal(1000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5, ceil })).to.deep.equal(500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0, ceil })).to.deep.equal(0)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5, ceil })).to.deep.equal(-500)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0, ceil })).to.deep.equal(-1000)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5, ceil })).to.deep.equal(-1500)
    expect(dhmsToMilliseconds({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4, ceil })).to.deep.equal(-97323400)
  })

  test('hmsToMilliseconds', () => {
    expect(hmsToMilliseconds({ hours: 0, minutes: 0, seconds: 0 })).to.equal(0)
    expect(hmsToMilliseconds({ hours: 0, minutes: 0, seconds: 1 })).to.equal(1000)
    expect(hmsToMilliseconds({ hours: 0, minutes: 1, seconds: 0 })).to.equal(60000)
    expect(hmsToMilliseconds({ hours: 1, minutes: 0, seconds: 0 })).to.equal(3600000)
    expect(hmsToMilliseconds({ hours: 1, minutes: 2, seconds: 3 })).to.equal(3723000)
  })

  test('isValidDate', () => {
    expect(isValidDate(new Date())).to.be.true
    expect(isValidDate(new Date('invalid'))).to.be.false
    expect(isValidDate(new Date(''))).to.be.false
    expect(isValidDate(null)).to.be.false
    expect(isValidDate(undefined)).to.be.false
  })

  test('parseDate', () => {
    expect(parseDate(new Date())).to.deep.equal(new Date())
    expect(parseDate(new Date('invalid'))).to.be.null
    expect(parseDate(new Date(''))).to.be.null
    expect(parseDate(null)).to.be.null
    expect(parseDate(undefined)).to.be.null
    expect(parseDate('2020-01-01')).to.deep.equal(new Date('2020-01-01T00:00:00.000Z'))
    expect(parseDate('2020-01-01T00:00:00.000Z')).to.deep.equal(new Date('2020-01-01T00:00:00.000Z'))
    expect(parseDate('2020-01-01T00:00:00.000+00:00')).to.deep.equal(new Date('2020-01-01T00:00:00.000+00:00'))
  })

  test('applyDate', () => {
    const date = new Date('2020-01-01T10:30:00.000Z')
    const ymd = new Date('2020-01-01')
    expect(applyDate(null)).to.be.null
    expect(applyDate(date)).to.deep.equal(date)
    expect(applyDate(date, '2020-01-01')).to.deep.equal(new Date('2020-01-01T10:30:00.000Z'))
    expect(applyDate(date, '2023-01-01')).to.deep.equal(new Date('2023-01-01T10:30:00.000Z'))
    expect(applyDate(date, '2020-03-01')).to.deep.equal(new Date('2020-03-01T10:30:00.000Z'))
    expect(applyDate(date, '2020-01-03')).to.deep.equal(new Date('2020-01-03T10:30:00.000Z'))
    expect(applyDate(date, '2020-02-02')).to.deep.equal(new Date('2020-02-02T10:30:00.000Z'))
    expect(applyDate(date, new Date('2020-01-01T10:12:13.000Z'))).to.deep.equal(new Date('2020-01-01T10:30:00.000Z'))
    expect(applyDate(date, new Date('2022-01-01T10:12:13.000Z'))).to.deep.equal(new Date('2022-01-01T10:30:00.000Z'))
    expect(applyDate(date, new Date('2020-02-01T10:12:13.000Z'))).to.deep.equal(new Date('2020-02-01T10:30:00.000Z'))
    expect(applyDate(date, new Date('2020-01-02T10:12:13.000Z'))).to.deep.equal(new Date('2020-01-02T10:30:00.000Z'))
    // Summer/Winter time change
    expect(applyDate('2020-01-01T10:15:00.000Z', '2020-05-05')).to.deep.equal(new Date('2020-05-05T10:15:00.000Z'))

    expect(applyDate(new Date('2022-05-30T10:15:00.000Z'), '2020-02-02')).to.deep.equal(new Date('2020-02-02T10:15:00.000Z'))
  })

  test('parseDateAsToday', () => {
    expect(parseDateAsToday(null)).to.be.null
    expect(parseDateAsToday(undefined)).to.be.null
    expect(parseDateAsToday('2020-01-01T23:45:00.000Z')).to.deep.equal(new Date(yyyyMMdd + 'T23:45:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))

    // Default tollerance (3h)
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T10:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T11:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T12:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T13:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T14:00:00.000Z' })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))

    // Custom tollerance (2h)
    const tollerance = 2 * 60 * 60 * 1000
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T10:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T11:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T12:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T13:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T14:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
  })

  test('timerToStartDate', () => {
    expect(timerToStartDate(null)).to.be.null
    expect(timerToStartDate(undefined)).to.be.null
    expect(timerToStartDate({})).to.be.null
    expect(timerToStartDate({ startTime: '2020-01-01T23:45:00.000Z', startDate: null })).to.deep.equal(new Date(yyyyMMdd + 'T23:45:00.000Z'))
    expect(timerToStartDate({ startTime: '2020-01-01T10:15:00.000Z', startDate: '2020-02-02' })).to.deep.equal(new Date('2020-02-02T10:15:00.000Z'))
    expect(timerToStartDate({ startTime: null, startDate: '2020-02-02' })).to.be.null
  })

  test('timerToFinishDate', () => {
    expect(timerToFinishDate(null)).to.be.null
    expect(timerToFinishDate(undefined)).to.be.null
    expect(timerToFinishDate({})).to.be.null
    expect(timerToFinishDate({ finishTime: '2020-01-01T23:45:00.000Z', finishDate: null })).to.deep.equal(new Date(yyyyMMdd + 'T23:45:00.000Z'))
    expect(timerToFinishDate({ finishTime: '2020-01-01T10:15:00.000Z', finishDate: '2020-02-02' })).to.deep.equal(new Date('2020-02-02T10:15:00.000Z'))
    expect(timerToFinishDate({ finishTime: null, finishDate: '2020-02-02' })).to.be.null

    // with start date
    expect(timerToFinishDate({ finishTime: '2020-01-01T11:15:00.000Z', finishDate: null, startTime: '2020-01-01T10:15:00.000Z', startDate: '2020-02-02' })).to.deep.equal(new Date('2020-02-02T11:15:00.000Z'))
    expect(timerToFinishDate({ finishTime: '2020-01-01T11:15:00.000Z', finishDate: null, startTime: '2020-01-01T12:15:00.000Z', startDate: '2020-02-02' })).to.deep.equal(new Date('2020-02-03T11:15:00.000Z'))
  })
})

