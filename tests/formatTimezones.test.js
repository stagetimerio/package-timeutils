import { expect } from 'chai'
import { formatTimezone } from '../index.js'

describe('formatTimezone', () => {
  it('should format timezone to city format (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', 'city')
    expect(result).to.be.a('string')
    expect(result).to.equal('America / Los Angeles')
  })

  it('should format timezone to long format (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', 'long')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Pacific Standard Time', 'Pacific Daylight Time'])
  })

  it('should format timezone to abbreviation format (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', 'abbr')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['PST', 'PDT'])
  })

  it('should use fallback format if primary is not available (LA)', () => {
    const result = formatTimezone('America/Los_Angeles', ['abbr', 'long'])
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['PST', 'PDT'])
  })

  it('should format timezone to city format (BER)', () => {
    const result = formatTimezone('Europe/Berlin', 'city')
    expect(result).to.be.a('string')
    expect(result).to.equal('Europe / Berlin')
  })

  it('should format timezone to long format (BER)', () => {
    const result = formatTimezone('Europe/Berlin', 'long')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Central European Standard Time', 'Central European Summer Time'])
  })

  it('should format timezone to abbreviation format (BER)', () => {
    const result = formatTimezone('Europe/Berlin', 'abbr')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['CET', 'CEST'])
  })

  it('should use fallback format if primary is not available (BER)', () => {
    const result = formatTimezone('Europe/Berlin', ['abbr', 'long'])
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['CET', 'CEST'])
  })

  it('should format timezone to city format (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', 'city')
    expect(result).to.be.a('string')
    expect(result).to.equal('Australia / Sydney')
  })

  it('should format timezone to long format (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', 'long')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['Australian Eastern Standard Time', 'Australian Eastern Daylight Time'])
  })

  it('should format timezone to abbreviation format (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', 'abbr')
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['AEST', 'AEDT'])
  })

  it('should use fallback format if primary is not available (SYD)', () => {
    const result = formatTimezone('Australia/Sydney', ['abbr', 'long'])
    expect(result).to.be.a('string')
    expect(result).to.be.oneOf(['AEST', 'AEDT'])
  })

  it('should format timezone to long format (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', 'long')
    expect(result).to.be.a('string')
    expect(result).to.equal('Mexican Pacific Standard Time')
  })

  it('should format timezone to abbreviation format (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', 'abbr')
    expect(result).to.be.a('string')
    expect(result).to.equal('')
  })

  it('should use fallback format if primary is not available (Mazatlan)', () => {
    const result = formatTimezone('America/Mazatlan', ['abbr', 'long'])
    expect(result).to.be.a('string')
    expect(result).to.equal('Mexican Pacific Standard Time')
  })

  it('should format timezone to city format (Ushuaia)', () => {
    const result = formatTimezone('America/Argentina/Ushuaia', 'city')
    expect(result).to.be.a('string')
    expect(result).to.equal('America / Ushuaia')
  })

  it('should format timezone to city format (Louisville)', () => {
    const result = formatTimezone('America/Kentucky/Louisville', 'city')
    expect(result).to.be.a('string')
    expect(result).to.equal('America / Louisville')
  })

  it('should format timezone to offset format', () => {
    const result = formatTimezone('America/Los_Angeles', 'offset')
    expect(result).to.be.a('string')
    expect(result).to.match(/GMT[+-]\d{2}:\d{2}/) // This regex checks for the GMT offset format
  })

  it('should throw an error for invalid format option', () => {
    expect(() => formatTimezone('America/Los_Angeles', 'invalid')).to.throw()
  })
})
