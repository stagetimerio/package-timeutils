import { getTomorrow } from '../src/index'

describe('getTomorrow', () => {
  const testCases: [string, Date, Date][] = [
    ['UTC', new Date('2024-04-10T09:00:00Z'), new Date('2024-04-11T00:00:00Z')],
    ['Europe/Berlin', new Date('2024-04-10T09:00:00Z'), new Date('2024-04-10T22:00:00Z')], // Considering time difference of +02:00 in April for Berlin
    ['America/Los_Angeles', new Date('2024-04-10T09:00:00Z'), new Date('2024-04-11T07:00:00Z')], // Considering time difference of -07:00 in April for Los Angeles
    ['Australia/Sydney', new Date('2024-04-10T09:00:00Z'), new Date('2024-04-10T14:00:00Z')], // Considering time difference of +10:00 in April for Sydney
  ]

  testCases.forEach(([timezone, now, expected]) => {
    test(`should return 0:00 tomorrow for timezone ${timezone}`, () => {
      const result = getTomorrow(timezone, now)
      expect(result).toEqual(expected)
    })
  })

  test('should default to UTC if no timezone is provided', () => {
    const now = new Date('2024-04-10T00:00:00Z') // UTC time
    const expected = new Date('2024-04-11T00:00:00Z') // Expected UTC time for tomorrow
    const result = getTomorrow(undefined, now)
    expect(result).toEqual(expected)
  })

  test('should handle leap year correctly', () => {
    const timezone = 'UTC'
    const now = new Date('2024-02-28T00:00:00Z') // Leap year
    const expected = new Date('2024-02-29T00:00:00Z') // Expected UTC time for tomorrow in a leap year
    const result = getTomorrow(timezone, now)
    expect(result).toEqual(expected)
  })

  test('should roll over to the next month correctly', () => {
    const timezone = 'UTC'
    const now = new Date('2024-01-31T00:00:00Z') // Last day of January
    const expected = new Date('2024-02-01T00:00:00Z') // First day of February
    const result = getTomorrow(timezone, now)
    expect(result).toEqual(expected)
  })

  test('should roll over to the next year correctly', () => {
    const timezone = 'UTC'
    const now = new Date('2024-12-31T00:00:00Z') // Last day of the year
    const expected = new Date('2025-01-01T00:00:00Z') // First day of the next year
    const result = getTomorrow(timezone, now)
    expect(result).toEqual(expected)
  })
})
