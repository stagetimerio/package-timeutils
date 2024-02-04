import { expect } from 'chai'
import { parseDateAsToday } from '../index.js'

describe('parseDateAsToday', () => {
  test('Invalid inputs', () => {
    expect(parseDateAsToday(true)).to.be.null
    expect(parseDateAsToday(false)).to.be.null
    expect(parseDateAsToday(null)).to.be.null
    expect(parseDateAsToday(undefined)).to.be.null
    expect(parseDateAsToday('a')).to.be.null
  })

  test('Simple case (w/o timezone)', () => {
    const input = '2023-07-16T23:30:00.000Z' // Sun Jul 16 2023 23:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2023-08-02T13:00:00.000Z' // Wed Aug 02 2023 13:00:00 GMT+0000 (Coordinated Universal Time)
    const output = parseDateAsToday(input, { now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z')) // Wed Aug 02 2023 23:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('Simple case (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-07-16T23:30:00.000Z' // Sun Jul 16 2023 23:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2023-08-02T13:00:00.000Z' // Wed Aug 02 2023 13:00:00 GMT+0000 (Coordinated Universal Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z')) // Wed Aug 02 2023 23:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('Simple case (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-07-16T23:30:00.000Z' // Mon Jul 17 2023 01:30:00 GMT+0200 (Central European Summer Time)
    const now = '2023-08-02T13:00:00.000Z' // Wed Aug 02 2023 15:00:00 GMT+0200 (Central European Summer Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-01T23:30:00.000Z')) // Thu Aug 03 2023 01:30:00 GMT+0200 (Central European Summer Time)
  })

  test('Simple case (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-07-16T23:30:00.000Z' // Sun Jul 16 2023 16:30:00 GMT-0700 (Pacific Daylight Time)
    const now = '2023-08-02T13:00:00.000Z' // Wed Aug 02 2023 06:00:00 GMT-0700 (Pacific Daylight Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-02T23:30:00.000Z')) // Wed Aug 02 2023 16:30:00 GMT-0700 (Pacific Daylight Time)
  })

  test('Simple case (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-07-16T23:30:00.000Z' // Mon Jul 17 2023 09:30:00 GMT+1000 (Australian Eastern Standard Time)
    const now = '2023-08-02T13:00:00.000Z' // Wed Aug 02 2023 23:00:00 GMT+1000 (Australian Eastern Standard Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-08-01T23:30:00.000Z')) // Thu Aug 03 2023 09:30:00 GMT+1000 (Australian Eastern Standard Time)
  })

  test('US DST change March 12 (w/o timezone)', () => {
    const input = '2023-03-09T02:30:00.000Z' // Thu Mar 09 2023 02:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2023-03-14T13:00:00.000Z' // Tue Mar 14 2023 13:00:00 GMT+0000 (Coordinated Universal Time)
    const output = parseDateAsToday(input, { now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z')) // Tue Mar 14 2023 02:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('US DST change March 12 (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-03-09T02:30:00.000Z' // Thu Mar 09 2023 02:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2023-03-14T13:00:00.000Z' // Tue Mar 14 2023 13:00:00 GMT+0000 (Coordinated Universal Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z')) // Tue Mar 14 2023 02:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('US DST change March 12 (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-03-09T02:30:00.000Z' // Thu Mar 09 2023 03:30:00 GMT+0100 (Central European Standard Time)
    const now = '2023-03-14T13:00:00.000Z' // Tue Mar 14 2023 14:00:00 GMT+0100 (Central European Standard Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-14T02:30:00.000Z')) // Tue Mar 14 2023 03:30:00 GMT+0100 (Central European Standard Time)
  })

  test('US DST change March 12 (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-03-09T02:30:00.000Z' // Wed Mar 08 2023 18:30:00 GMT-0800 (Pacific Standard Time)
    const now = '2023-03-14T13:00:00.000Z' // Tue Mar 14 2023 06:00:00 GMT-0700 (Pacific Daylight Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-15T01:30:00.000Z')) // Tue Mar 14 2023 18:30:00 GMT-0700 (Pacific Daylight Time)
  })

  test('US DST change March 12 (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-03-09T02:30:00.000Z' // Thu Mar 09 2023 13:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const now = '2023-03-14T13:00:00.000Z' // Wed Mar 15 2023 00:00:00 GMT+1100 (Australian Eastern Daylight Time)
    const output = parseDateAsToday(input, { timezone, now: new Date(now) })
    expect(output).to.deep.equal(new Date('2023-03-15T02:30:00.000Z')) // Wed Mar 15 2023 13:30:00 GMT+1100 (Australian Eastern Daylight Time)
  })

  test('With after date (w/o timezone)', () => {
    const input = '2023-06-09T19:30:00.000Z' // Fri Jun 09 2023 19:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2024-10-07T17:13:49.000Z' // Mon Oct 07 2024 17:13:49 GMT+0000 (Coordinated Universal Time)
    const after = '2024-10-08T01:30:00.000Z' // Tue Oct 08 2024 12:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const output = parseDateAsToday(input, { after: new Date(after), now: new Date(now) })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z')) // Tue Oct 08 2024 19:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('With after date (UTC)', () => {
    const timezone = 'UTC'
    const input = '2023-06-09T19:30:00.000Z' // Fri Jun 09 2023 19:30:00 GMT+0000 (Coordinated Universal Time)
    const now = '2024-10-07T17:13:49.000Z' // Mon Oct 07 2024 17:13:49 GMT+0000 (Coordinated Universal Time)
    const after = '2024-10-08T01:30:00.000Z' // Tue Oct 08 2024 12:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const output = parseDateAsToday(input, { timezone, after: new Date(after), now: new Date(now) })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z')) // Tue Oct 08 2024 19:30:00 GMT+0000 (Coordinated Universal Time)
  })

  test('With after date (Europe/Berlin)', () => {
    const timezone = 'Europe/Berlin'
    const input = '2023-06-09T19:30:00.000Z' // Fri Jun 09 2023 21:30:00 GMT+0200 (Central European Summer Time)
    const now = '2024-10-07T17:13:49.000Z' // Mon Oct 07 2024 19:13:49 GMT+0200 (Central European Summer Time)
    const after = '2024-10-08T01:30:00.000Z' // Tue Oct 08 2024 03:30:00 GMT+0200 (Central European Summer Time)
    const output = parseDateAsToday(input, { timezone, after: new Date(after), now: new Date(now) })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z')) // Tue Oct 08 2024 21:30:00 GMT+0200 (Coordinated Universal Time)
  })

  test('With after date (America/Los_Angeles)', () => {
    const timezone = 'America/Los_Angeles'
    const input = '2023-06-09T19:30:00.000Z' // Fri Jun 09 2023 12:30:00 GMT-0700 (Pacific Daylight Time)
    const now = '2024-10-07T17:13:49.000Z' // Mon Oct 07 2024 10:13:49 GMT-0700 (Pacific Daylight Time)
    const after = '2024-10-08T01:30:00.000Z' // Mon Oct 07 2024 18:30:00 GMT-0700 (Pacific Daylight Time)
    const output = parseDateAsToday(input, { timezone, after: new Date(after), now: new Date(now) })
    expect(output).to.deep.equal(new Date('2024-10-08T19:30:00.000Z')) // Tue Oct 08 2024 12:30:00 GMT-0700 (Pacific Daylight Time)
  })

  test('With after date (Australia/Sydney)', () => {
    const timezone = 'Australia/Sydney'
    const input = '2023-06-09T19:30:00.000Z' // Sat Jun 10 2023 05:30:00 GMT+1000 (Australian Eastern Standard Time)
    const now = '2024-10-07T17:13:49.000Z' // Tue Oct 08 2024 04:13:49 GMT+1100 (Australian Eastern Daylight Time)
    const after = '2024-10-08T01:30:00.000Z' // Tue Oct 08 2024 12:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const output = parseDateAsToday(input, { timezone, after: new Date(after), now: new Date(now) })
    expect(output).to.deep.equal(new Date('2024-10-08T18:30:00.000Z')) // Wed Oct 09 2024 05:30:00 GMT+1100 (Australian Eastern Daylight Time)
  })
})
