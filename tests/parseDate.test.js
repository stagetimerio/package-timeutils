import { default as chai } from 'chai'
import { parseDate } from '../index.js'
import { addMinutes } from 'date-fns'
const { expect } = chai

describe('timeUtils.parseDate', () => {
  // Check invalid input
  test('Check invalid input', () => {
    expect(parseDate(true)).to.be.null
    expect(parseDate(false)).to.be.null
    expect(parseDate(new Date('invalid'))).to.be.null
    expect(parseDate(new Date(''))).to.be.null
    expect(parseDate(null)).to.be.null
    expect(parseDate(undefined)).to.be.null
  })

  // Make sure a returned date instance is a deep copy
  test('Returned date instance is a deep copy', () => {
    const tmpDate = new Date()
    expect(parseDate(tmpDate)).to.deep.equal(tmpDate)
    expect(parseDate(tmpDate)).to.not.equal(tmpDate)
  })

  test('Parse strings correctly', () => {
    // Note: we need the TZ offset from the validation date, otherwise we may get an offset with DST
    const tzOffset = new Date('2020-03-03T00:00:00.000Z').getTimezoneOffset()
    expect(parseDate('2020-03-03')).to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), tzOffset))
    expect(parseDate('2020-03-03T00:00:00')).to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), tzOffset))
    expect(parseDate('2020-03-03T00:00:00.000Z')).to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), 0))
    expect(parseDate('2020-03-03T00:00:00.000+00:00')).to.deep.equal(addMinutes(new Date('2020-03-03T00:00:00.000Z'), 0))
  })

  test('Validate parameter `asUTC`', () => {
    const tzOffset = new Date('2020-01-05T00:00:00.000Z').getTimezoneOffset()
    expect(parseDate('2020-01-05', { asUTC: true })).to.deep.equal(addMinutes(new Date('2020-01-05T00:00:00.000Z'), 0))
    expect(parseDate('2020-01-05', { asUTC: false })).to.deep.equal(addMinutes(new Date('2020-01-05T00:00:00.000Z'), tzOffset))
    expect(parseDate('2020-01-05T04:00:00', { asUTC: true })).to.deep.equal(addMinutes(new Date('2020-01-05T04:00:00.000Z'), 0))
    expect(parseDate('2020-01-05T04:00:00', { asUTC: false })).to.deep.equal(addMinutes(new Date('2020-01-05T04:00:00.000Z'), tzOffset))
  })
})
