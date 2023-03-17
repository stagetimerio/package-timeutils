import { default as chai } from 'chai'
import { timerToStartDate } from '../index.js'
import { addDays } from 'date-fns'
const { expect } = chai

describe('timeUtils.timerToStartDate', () => {
  test('invalid input null', () => {
    expect(timerToStartDate(null)).to.be.null
  })
  test('invalid input undefined', () => {
    expect(timerToStartDate(undefined)).to.be.null
  })
  test('invalid input {}', () => {
    expect(timerToStartDate({})).to.be.null
  })
  test('only startTime', () => {
    const input = new Date('2020-01-01T23:45:00.000Z')
    const target1 = new Date() // today
    const target2 = addDays(new Date(), 1) // tomorrow
    const output = timerToStartDate({ startTime: '2020-01-01T23:45:00.000Z', startDate: null })
    expect(output.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output.toLocaleDateString()).to.be.oneOf([target1.toLocaleDateString(), target2.toLocaleDateString()])
  })
  test('startTime and startDate', () => {
    const input = new Date('2020-01-01T10:15:00.000Z')
    const target1 = new Date('2020-02-02') // start day
    const target2 = addDays(new Date('2020-02-02'), 1) // start day + 1
    const output = timerToStartDate({ startTime: '2020-01-01T10:15:00.000Z', startDate: '2020-02-02' })
    expect(output.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output.toLocaleDateString()).to.be.oneOf([target1.toLocaleDateString(), target2.toLocaleDateString()])
  })
  test('only startDate', () => {
    expect(timerToStartDate({ startTime: null, startDate: '2020-02-02' })).to.be.null
  })
})
