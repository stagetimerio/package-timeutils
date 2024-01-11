import { expect } from 'chai'
import { parseDateAsToday } from '../index.js'
import { addDays } from 'date-fns'

const today = new Date()
const tomorrow = addDays(new Date(), 1)

describe('parseDateAsToday', () => {
  test('Invalid inputs', () => {
    expect(parseDateAsToday(true)).to.be.null
    expect(parseDateAsToday(false)).to.be.null
    expect(parseDateAsToday(null)).to.be.null
    expect(parseDateAsToday(undefined)).to.be.null
    expect(parseDateAsToday('a')).to.be.null
  })

  test('ISO string input, tolerance 0h', () => {
    const input = new Date('2020-01-01T00:15:00.000Z')
    const output = parseDateAsToday('2020-01-01T00:15:00.000Z', { tollerance: 0 })
    expect(output.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output.toLocaleDateString()).to.be.oneOf([today.toLocaleDateString(), tomorrow.toLocaleDateString()])
  })

  test('Date input, tolerance 0h', () => {
    const input = new Date('2020-01-01T00:15:00.000Z')
    const output = parseDateAsToday(input, { tollerance: 0 })
    expect(output.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output.toLocaleDateString()).to.be.oneOf([today.toLocaleDateString(), tomorrow.toLocaleDateString()])
  })

  test('ISO string input, custom reference, tollerance 3h', () => {
    const opt = {
      reference: '2022-02-02T00:00:00.000Z',
      tollerance: 3 * 60 * 60 * 1000, // 3 hours
    }

    expect(parseDateAsToday('2020-01-01T00:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T00:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T01:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T01:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T02:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T02:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T03:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T03:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T04:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T04:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T05:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T05:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T06:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T06:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T07:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T07:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T08:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T08:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T09:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T09:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T11:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T11:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T12:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T12:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T13:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T13:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T14:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T14:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T15:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T15:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T16:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T16:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T17:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T17:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T18:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T18:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T19:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T19:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T20:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-02T20:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T21:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-01T21:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T22:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-01T22:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T23:15:00.000Z', opt)).to.deep.equal(new Date('2022-02-01T23:15:00.000Z'))
  })

  test('Default tolerance 3h', () => {
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
  })

  test('Custom tollerance 2h', () => {
    const tollerance = 2 * 60 * 60 * 1000
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T10:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T11:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T12:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-02T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T13:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
    expect(parseDateAsToday('2020-01-01T10:15:00.000Z', { reference: '2022-02-02T14:00:00.000Z', tollerance })).to.deep.equal(new Date('2022-02-03T10:15:00.000Z'))
  })
})
