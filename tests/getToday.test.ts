import { expect } from 'chai'
import { getToday } from '../src/index'

describe('applyDate', () => {
  test('no and invalid arguments', () => {
    expect(getToday()).to.be.an.instanceof(Date)
    expect(getToday('a')).to.be.an.instanceof(Date)
    expect(getToday('UTC')).to.be.an.instanceof(Date)
    expect(() => getToday('UTC', true as unknown as Date)).to.throw()
    expect(() => getToday('UTC', null as unknown as Date)).to.throw()
    expect(() => getToday('UTC', '2023-12-16T12:44:43.252Z' as unknown as Date)).to.throw()
  })

  test('default timezone', () => {
    const today = getToday(undefined, new Date('2023-12-16T12:44:43.252Z'))
    expect(today.toISOString()).to.equal('2023-12-16T00:00:00.000Z')
  })

  test('UTC', () => {
    const tz = 'UTC'

    const today1 = getToday(tz, new Date('2023-10-02T23:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-02T00:00:00.000Z')

    const today2 = getToday(tz, new Date('2023-10-03T01:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-03T00:00:00.000Z')

    const today3 = getToday(tz, new Date('2024-04-16T15:01:22.871Z'))
    expect(today3.toISOString()).to.equal('2024-04-16T00:00:00.000Z')
  })

  test('Europe/Berlin', () => {
    const tz = 'Europe/Berlin'

    const today1 = getToday(tz, new Date('2023-10-02T21:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-01T22:00:00.000Z')

    const today2 = getToday(tz, new Date('2023-10-02T23:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-02T22:00:00.000Z')
  })

  test('America/Los_Angeles', () => {
    const tz = 'America/Los_Angeles'

    const today1 = getToday(tz, new Date('2023-10-03T06:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-02T07:00:00.000Z')

    const today2 = getToday(tz, new Date('2023-10-03T08:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-03T07:00:00.000Z')
  })

  test('Australia/Sydney', () => {
    const tz = 'Australia/Sydney'

    const today1 = getToday(tz, new Date('2023-10-02T12:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-01T13:00:00.000Z')

    const today2 = getToday(tz, new Date('2023-10-02T14:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-02T13:00:00.000Z')

    const today3 = getToday(tz, new Date('2024-05-11T22:00:00.000Z'))
    expect(today3.toISOString()).to.equal('2024-05-11T14:00:00.000Z')
  })
  test('Bug: Wrong date on DST day because change is at 3AM, 2025-03-30', () => {
    const tz = 'Europe/Berlin'

    const today1 = getToday(tz, new Date('2025-03-29T17:43:50.000Z'))
    expect(today1.toISOString()).to.equal('2025-03-28T23:00:00.000Z')

    const today2 = getToday(tz, new Date('2025-03-30T17:43:50.000Z'))
    expect(today2.toISOString()).to.equal('2025-03-29T23:00:00.000Z')

    const today3 = getToday(tz, new Date('2025-03-31T17:43:50.000Z'))
    expect(today3.toISOString()).to.equal('2025-03-30T22:00:00.000Z')
  })
})
