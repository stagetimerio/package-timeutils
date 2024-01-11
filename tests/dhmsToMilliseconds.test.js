import { expect } from 'chai'
import { dhmsToMilliseconds } from '../index.js'

describe('millisecondsToHms', () => {
  test('dhmsToMilliseconds ceil = true', () => {
    expect(dhmsToMilliseconds({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4 })).to.deep.equal(97323400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 4, decimals: 4 })).to.deep.equal(3723400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0 })).to.deep.equal(3600000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0 })).to.deep.equal(60000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5 })).to.deep.equal(1500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })).to.deep.equal(1000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })).to.deep.equal(500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0 })).to.deep.equal(0)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5 })).to.deep.equal(-500)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0 })).to.deep.equal(-1000)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5 })).to.deep.equal(-1500)
    expect(dhmsToMilliseconds({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4 })).to.deep.equal(-97323400)
  })

  test('dhmsToMilliseconds ceil = false', () => {
    const ceil = false
    expect(dhmsToMilliseconds({ negative: 0, days: 1, hours: 3, minutes: 2, seconds: 3, decimals: 4, ceil })).to.deep.equal(97323400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 2, seconds: 3, decimals: 4, ceil })).to.deep.equal(3723400)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 1, minutes: 0, seconds: 0, decimals: 0, ceil })).to.deep.equal(3600000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 1, seconds: 0, decimals: 0, ceil })).to.deep.equal(60000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5, ceil })).to.deep.equal(1500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0, ceil })).to.deep.equal(1000)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 5, ceil })).to.deep.equal(500)
    expect(dhmsToMilliseconds({ negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0, ceil })).to.deep.equal(0)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 5, ceil })).to.deep.equal(-500)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 1, decimals: 0, ceil })).to.deep.equal(-1000)
    expect(dhmsToMilliseconds({ negative: 1, days: 0, hours: 0, minutes: 0, seconds: 2, decimals: 5, ceil })).to.deep.equal(-1500)
    expect(dhmsToMilliseconds({ negative: 1, days: 1, hours: 3, minutes: 2, seconds: 4, decimals: 4, ceil })).to.deep.equal(-97323400)
  })
})
