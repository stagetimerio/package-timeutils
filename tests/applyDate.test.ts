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
    const inTime = new Date('2023-03-11T15:10:00.000Z') // Sat Mar 11 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-03-14T03:33:33.000Z') // Tue Mar 14 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z')) // Tue Mar 14 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('US DST change March 12 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-03-11T15:10:00.000Z') // Sat Mar 11 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-03-14T03:33:33.000Z') // Tue Mar 14 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z')) // Tue Mar 14 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('US DST change March 12 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-03-11T15:10:00.000Z') // Sat Mar 11 2023 16:10:00 GMT+0100 (Central European Standard Time)
    const inDate = new Date('2023-03-14T03:33:33.000Z') // Tue Mar 14 2023 04:33:33 GMT+0100 (Central European Standard Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-14T15:10:00.000Z')) // Tue Mar 14 2023 16:10:00 GMT+0100 (Central European Standard Time)
  })

  test('US DST change March 12 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-03-11T15:10:00.000Z') // Sat Mar 11 2023 07:10:00 GMT-0800 (Pacific Standard Time)
    const inDate = new Date('2023-03-14T03:33:33.000Z') // Mon Mar 13 2023 20:33:33 GMT-0700 (Pacific Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-13T14:10:00.000Z')) // Mon Mar 13 2023 07:10:00 GMT-0700 (Pacific Daylight Time)
  })

  test('US DST change March 12 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-03-11T15:10:00.000Z') // Sun Mar 12 2023 02:10:00 GMT+1100 (Australian Eastern Daylight Time)
    const inDate = new Date('2023-03-14T03:33:33.000Z') // Tue Mar 14 2023 14:33:33 GMT+1100 (Australian Eastern Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-13T15:10:00.000Z')) // Tue Mar 14 2023 02:10:00 GMT+1100 (Australian Eastern Daylight Time)
  })

  test('DE DST change March 26 (w/o timezone)', () => {
    const inTime = new Date('2023-03-24T15:10:00.000Z') // Fri Mar 24 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-03-28T03:33:33.000Z') // Tue Mar 28 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-03-28T15:10:00.000Z')) // Tue Mar 28 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('DE DST change March 26 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-03-24T15:10:00.000Z') // Fri Mar 24 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-03-28T03:33:33.000Z') // Tue Mar 28 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-28T15:10:00.000Z')) // Tue Mar 28 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('DE DST change March 26 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-03-24T15:10:00.000Z') // Fri Mar 24 2023 16:10:00 GMT+0100 (Central European Standard Time)
    const inDate = new Date('2023-03-28T03:33:33.000Z') // Tue Mar 28 2023 05:33:33 GMT+0200 (Central European Summer Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-28T14:10:00.000Z')) // Tue Mar 28 2023 16:10:00 GMT+0200 (Central European Summer Time)
  })

  test('DE DST change March 26 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-03-24T15:10:00.000Z') // Fri Mar 24 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
    const inDate = new Date('2023-03-28T03:33:33.000Z') // Mon Mar 27 2023 20:33:33 GMT-0700 (Pacific Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-27T15:10:00.000Z')) // Mon Mar 27 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
  })

  test('DE DST change March 26 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-03-24T15:10:00.000Z') // Sat Mar 25 2023 02:10:00 GMT+1100 (Australian Eastern Daylight Time)
    const inDate = new Date('2023-03-28T03:33:33.000Z') // Tue Mar 28 2023 14:33:33 GMT+1100 (Australian Eastern Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-03-27T15:10:00.000Z')) // Tue Mar 28 2023 02:10:00 GMT+1100 (Australian Eastern Daylight Time)
  })

  test('AU DST change Oct 1 (w/o timezone)', () => {
    const inTime = new Date('2023-09-30T15:10:00.000Z') // Sat Sep 30 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-10-02T03:33:33.000Z') // Mon Oct 02 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z')) // Mon Oct 02 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('AU DST change Oct 1 (UTC)', () => {
    const tz = 'UTC'
    const inTime = new Date('2023-09-30T15:10:00.000Z') // Sat Sep 30 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
    const inDate = new Date('2023-10-02T03:33:33.000Z') // Mon Oct 02 2023 03:33:33 GMT+0000 (Coordinated Universal Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z')) // Mon Oct 02 2023 15:10:00 GMT+0000 (Coordinated Universal Time)
  })

  test('AU DST change Oct 1 (Europe/Berlin)', () => {
    const tz = 'Europe/Berlin'
    const inTime = new Date('2023-09-30T15:10:00.000Z') // Sat Sep 30 2023 17:10:00 GMT+0200 (Central European Summer Time)
    const inDate = new Date('2023-10-02T03:33:33.000Z') // Mon Oct 02 2023 05:33:33 GMT+0200 (Central European Summer Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-02T15:10:00.000Z')) // Mon Oct 02 2023 17:10:00 GMT+0200 (Central European Summer Time)
  })

  test('AU DST change Oct 1 (America/Los_Angeles)', () => {
    const tz = 'America/Los_Angeles'
    const inTime = new Date('2023-09-30T15:10:00.000Z') // Sat Sep 30 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
    const inDate = new Date('2023-10-02T03:33:33.000Z') // Sun Oct 01 2023 20:33:33 GMT-0700 (Pacific Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-01T15:10:00.000Z')) // Sun Oct 01 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
  })

  test('AU DST change Oct 1 (Australia/Sydney)', () => {
    const tz = 'Australia/Sydney'
    const inTime = new Date('2023-09-30T15:10:00.000Z') // Sun Oct 01 2023 01:10:00 GMT+1000 (Australian Eastern Standard Time)
    const inDate = new Date('2023-10-02T03:33:33.000Z') // Mon Oct 02 2023 14:33:33 GMT+1100 (Australian Eastern Daylight Time)
    const output = applyDate(inTime, inDate, tz)
    expect(output).to.deep.equal(new Date('2023-10-01T14:10:00.000Z')) // Mon Oct 02 2023 01:10:00 GMT+1100 (Australian Eastern Daylight Time)
  })

  test('Bug: "Until Finish Time" – DST offset', () => {
    const tz = 'Europe/Berlin'
    const today = new Date('2024-02-03T23:00:00.000Z')

    // Pre DST date
    expect(applyDate(new Date('2023-10-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-04T22:30:00.000Z')
    )

    // Post DST date
    expect(applyDate(new Date('2023-12-15T21:30:00.000Z'), today, tz)).to.deep.equal(
      new Date('2024-02-04T21:30:00.000Z')
    )
  })

  test('Bug: "Until Finish Time" – wrong date', () => {
    const tz = 'America/Los_Angeles'
    const today = new Date('2024-02-03T08:00:00.000Z') // Sat Feb 03 2024 00:00:00 GMT-0800 (Pacific Standard Time)

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

  test('Bug: Month overflow - Dec 30 to Feb should not become March', () => {
    // This bug occurred when source day (30) doesn't exist in target month (Feb)
    const inTime = new Date('2025-12-30T10:15:00.000Z') // Dec 30
    const inDate = new Date('2020-02-02T00:00:00.000Z') // Feb 2
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2020-02-02T10:15:00.000Z'))
  })

  test('Bug: Month overflow - Dec 31 to Feb should not become March', () => {
    const inTime = new Date('2025-12-31T10:15:00.000Z') // Dec 31
    const inDate = new Date('2020-02-15T00:00:00.000Z') // Feb 15
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2020-02-15T10:15:00.000Z'))
  })

  test('Bug: Month overflow - Jan 31 to Apr (30 days) should not overflow', () => {
    const inTime = new Date('2025-01-31T10:15:00.000Z') // Jan 31
    const inDate = new Date('2020-04-15T00:00:00.000Z') // Apr 15
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2020-04-15T10:15:00.000Z'))
  })

  test('Bug: Month overflow - Mar 31 to Feb in leap year', () => {
    const inTime = new Date('2025-03-31T10:15:00.000Z') // Mar 31
    const inDate = new Date('2020-02-29T00:00:00.000Z') // Feb 29 (leap year)
    const output = applyDate(inTime, inDate)
    expect(output).to.deep.equal(new Date('2020-02-29T10:15:00.000Z'))
  })
})
