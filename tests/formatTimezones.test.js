import { expect } from 'chai'
import { formatTimezone } from '../index.js'

describe('formatTimezone', () => {
  it('should format timezone to long format (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', { format: 'long' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Pacific Standard Time', 'Pacific Daylight Time'])
  })

  it('should format timezone to abbreviation format (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', { format: 'abbr' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['PST', 'PDT'])
  })

  it('should use fallback format if primary is not available (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', { format: ['abbr', 'long'] })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['PST', 'PDT'])
  })

  it('should format timezone to long format (BER)', () => {
    const result = formatTimezone('Europe/Berlin', { format: 'long' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Central European Standard Time', 'Central European Summer Time'])
  })

  it('should format timezone to abbreviation format (BER)', () => {
    const result = formatTimezone('Europe/Berlin', { format: 'abbr' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['CET', 'CEST'])
  })

  it('should use fallback format if primary is not available (BER)', () => {
    const result = formatTimezone('Europe/Berlin', { format: ['abbr', 'long'] })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['CET', 'CEST'])
  })

  it('should format timezone to long format (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', { format: 'long' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Australian Eastern Standard Time', 'Australian Eastern Daylight Time'])
  })

  it('should format timezone to abbreviation format (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', { format: 'abbr' })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['AEST', 'AEDT'])
  })

  it('should use fallback format if primary is not available (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', { format: ['abbr', 'long'] })
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['AEST', 'AEDT'])
  })

  it('should format timezone to long format (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', { format: 'long' })
    expect(result).to.be.a('string')
    expect(result).to.equal('Mexican Pacific Standard Time')
  })

  it('should format timezone to abbreviation format (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', { format: 'abbr' })
    expect(result).to.be.a('string')
    expect(result).to.equal('')
  })

  it('should use fallback format if primary is not available (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', { format: ['abbr', 'long'] })
    expect(result).to.be.a('string')
    expect(result).to.equal('Mexican Pacific Standard Time')
  })

  it('should format timezone to offset format', () => {
    const result = formatTimezone('America/Los_Angeles', { format: 'offset' })
    expect(result).to.be.a('string')
    expect(result).to.match(/GMT[+-]\d{2}:\d{2}/) // This regex checks for the GMT offset format
  })

  it('should throw an error for invalid format option', () => {
    expect(() => formatTimezone('America/Los_Angeles', { format: 'invalid' })).to.throw()
  })
})
