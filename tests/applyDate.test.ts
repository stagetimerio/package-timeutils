import { expect } from 'chai'
import { applyDate } from '../src/index'

describe('applyDate', () => {
  test('Invalid data', () => {
    const now = new Date()
    expect(applyDate(true as unknown as Date, null)).to.be.null
    expect(applyDate(false as unknown as Date, null)).to.be.null
    expect(applyDate(null, null)).to.be.null
    expect(applyDate(undefined as unknown as Date, null)).to.be.null
    expect(applyDate('a', null)).to.be.null
    expect(applyDate(now, true as unknown as Date)).to.deep.equal(now)
    expect(applyDate(now, false as unknown as Date)).to.deep.equal(now)
    expect(applyDate(now, null)).to.deep.equal(now)
    expect(applyDate(now, undefined as unknown as Date)).to.deep.equal(now)
    expect(applyDate(now, 'a')).to.deep.equal(now)
  })

  test('US DST change March 12 (w/o timezone)', () => {
    const inTime = new Date('2023-03-11T15:10:00.000Z')
    const inDate = new Date('2023-03-14T03:33:33.000Z')
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z'))
  })

  test('US DST change March 12 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-03-11T15:10:00.000Z')
    const inDate = new Date('2023-03-14T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z'))
  })

  test('US DST change March 12 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-03-11T15:10:00.000Z')
    const inDate = new Date('2023-03-14T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z'))
  })

  test('US DST change March 12 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-03-11T15:10:00.000Z')
    const inDate = new Date('2023-03-14T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-13T14:10:00.000Z'))
  })

  test('US DST change March 12 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-03-11T15:10:00.000Z')
    const inDate = new Date('2023-03-14T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-13T15:10:00.000Z'))
  })

  test('DE DST change March 26 (w/o timezone)', () => {
    const inTime = new Date('2023-03-24T15:10:00.000Z')
    const inDate = new Date('2023-03-28T03:33:33.000Z')
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-03-28T15:10:00.000Z'))
  })

  test('DE DST change March 26 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-03-24T15:10:00.000Z')
    const inDate = new Date('2023-03-28T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-28T15:10:00.000Z'))
  })

  test('DE DST change March 26 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-03-24T15:10:00.000Z')
    const inDate = new Date('2023-03-28T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-28T14:10:00.000Z'))
  })

  test('DE DST change March 26 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-03-24T15:10:00.000Z')
    const inDate = new Date('2023-03-28T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-27T15:10:00.000Z'))
  })

  test('DE DST change March 26 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-03-24T15:10:00.000Z')
    const inDate = new Date('2023-03-28T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-27T15:10:00.000Z'))
  })

  test('AU DST change Oct 1 (w/o timezone)', () => {
    const inTime = new Date('2023-09-30T15:10:00.000Z')
    const inDate = new Date('2023-10-02T03:33:33.000Z')
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z'))
  })

  test('AU DST change Oct 1 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-09-30T15:10:00.000Z')
    const inDate = new Date('2023-10-02T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z'))
  })

  test('AU DST change Oct 1 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-09-30T15:10:00.000Z')
    const inDate = new Date('2023-10-02T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z'))
  })

  test('AU DST change Oct 1 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-09-30T15:10:00.000Z')
    const inDate = new Date('2023-10-02T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-01T15:10:00.000Z'))
  })

  test('AU DST change Oct 1 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-09-30T15:10:00.000Z')
    const inDate = new Date('2023-10-02T03:33:33.000Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-01T14:10:00.000Z'))
  })

  test('Bug: "Until Finish Time" – DST offset', () => {
    const tz = 'Europe/Berlin'
    const today = new Date('2024-02-03T23:00:00.000Z')

    expect(applyDate(new Date('2023-10-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-04T22:30:00.000Z')
    )

    expect(applyDate(new Date('2023-12-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-04T21:30:00.000Z')
    )
  })

  test('Bug: "Until Finish Time" – wrong date', () => {
    const tz = 'America/Los_Angeles'
    const today = new Date('2024-02-03T08:00:00.000Z')

    expect(applyDate(new Date('2023-10-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-03T22:30:00.000Z')
    )

    expect(applyDate(new Date('2023-12-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-03T21:30:00.000Z')
    )
  })

  test('Bug: February 27 -> 30 in a leap year', () => {
    const inTime = new Date('2024-02-27T07:04:04.000Z')
    const inDate = new Date('2023-11-30T07:02:02.000Z')
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-11-30T07:04:04.000Z'))
  })

  test('Bug: DST change at 3AM on 2025-03-30, use the correct offsets', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2025-03-30T00:00:00.000Z')
    const inDate = new Date('2025-03-30T19:02:28.858Z')
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2025-03-30T00:00:00.000Z'))
  })
})
