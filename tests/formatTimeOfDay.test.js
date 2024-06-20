import { expect } from 'chai'
import { formatTimeOfDay } from '../index.js'

describe('formatTimeOfDay', () => {
  it('should format time in 24h format with seconds always shown', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'always' })
    expect(formatted).to.equal('15:10:30')
  })

  it('should format time in 24h format with nonzero seconds shown', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'nonzero' })
    expect(formatted).to.equal('15:10:30')
  })

  it('should format time in 24h format with zero seconds hidden', () => {
    const date = new Date('2023-06-17T15:10:00Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'nonzero' })
    expect(formatted).to.equal('15:10')
  })

  it('should format time in 12h format with seconds always shown', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'always' })
    expect(formatted).to.equal('03:10:30 PM')
  })

  it('should format time in 12h format with nonzero seconds shown', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'nonzero' })
    expect(formatted).to.equal('03:10:30 PM')
  })

  it('should format time in 12h format with zero seconds hidden', () => {
    const date = new Date('2023-06-17T15:10:00Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'nonzero' })
    expect(formatted).to.equal('03:10 PM')
  })

  it('should format time in 24h format in Europe/Berlin timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'always', timezone: 'Europe/Berlin' })
    expect(formatted).to.equal('17:10:30')
  })

  it('should format time in 12h format in Europe/Berlin timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'always', timezone: 'Europe/Berlin' })
    expect(formatted).to.equal('05:10:30 PM')
  })

  it('should format time in 24h format in Australia/Sydney timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'always', timezone: 'Australia/Sydney' })
    expect(formatted).to.equal('01:10:30')
  })

  it('should format time in 12h format in Australia/Sydney timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'always', timezone: 'Australia/Sydney' })
    expect(formatted).to.equal('01:10:30 AM')
  })

  it('should format time in 24h format in America/Los_Angeles timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'always', timezone: 'America/Los_Angeles' })
    expect(formatted).to.equal('08:10:30')
  })

  it('should format time in 12h format in America/Los_Angeles timezone', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'always', timezone: 'America/Los_Angeles' })
    expect(formatted).to.equal('08:10:30 AM')
  })

  // Tests for `seconds = 'never'`
  it('should format time in 24h format without seconds', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '24h', seconds: 'never' })
    expect(formatted).to.equal('15:10')
  })

  it('should format time in 12h format without seconds', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date, { format: '12h', seconds: 'never' })
    expect(formatted).to.equal('03:10 PM')
  })

  // Tests for passing no options object
  it('should format time in default 24h format with seconds when no options are passed', () => {
    const date = new Date('2023-06-17T15:10:30Z')
    const formatted = formatTimeOfDay(date)
    expect(formatted).to.equal('15:10:30')
  })

  it('should format time in default 24h format with seconds when no options are passed and seconds are 00', () => {
    const date = new Date('2023-06-17T15:10:00Z')
    const formatted = formatTimeOfDay(date)
    expect(formatted).to.equal('15:10:00')
  })
})
