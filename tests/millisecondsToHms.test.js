import { default as chai } from 'chai'
import { millisecondsToHms } from '../index.js'
const { expect } = chai

describe('millisecondsToHms', () => {
  test('0 milliseconds', () => {
    expect(millisecondsToHms(0)).to.deep.equal({ hours: 0, minutes: 0, seconds: 0, decimals: 0 })
  })
  test('100 milliseconds', () => {
    expect(millisecondsToHms(100)).to.deep.equal({ hours: 0, minutes: 0, seconds: 0, decimals: 1 })
  })
  test('1000 milliseconds', () => {
    expect(millisecondsToHms(1000)).to.deep.equal({ hours: 0, minutes: 0, seconds: 1, decimals: 0 })
  })
  test('60000 milliseconds', () => {
    expect(millisecondsToHms(60000)).to.deep.equal({ hours: 0, minutes: 1, seconds: 0, decimals: 0 })
  })
  test('3600000 milliseconds', () => {
    expect(millisecondsToHms(3600000)).to.deep.equal({ hours: 1, minutes: 0, seconds: 0, decimals: 0 })
  })
  test('3723400 milliseconds', () => {
    expect(millisecondsToHms(3723400)).to.deep.equal({ hours: 1, minutes: 2, seconds: 3, decimals: 4 })
  })
})
