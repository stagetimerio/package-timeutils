import { expect } from 'chai'
import { timerToFinishDate } from '../src/index'
import { addDays } from 'date-fns'

describe('timerToFinishDate', () => {
  test('invalid input null', () => {
    expect(timerToFinishDate(null)).to.be.null
  })
  test('invalid input undefined', () => {
    expect(timerToFinishDate(undefined)).to.be.null
  })
  test('invalid input {}', () => {
    expect(timerToFinishDate({})).to.be.null
  })
  test('only finishTime', () => {
    const input = new Date('2020-01-01T23:45:00.000Z')
    const target1 = new Date()
    const target2 = addDays(new Date(), 1)
    const output = timerToFinishDate({
      finishTime: '2020-01-01T23:45:00.000Z',
      finishDate: null as unknown as undefined,
    })
    expect(output?.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output?.toLocaleDateString()).to.be.oneOf([
      target1.toLocaleDateString(),
      target2.toLocaleDateString(),
    ])
  })
  test('finishTime and finishDate', () => {
    const input = new Date('2020-01-01T10:15:00.000Z')
    const target1 = new Date('2020-02-02')
    const target2 = addDays(new Date('2020-02-02'), 1)
    const output = timerToFinishDate({
      finishTime: '2020-01-01T10:15:00.000Z',
      finishDate: '2020-02-02',
    })
    expect(output?.toLocaleTimeString()).to.equal(input.toLocaleTimeString())
    expect(output?.toLocaleDateString()).to.be.oneOf([
      target1.toLocaleDateString(),
      target2.toLocaleDateString(),
    ])
  })
  test('only finishDate', () => {
    expect(
      timerToFinishDate({
        finishTime: null as unknown as undefined,
        finishDate: '2020-02-02',
      })
    ).to.be.null
  })
  test('with startTime and startDate (1)', () => {
    expect(
      timerToFinishDate({
        finishTime: '2020-01-01T11:15:00.000Z',
        finishDate: null as unknown as undefined,
        startTime: '2020-01-01T10:15:00.000Z',
        startDate: '2020-02-02',
      })
    ).to.deep.equal(new Date('2020-02-02T11:15:00.000Z'))
  })
  test('with startTime and startDate (2)', () => {
    expect(
      timerToFinishDate({
        finishTime: '2020-01-01T11:15:00.000Z',
        finishDate: null as unknown as undefined,
        startTime: '2020-01-01T12:15:00.000Z',
        startDate: '2020-02-02',
      })
    ).to.deep.equal(new Date('2020-02-03T11:15:00.000Z'))
  })
})
