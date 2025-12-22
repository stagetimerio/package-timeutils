import { expect } from 'chai'
import { parseDateAsToday } from '../src/index'

describe('parseDateAsToday', () => {
  test('Invalid inputs', () => {
    expect(parseDateAsToday(true as unknown as string)).to.be.null
    expect(parseDateAsToday(false as unknown as string)).to.be.null
    expect(parseDateAsToday(null as unknown as string)).to.be.null
    expect(parseDateAsToday(undefined as unknown as string)).to.be.null
    expect(parseDateAsToday('a')).to.be.null
  })

  test('Simple case (w/o timezone)', () => {
    const input = '2023-07-16T23:30:00.000Z'
    const now = '2023-08-02T13:00:00.000Z'
    const output = parseDateAsToday(input, { now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z'))
  })

  test('Simple case (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-07-16T23:30:00.000Z'
    const now = '2023-08-02T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z'))
  })

  test('Simple case (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-07-16T23:30:00.000Z'
    const now = '2023-08-02T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-01T23:30:00.000Z'))
  })

  test('Simple case (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-07-16T23:30:00.000Z'
    const now = '2023-08-02T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z'))
  })

  test('Simple case (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-07-16T23:30:00.000Z'
    const now = '2023-08-02T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-01T23:30:00.000Z'))
  })

  test('US DST change March 12 (w/o timezone)', () => {
    const input = '2023-03-09T02:30:00.000Z'
    const now = '2023-03-14T13:00:00.000Z'
    const output = parseDateAsToday(input, { now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z'))
  })

  test('US DST change March 12 (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-03-09T02:30:00.000Z'
    const now = '2023-03-14T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z'))
  })

  test('US DST change March 12 (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-03-09T02:30:00.000Z'
    const now = '2023-03-14T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z'))
  })

  test('US DST change March 12 (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-03-09T02:30:00.000Z'
    const now = '2023-03-14T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-15T01:30:00.000Z'))
  })

  test('US DST change March 12 (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-03-09T02:30:00.000Z'
    const now = '2023-03-14T13:00:00.000Z'
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-15T02:30:00.000Z'))
  })

  test('With after date (w/o timezone)', () => {
    const input = '2023-06-09T19:30:00.000Z'
    const now = '2024-10-07T17:13:49.000Z'
    const after = '2024-10-08T01:30:00.000Z'
    const output = parseDateAsToday(input, {
      after: new Date(after),
      now: new Date(now),
    })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z'))
  })

  test('With after date (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-06-09T19:30:00.000Z'
    const now = '2024-10-07T17:13:49.000Z'
    const after = '2024-10-08T01:30:00.000Z'
    const output = parseDateAsToday(input, {
      timezone,
      after: new Date(after),
      now: new Date(now),
    })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z'))
  })

  test('With after date (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-06-09T19:30:00.000Z'
    const now = '2024-10-07T17:13:49.000Z'
    const after = '2024-10-08T01:30:00.000Z'
    const output = parseDateAsToday(input, {
      timezone,
      after: new Date(after),
      now: new Date(now),
    })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z'))
  })

  test('With after date (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-06-09T19:30:00.000Z'
    const now = '2024-10-07T17:13:49.000Z'
    const after = '2024-10-08T01:30:00.000Z'
    const output = parseDateAsToday(input, {
      timezone,
      after: new Date(after),
      now: new Date(now),
    })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z'))
  })

  test('With after date (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-06-09T19:30:00.000Z'
    const now = '2024-10-07T17:13:49.000Z'
    const after = '2024-10-08T01:30:00.000Z'
    const output = parseDateAsToday(input, {
      timezone,
      after: new Date(after),
      now: new Date(now),
    })
    expect(output).to.deep.equal(new Date('2024-10-08T18:30:00.000Z'))
  })

  test('Bug: Wrong day on date of DST change 2025-03-30', () => {
    const timezone = 'Europe/Berlin'
    const input = '2025-03-30T20:20:00.000Z'
    const now = '2025-03-30T17:43:50.000Z'
    const after = undefined
    const output = parseDateAsToday(input, { timezone, after, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2025-03-30T20:20:00.000Z'))
  })
})
