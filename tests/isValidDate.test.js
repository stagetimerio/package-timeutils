import { default as chai } from 'chai'
import { isValidDate } from '../index.js'
const { expect } = chai

describe('timeUtils.isValidDate', () => {
  test('isValidDate new Date()', () => {
    expect(isValidDate(new Date())).to.be.true
  })
  test('isValidDate new Date(\'invalid\')', () => {
    expect(isValidDate(new Date('invalid'))).to.be.false
  })
  test('isValidDate new Date(\'\')', () => {
    expect(isValidDate(new Date(''))).to.be.false
  })
  test('isValidDate null', () => {
    expect(isValidDate(null)).to.be.false
  })
  test('isValidDate undefined', () => {
    expect(isValidDate(undefined)).to.be.false
  })
})
