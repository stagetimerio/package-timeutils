import { expect } from 'chai'
import { getTimezoneOffset } from '../src/index'

describe('getTimezoneOffset', () => {
  describe('America/Los_Angeles', () => {
    const timezone = 'America/Los_Angeles'

    it('get correct offset for 1:30 pre DST time', () => {
      const date = new Date('2023-11-05T07:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(-7 * 3600000)
    })

    it('get correct offset for 1:00 pre DST time', () => {
      const date = new Date('2023-11-05T08:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(-7 * 3600000)
    })

    it('get correct offset for 0:30 pre DST time', () => {
      const date = new Date('2023-11-05T08:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(-7 * 3600000)
    })

    it('get correct offset for 0:00 post DST time', () => {
      const date = new Date('2023-11-05T09:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(-8 * 3600000)
    })

    it('get correct offset for 0:30 post DST time', () => {
      const date = new Date('2023-11-05T09:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(-8 * 3600000)
    })
  })

  describe('Europe/Berlin', () => {
    const timezone = 'Europe/Berlin'

    it('get correct offset for 1:30 pre DST time', () => {
      const date = new Date('2023-03-25T23:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(1 * 3600000)
    })

    it('get correct offset for 1:00 pre DST time', () => {
      const date = new Date('2023-03-26T00:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(1 * 3600000)
    })

    it('get correct offset for 0:30 pre DST time', () => {
      const date = new Date('2023-03-26T00:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(1 * 3600000)
    })

    it('get correct offset for 0:00 post DST time', () => {
      const date = new Date('2023-03-26T01:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(2 * 3600000)
    })

    it('get correct offset for 0:30 post DST time', () => {
      const date = new Date('2023-03-26T01:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(2 * 3600000)
    })
  })

  describe('Australia/Sydney', () => {
    const timezone = 'Australia/Sydney'

    it('get correct offset for 1:30 pre DST time', () => {
      const date = new Date('2023-09-30T14:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(10 * 3600000)
    })

    it('get correct offset for 1:00 pre DST time', () => {
      const date = new Date('2023-09-30T15:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(10 * 3600000)
    })

    it('get correct offset for 0:30 pre DST time', () => {
      const date = new Date('2023-09-30T15:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(10 * 3600000)
    })

    it('get correct offset for 0:00 post DST time', () => {
      const date = new Date('2023-09-30T16:00:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(11 * 3600000)
    })

    it('get correct offset for 0:30 post DST time', () => {
      const date = new Date('2023-09-30T16:30:00.000Z')
      const offset = getTimezoneOffset(timezone, date)
      expect(offset).to.equal(11 * 3600000)
    })
  })

  describe('UTC and GMT', () => {
    it('get correct offset for UTC', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const offset = getTimezoneOffset('UTC', date)
      expect(offset).to.equal(0)
    })
    it('get correct offset for GMT', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const offset = getTimezoneOffset('GMT', date)
      expect(offset).to.equal(0)
    })
    it('get correct offset for Europe/London', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const offset = getTimezoneOffset('Europe/London', date)
      expect(offset).to.equal(0)
    })
  })

  describe('Error cases', () => {
    it('throws error for invalid date', () => {
      expect(() => getTimezoneOffset('UTC', 'not a date' as unknown as Date)).to.throw(
        '`date` must be a valid Date'
      )
    })

    it('throws error for invalid timezone', () => {
      expect(() =>
        getTimezoneOffset(undefined as unknown as string, new Date())
      ).to.throw('`timezone` must be provided')
    })

    it('throws error for non-existent timezone', () => {
      expect(() => getTimezoneOffset('Not/A/Timezone', new Date())).to.throw(
        'Invalid time zone specified: Not/A/Timezone'
      )
    })
  })
})
