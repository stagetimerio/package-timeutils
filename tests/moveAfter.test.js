import { expect } from 'chai'
import { moveAfter } from '../index.js'

describe('moveAfter', () => {
  it('should throw an error if input is not a Date object', () => {
    expect(() => moveAfter('not a date', new Date())).to.throw()
    expect(() => moveAfter(new Date(), 'not a date')).to.throw()
  })

  it('should return the same time when it is already after the "after" date', () => {
    const time = new Date('2023-05-15T10:00:00Z')
    const after = new Date('2023-05-15T09:00:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(time)
  })

  it('should move the time to the same day when possible', () => {
    const time = new Date('2023-05-13T11:00:00Z')
    const after = new Date('2023-05-15T09:00:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2023-05-15T11:00:00Z'))
  })

  it('should move the time to the next day when necessary', () => {
    const time = new Date('2023-05-15T23:00:00Z')
    const after = new Date('2023-05-15T23:30:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2023-05-16T23:00:00Z'))
  })

  it('should handle dates across month boundaries', () => {
    const time = new Date('2023-05-31T22:00:00Z')
    const after = new Date('2023-05-31T23:00:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2023-06-01T22:00:00Z'))
  })

  it('should handle dates across year boundaries', () => {
    const time = new Date('2023-12-31T23:00:00Z')
    const after = new Date('2023-12-31T23:30:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2024-01-01T23:00:00Z'))
  })

  it('should handle leap years correctly', () => {
    const time = new Date('2024-02-28T23:00:00Z')
    const after = new Date('2024-02-28T23:30:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2024-02-29T23:00:00Z'))
  })

  it('should work correctly with different timezones America/New_York', () => {
    const timezone = 'America/New_York'
    const time = new Date('2023-05-14T06:00:00Z')
    const after = new Date('2023-05-15T04:00:00Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-05-15T06:00:00Z'))
  })

  it('should handle daylight saving time transitions America/New_York', () => {
    const timezone = 'America/New_York'
    // DST transition in New York (March 12, 2023, 2:00 AM clocks are turned forward 1 hour)
    const time = new Date('2023-03-11T09:30:00.000Z') // Sat Mar 11 2023 04:30:00 GMT-0500 (Eastern Standard Time)
    const after = new Date('2023-03-12T07:00:00.000Z') // Sun Mar 12 2023 03:00:00 GMT-0400 (Eastern Daylight Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-12T08:30:00.000Z')) // Sun Mar 12 2023 04:30:00 GMT-0400 (Eastern Daylight Time)
  })

  it('should handle cases where "after" is many days later', () => {
    const time = new Date('2023-05-15T10:00:00Z')
    const after = new Date('2023-05-20T09:00:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2023-05-20T10:00:00Z'))
  })

  it('should handle DST transition in Europe/Berlin (Spring Forward)', () => {
    const timezone = 'Europe/Berlin'
    // DST begins on March 26, 2023
    const time = new Date('2023-03-25T19:30:00Z') // Sat Mar 25 2023 20:30:00 GMT+0100 (Central European Standard Time)
    const after = new Date('2023-03-26T03:00:00Z') // Sun Mar 26 2023 05:00:00 GMT+0200 (Central European Summer Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-26T18:30:00Z')) // Sun Mar 26 2023 20:30:00 GMT+0200 (Central European Summer Time)
  })

  it('should handle DST transition in Europe/Berlin (Fall Back)', () => {
    const timezone = 'Europe/Berlin'
    // DST ends on October 29, 2023, at 3:00 AM in Berlin
    const time = new Date('2023-10-29T00:30:00.000Z') // Sun Oct 29 2023 02:30:00 GMT+0200 (Central European Summer Time)
    const after = new Date('2023-10-29T03:00:00.000Z') // Sun Oct 29 2023 04:00:00 GMT+0100 (Central European Standard Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-30T01:30:00.000Z')) // Mon Oct 30 2023 02:30:00 GMT+0100 (Central European Standard Time)
  })

  it('should handle DST transition in Australia/Sydney (Spring Forward)', () => {
    const timezone = 'Australia/Sydney'
    // DST begins on October 1, 2023, at 2:00 AM in Sydney
    const time = new Date('2023-09-30T14:30:00Z') // Sun Oct 01 2023 00:30:00 GMT+1000 (Australian Eastern Standard Time)
    const after = new Date('2023-09-30T17:00:00Z') // Sun Oct 01 2023 04:00:00 GMT+1100 (Australian Eastern Daylight Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-01T13:30:00Z')) // Mon Oct 02 2023 00:30:00 GMT+1100 (Australian Eastern Daylight Time)
  })

  it('should handle DST transition in Australia/Sydney (Fall Back)', () => {
    const timezone = 'Australia/Sydney'
    // DST ends on April 2, 2023, at 3:00 AM in Sydney
    const time = new Date('2023-04-01T14:30:00.000Z') // Sun Apr 02 2023 01:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const after = new Date('2023-04-01T17:00:00.000Z') // Sun Apr 02 2023 03:00:00 GMT+1000 (Australian Eastern Standard Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-04-02T15:30:00.000Z')) // Mon Apr 03 2023 01:30:00 GMT+1000 (Australian Eastern Standard Time)
  })

  it('should preserve time when moving across multiple days in Europe/Berlin', () => {
    const timezone = 'Europe/Berlin'
    const time = new Date('2023-03-24T22:45:30Z') // 23:45:30 local time
    const after = new Date('2023-03-27T10:00:00Z') // 12:00:00 local time (after DST change)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-27T21:45:30Z'))
    // 23:45:30 local time, which is 21:45:30 UTC due to DST
  })

  it('should preserve time when moving across multiple days in Australia/Sydney', () => {
    const timezone = 'Australia/Sydney'
    const time = new Date('2023-09-29T13:15:45.000Z') // Fri Sep 29 2023 23:15:45 GMT+1000 (Australian Eastern Standard Time)
    const after = new Date('2023-10-02T20:00:00.000Z') // Tue Oct 03 2023 07:00:00 GMT+1100 (Australian Eastern Daylight Time)
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-03T12:15:45.000Z')) // Tue Oct 03 2023 23:15:45 GMT+1100 (Australian Eastern Daylight Time)
  })
})
