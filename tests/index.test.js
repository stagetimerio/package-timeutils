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
  toYYYYMMDD,
} from '../index.js'
import { format, addDays, addMinutes } from 'date-fns'

const { expect } = chai

const TZ = {
  name: Intl.DateTimeFormat().resolvedOptions().timeZone,
  offset: new Date().getTimezoneOffset(),
}

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

  // Check invalid input
  test('parseDate: Check invalid input', () => {
    expect(parseDate(new Date('invalid'))).to.be.null
    expect(parseDate(new Date(''))).to.be.null
    expect(parseDate(null)).to.be.null
    expect(parseDate(undefined)).to.be.null
  })

  // Make sure a returned date instance is a deep copy
  test('parseDate: Returned date instance is a deep copy', () => {
    const tmpDate = new Date()
    expect(parseDate(tmpDate)).to.deep.equal(tmpDate)
    expect(parseDate(tmpDate)).to.not.equal(tmpDate)
  })

  test('parseDate: Parse strings correctly', () => {
    expect(parseDate('2020-03-03'))
      .to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), TZ.offset))

    expect(parseDate('2020-03-03T00:00:00'))
      .to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), TZ.offset))

    expect(parseDate('2020-03-03T00:00:00.000Z'))
      .to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), 0))

    expect(parseDate('2020-03-03T00:00:00.000+00:00'))
      .to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), 0))
  })

  test('parseDate: Validate parameter `asUTC`', () => {
    expect(parseDate('2020-01-05', { asUTC: true }))
      .to.deep.equal(addMinutes(new Date('2020-01-05T00:00:00.000Z'), 0))

    expect(parseDate('2020-01-05', { asUTC: false }))
      .to.deep.equal(addMinutes(new Date('2020-01-05T00:00:00.000Z'), TZ.offset))

    expect(parseDate('2020-01-05T04:00:00', { asUTC: true }))
      .to.deep.equal(addMinutes(new Date('2020-01-05T04:00:00.000Z'), 0))

    expect(parseDate('2020-01-05T04:00:00', { asUTC: false }))
      .to.deep.equal(addMinutes(new Date('2020-01-05T04:00:00.000Z'), TZ.offset))
  })

  test('toYYYYMMDD', () => {
    const at2AM = new Date('2020-01-05T02:00:00.000Z')
    const at9PM = new Date('2020-01-05T21:00:00.000Z')
    expect(toYYYYMMDD(at2AM, { asUTC: false })).to.equal(format(at2AM, 'yyyy-MM-dd'))
    expect(toYYYYMMDD(at2AM, { asUTC: true })).to.equal('2020-01-05')
    expect(toYYYYMMDD(at9PM, { asUTC: false })).to.equal(format(at9PM, 'yyyy-MM-dd'))
    expect(toYYYYMMDD(at9PM, { asUTC: true })).to.equal('2020-01-05')
  })

  test('applyDate: Simple case', () => {
    // Simple test
    let inTime = parseDate('2011-01-27T05:48:00', { asUTC: false })
    let inDate = parseDate('2011-02-12', { asUTC: false })
    let output = applyDate(inTime, inDate)
    let check = addMinutes(new Date('2011-02-12T05:48:00.000Z'), TZ.offset)
    // console.log(`
    //   TIME  = ${inTime} | ${inTime.toISOString()}
    //   DATE  = ${inDate} | ${inDate.toISOString()}
    //   OUT   = ${output} | ${output.toISOString()}
    //   CHECK = ${check} | ${check.toISOString()}
    // `)
    expect(output).to.deep.equal(check)

    // Same test, but check is calculated differently
    inTime = parseDate('2011-01-27T05:48:00', { asUTC: false })
    inDate = parseDate('2011-02-12', { asUTC: false })
    output = applyDate(inTime, inDate)
    check = addDays(inTime, 16)
    expect(output).to.deep.equal(check)

    // Same test, but skipping parseDate()
    output = applyDate('2011-01-27T05:48:00', '2011-02-12', { asUTC: false })
    check = addDays(parseDate('2011-01-27T05:48:00'), 16)
    expect(output).to.deep.equal(check)
  })

  test('applyDate: After summer/winter time change', () => {
    // After summer/winter time change
    const inTime = parseDate('2011-02-27T05:48:00', { asUTC: false })
    const inDate = parseDate('2011-05-12', { asUTC: false })
    const output = applyDate(inTime, inDate, { asUTC: false })
    const check = addDays(inTime, 74)
    expect(output).to.deep.equal(check)
  })

  test('applyDate: Before/After midnight', () => {
    // Times close before midnight
    const output1 = applyDate('2011-01-27T23:52:00', '2011-02-12', { asUTC: false })
    const check1 = addDays(parseDate('2011-01-27T23:52:00', { asUTC: false }), 16)
    expect(output1).to.deep.equal(check1)

    // Times close after midnight
    const output2 = applyDate('2011-01-27T01:04:00', '2011-02-12', { asUTC: false })
    const check2 = addDays(parseDate('2011-01-27T01:04:00', { asUTC: false }), 16)
    expect(output2).to.deep.equal(check2)
  })

  test('applyDate: Very large time gap', () => {
    // Very large time gap
    const output = applyDate('2011-02-27T06:51:00', '2018-05-30', { asUTC: false })
    const check = addDays(parseDate('2011-02-27T06:51:00', { asUTC: false }), 2649)
    expect(output).to.deep.equal(check)
  })

  test('applyDate: The troublesome January 1', () => {
    // January 1, local dates
    const inTime1 = parseDate('2020-01-01T00:15:00', { asUTC: false })
    const inDate1 = parseDate('2022-02-02', { asUTC: false })
    const output1 = applyDate(inTime1, inDate1, { asUTC: false })
    const check1 = addDays(inTime1, 763)
    expect(output1).to.deep.equal(check1)

    // January 1, UTC dates
    const inTime2 = parseDate('2020-01-01T00:15:00.120Z', { asUTC: true })
    const inDate2 = parseDate('2022-02-02', { asUTC: true })
    const output2 = applyDate(inTime2, inDate2, { asUTC: true })
    const check2 = addDays(inTime2, 763)
    expect(output2).to.deep.equal(check2)
  })

  test('parseDateAsToday: Invalid data', () => {
    // false inputs
    expect(parseDateAsToday(true)).to.be.null
    expect(parseDateAsToday(false)).to.be.null
    expect(parseDateAsToday(null)).to.be.null
    expect(parseDateAsToday(undefined)).to.be.null
    expect(parseDateAsToday('a')).to.be.null
  })

  test('parseDateAsToday: Basics', () => {
    // parse with reference
    const reference = '2022-02-02'
    expect(parseDateAsToday('2020-01-01T00:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T00:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T01:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T01:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T02:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T02:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T03:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T03:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T04:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T04:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T05:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T05:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T06:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T06:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T07:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T07:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T08:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T08:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T09:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T09:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T11:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T11:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T12:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T12:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T13:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T13:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T14:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T14:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T15:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T15:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T16:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T16:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T17:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T17:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T18:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T18:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T19:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T19:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T20:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-02T20:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T21:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-01T21:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T22:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-01T22:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T23:15:00.000Z', { reference })).to.deep.equal(new Date('2022-02-01T23:15:00.000Z'))
  })

  test('parseDateAsToday: Default tolerance 3h', () => {
    // Should be interpreted as the previous day
    expect(parseDateAsToday('2020-01-02T23:15:00.000Z', { reference: '2022-02-02T00:00:00.000Z' })).to.deep.equal(new Date('2022-02-01T23:15:00.000Z'))
    expect(parseDateAsToday('2020-01-02T23:15:00.000Z', { reference: '2022-02-02T01:00:00.000Z' })).to.deep.equal(new Date('2022-02-01T23:15:00.000Z'))
    expect(parseDateAsToday('2020-01-02T23:15:00.000Z', { reference: '2022-02-02T02:00:00.000Z' })).to.deep.equal(new Date('2022-02-01T23:15:00.000Z'))

    // Should be interpreted as the same day in the future
    expect(parseDateAsToday('2020-01-02T23:15:00.000Z', { reference: '2022-02-02T03:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T23:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T08:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T09:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T10:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))

    // Should be interpreted as the same day in the past
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T11:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T12:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T13:00:00.000Z' })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))

    // Should be interpreted as the next day in the future
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T14:00:00.000Z' })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-03T10:15:00.000Z', { reference: '2022-02-02T15:00:00.000Z' })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))


    // expect(parseDateAsToday('2020-01-03T23:30:00.000Z', { reference: '2022-02-02T00:30:00.000Z' })).to.deep.equal(new Date('2022-02-01T23:30:00.000Z'))
  })

  test('parseDateAsToday: Custom tollerance 2h', () => {
    const tollerance = 2 * 60 * 60 * 1000
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T10:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T11:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T12:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T13:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T14:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
  })

  test('timerToStartDate', () => {
    const yyyyMMdd = format(new Date(), 'yyyy-MM-dd')
    expect(timerToStartDate(null)).to.be.null
    expect(timerToStartDate(undefined)).to.be.null
    expect(timerToStartDate({})).to.be.null
    expect(timerToStartDate({ startTime: '2020-01-01T23:45:00.000Z', startDate: null })).to.deep.equal(new Date(yyyyMMdd + 'T23:45:00.000Z'))
    expect(timerToStartDate({ startTime: '2020-01-01T10:15:00.000Z', startDate: '2020-02-02' })).to.deep.equal(new Date('2020-02-02T10:15:00.000Z'))
    expect(timerToStartDate({ startTime: null, startDate: '2020-02-02' })).to.be.null
  })

  test('timerToFinishDate', () => {
    const yyyyMMdd = format(new Date(), 'yyyy-MM-dd')
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

