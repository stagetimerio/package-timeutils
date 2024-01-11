import { expect } from 'chai'
import { hmsToMilliseconds } from '../index.js'

describe('hmsToMilliseconds', () => {
  test('hmsToMilliseconds 0:00:00', () => {
    expect(hmsToMilliseconds({ hours: 0, minutes: 0, seconds: 0 })).to.equal(0)
  })
  test('hmsToMilliseconds 0:00:01', () => {
    expect(hmsToMilliseconds({ hours: 0, minutes: 0, seconds: 1 })).to.equal(1000)
  })
  test('hmsToMilliseconds 0:01:00', () => {
    expect(hmsToMilliseconds({ hours: 0, minutes: 1, seconds: 0 })).to.equal(60000)
  })
  test('hmsToMilliseconds 1:00:00', () => {
    expect(hmsToMilliseconds({ hours: 1, minutes: 0, seconds: 0 })).to.equal(3600000)
  })
  test('hmsToMilliseconds 1:02:03', () => {
    expect(hmsToMilliseconds({ hours: 1, minutes: 2, seconds: 3 })).to.equal(3723000)
  })
})
