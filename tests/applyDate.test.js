import { expect } from 'chai'
import { applyDate } from '../index.js'

describe('applyDate', () => {
  test('Invalid data', () => {
    const now = new Date()
    expect(applyDate(true)).to.be.null
    expect(applyDate(false)).to.be.null
    expect(applyDate(null)).to.be.null
    expect(applyDate(undefined)).to.be.null
    expect(applyDate('a')).to.be.null
    expect(applyDate(now, true)).to.deep.equal(now)
    expect(applyDate(now, false)).to.deep.equal(now)
    expect(applyDate(now, null)).to.deep.equal(now)
    expect(applyDate(now, undefined)).to.deep.equal(now)
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

  test('Test from "Until Finish Time" bug', () => {
    const tz = 'Europe/Berlin'
    const today = new Date('2024-02-04T00:00:00.000Z')

    // Pre DST date
    expect(applyDate(new Date('2023-10-15T21:30:00.000Z'), today, tz)).to.deep.equal(new Date('2024-02-04T22:30:00.000Z'))

    // Post DST date
    expect(applyDate(new Date('2023-12-15T21:30:00.000Z'), today, tz)).to.deep.equal(new Date('2024-02-04T21:30:00.000Z'))
  })
})
