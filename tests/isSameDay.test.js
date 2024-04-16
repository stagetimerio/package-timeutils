import { expect } from 'chai'
import { isSameDay } from '../index.js'

describe('isSameDay', () => {
  test('should return true for the same day in Berlin timezone', () => {
    const date1 = new Date('2024-04-10T22:00:00Z') // 10th April 2024, 00:00 Berlin time
    const date2 = new Date('2024-04-10T23:00:00Z') // 11th April 2024, 01:00 Berlin time
    expect(isSameDay(date1, date2, 'Europe/Berlin')).to.be.true
  })

  test('should return false for different days in Berlin timezone', () => {
    const date1 = new Date('2024-04-10T22:00:00Z') // 10th April 2024, 00:00 Berlin time
    const date2 = new Date('2024-04-11T22:00:00Z') // 12th April 2024, 00:00 Berlin time
    expect(isSameDay(date1, date2, 'Europe/Berlin')).to.be.false
  })

  test('should return true for the same day in Los Angeles timezone', () => {
    const date1 = new Date('2024-04-10T07:00:00Z') // 10th April 2024, 00:00 Los Angeles time
    const date2 = new Date('2024-04-10T15:00:00Z') // 10th April 2024, 08:00 Los Angeles time
    expect(isSameDay(date1, date2, 'America/Los_Angeles')).to.be.true
  })

  test('should return false for different days in Los Angeles timezone', () => {
    const date1 = new Date('2024-04-10T07:00:00Z') // 10th April 2024, 00:00 Los Angeles time
    const date2 = new Date('2024-04-11T07:00:00Z') // 11th April 2024, 00:00 Los Angeles time
    expect(isSameDay(date1, date2, 'America/Los_Angeles')).to.be.false
  })

  test('should return true for the same day in Sydney timezone', () => {
    const date1 = new Date('2024-04-10T14:00:00Z') // 11th April 2024, 00:00 Sydney time
    const date2 = new Date('2024-04-10T20:00:00Z') // 11th April 2024, 06:00 Sydney time
    expect(isSameDay(date1, date2, 'Australia/Sydney')).to.be.true
  })

  test('should return false for different days in Sydney timezone', () => {
    const date1 = new Date('2024-04-10T14:00:00Z') // 11th April 2024, 00:00 Sydney time
    const date2 = new Date('2024-04-11T14:00:00Z') // 12th April 2024, 00:00 Sydney time
    expect(isSameDay(date1, date2, 'Australia/Sydney')).to.be.false
  })

  test('should return true for the same day in UTC', () => {
    const date1 = new Date('2024-04-10T00:00:00Z')
    const date2 = new Date('2024-04-10T23:59:59Z')
    expect(isSameDay(date1, date2, 'UTC')).to.be.true
  })

  test('should return false for different days in UTC', () => {
    const date1 = new Date('2024-04-10T00:00:00Z')
    const date2 = new Date('2024-04-11T00:00:00Z')
    expect(isSameDay(date1, date2, 'UTC')).to.be.false
  })

  test('AUS Date Picker bug', () => {
    const date1 = new Date('2024-04-16T14:30:00.000Z')
    const date2 = new Date('2024-04-16T00:00:00.000Z')
    expect(isSameDay(date1, date2, 'UTC')).to.be.true
  })
})
