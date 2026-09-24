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

    // Mon Oct 02 2023 23:30:00 GMT+0200 (UTC)
    const today1 = getToday(tz, new Date('2023-10-02T23:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-02T00:00:00.000Z')

    // Tue Oct 03 2023 01:30:00 GMT+0000 (UTC)
    const today2 = getToday(tz, new Date('2023-10-03T01:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-03T00:00:00.000Z')

    // Tue Apr 16 2024 15:01:22 GMT+0000 (UTC)
    const today3 = getToday(tz, new Date('2024-04-16T15:01:22.871Z'))
    expect(today3.toISOString()).to.equal('2024-04-16T00:00:00.000Z')
  })

  test('Europe/Berlin', () => {
    const tz = 'Europe/Berlin'

    // Mon Oct 02 2023 23:30:00 GMT+0200 (Central European Summer Time)
    const today1 = getToday(tz, new Date('2023-10-02T21:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-01T22:00:00.000Z')

    // Tue Oct 03 2023 01:30:00 GMT+0200 (Central European Summer Time)
    const today2 = getToday(tz, new Date('2023-10-02T23:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-02T22:00:00.000Z')
  })

  test('America/Los_Angeles', () => {
    const tz = 'America/Los_Angeles'

    // Mon Oct 02 2023 23:30:00 GMT-0700 (Pacific Daylight Time)
    const today1 = getToday(tz, new Date('2023-10-03T06:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-02T07:00:00.000Z')

    // Tue Oct 03 2023 01:30:00 GMT-0700 (Pacific Daylight Time)
    const today2 = getToday(tz, new Date('2023-10-03T08:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-03T07:00:00.000Z')
  })

  test('Australia/Sydney', () => {
    const tz = 'Australia/Sydney'

    // Mon Oct 02 2023 23:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const today1 = getToday(tz, new Date('2023-10-02T12:30:00.000Z'))
    expect(today1.toISOString()).to.equal('2023-10-01T13:00:00.000Z')

    // Tue Oct 03 2023 01:30:00 GMT+1100 (Australian Eastern Daylight Time)
    const today2 = getToday(tz, new Date('2023-10-02T14:30:00.000Z'))
    expect(today2.toISOString()).to.equal('2023-10-02T13:00:00.000Z')

    // Sun May 12 2024 08:00:00 GMT+1000 (Australian Eastern Standard Time)
    const today3 = getToday(tz, new Date('2024-05-11T22:00:00.000Z'))
    expect(today3.toISOString()).to.equal('2024-05-11T14:00:00.000Z')
  })
  test('Bug: Wrong date on DST day because change is at 3AM, 2025-03-30', () => {
    const tz = 'Europe/Berlin'

    // The day before DST
    const today1 = getToday(tz, new Date('2025-03-29T17:43:50.000Z')) // Sat Mar 29 2025 18:43:50 GMT+0100 (Central European Standard Time)
    expect(today1.toISOString()).to.equal('2025-03-28T23:00:00.000Z') // Sat Mar 29 2025 00:00:00 GMT+0100 (Central European Standard Time)

    // The day of DST (DST change is 3am)
    const today2 = getToday(tz, new Date('2025-03-30T17:43:50.000Z')) // Sun Mar 30 2025 19:43:50 GMT+0200 (Central European Summer Time)
    expect(today2.toISOString()).to.equal('2025-03-29T23:00:00.000Z') // Sun Mar 30 2025 00:00:00 GMT+0100 (Central European Standard Time)

    // The day after DST
    const today3 = getToday(tz, new Date('2025-03-31T17:43:50.000Z')) // Mon Mar 31 2025 19:43:50 GMT+0200 (Central European Summer Time)
    expect(today3.toISOString()).to.equal('2025-03-30T22:00:00.000Z') // Mon Mar 31 2025 00:00:00 GMT+0200 (Central European Summer Time)
  })

  test('Bug: Wrong date on DST day in zones far east of UTC, 2026-09-27', () => {
    const today1 = getToday('Pacific/Auckland', new Date('2026-09-27T06:50:42.000Z')) // Sun Sep 27 2026 19:50:42 GMT+1300 (NZDT)
    expect(today1.toISOString()).to.equal('2026-09-26T12:00:00.000Z') // Sun Sep 27 2026 00:00:00 GMT+1200 (NZST)

    const today2 = getToday('Pacific/Chatham', new Date('2026-09-27T06:50:42.000Z')) // Sun Sep 27 2026 20:35:42 GMT+1345
    expect(today2.toISOString()).to.equal('2026-09-26T11:15:00.000Z') // Sun Sep 27 2026 00:00:00 GMT+1245

    const today3 = getToday('Australia/Sydney', new Date('2026-10-04T06:00:00.000Z')) // Sun Oct 04 2026 17:00:00 GMT+1100 (AEDT)
    expect(today3.toISOString()).to.equal('2026-10-03T14:00:00.000Z') // Sun Oct 04 2026 00:00:00 GMT+1000 (AEST)
  })
})
