import { expect } from 'chai'
import { moveAfter } from '../src/index'

describe('moveAfter', () => {
  it('should throw an error if input is not a Date object', () => {
    expect(() => moveAfter('not a date' as unknown as Date, new Date())).to.throw()
    expect(() => moveAfter(new Date(), 'not a date' as unknown as Date)).to.throw()
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
    const time = new Date('2023-03-11T09:30:00.000Z')
    const after = new Date('2023-03-12T07:00:00.000Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-12T08:30:00.000Z'))
  })

  it('should handle cases where "after" is many days later', () => {
    const time = new Date('2023-05-15T10:00:00Z')
    const after = new Date('2023-05-20T09:00:00Z')
    const result = moveAfter(time, after)
    expect(result).to.deep.equal(new Date('2023-05-20T10:00:00Z'))
  })

  it('should handle DST transition in Europe/Berlin (Spring Forward)', () => {
    const timezone = 'Europe/Berlin'
    const time = new Date('2023-03-25T19:30:00Z')
    const after = new Date('2023-03-26T03:00:00Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-26T18:30:00Z'))
  })

  it('should handle DST transition in Europe/Berlin (Fall Back)', () => {
    const timezone = 'Europe/Berlin'
    const time = new Date('2023-10-29T00:30:00.000Z')
    const after = new Date('2023-10-29T03:00:00.000Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-30T01:30:00.000Z'))
  })

  it('should handle DST transition in Australia/Sydney (Spring Forward)', () => {
    const timezone = 'Australia/Sydney'
    const time = new Date('2023-09-30T14:30:00Z')
    const after = new Date('2023-09-30T17:00:00Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-01T13:30:00Z'))
  })

  it('should handle DST transition in Australia/Sydney (Fall Back)', () => {
    const timezone = 'Australia/Sydney'
    const time = new Date('2023-04-01T14:30:00.000Z')
    const after = new Date('2023-04-01T17:00:00.000Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-04-02T15:30:00.000Z'))
  })

  it('should preserve time when moving across multiple days in Europe/Berlin', () => {
    const timezone = 'Europe/Berlin'
    const time = new Date('2023-03-24T22:45:30Z')
    const after = new Date('2023-03-27T10:00:00Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-03-27T21:45:30Z'))
  })

  it('should preserve time when moving across multiple days in Australia/Sydney', () => {
    const timezone = 'Australia/Sydney'
    const time = new Date('2023-09-29T13:15:45.000Z')
    const after = new Date('2023-10-02T20:00:00.000Z')
    const result = moveAfter(time, after, { timezone })
    expect(result).to.deep.equal(new Date('2023-10-03T12:15:45.000Z'))
  })
})
