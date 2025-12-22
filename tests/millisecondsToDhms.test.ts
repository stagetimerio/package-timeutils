import { expect } from 'chai'
import { millisecondsToDhms } from '../src/index'

describe('millisecondsToDhms', () => {
  test('millisecondsToDhms ceil = true', () => {
    expect(millisecondsToDhms(97323400)).to.deep.equal({
      negative: 0,
      days: 1,
      hours: 3,
      minutes: 2,
      seconds: 4,
      decimals: 4,
    })
    expect(millisecondsToDhms(3723400)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 1,
      minutes: 2,
      seconds: 4,
      decimals: 4,
    })
    expect(millisecondsToDhms(3600000)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 1,
      minutes: 0,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(60000)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(1500)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 2,
      decimals: 5,
    })
    expect(millisecondsToDhms(1000)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 0,
    })
    expect(millisecondsToDhms(500)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 5,
    })
    expect(millisecondsToDhms(0)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(-500)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      decimals: 5,
    })
    expect(millisecondsToDhms(-1000)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 0,
    })
    expect(millisecondsToDhms(-1500)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 5,
    })
    expect(millisecondsToDhms(-97323400)).to.deep.equal({
      negative: 1,
      days: 1,
      hours: 3,
      minutes: 2,
      seconds: 3,
      decimals: 4,
    })
  })

  test('millisecondsToDhms ceil = false', () => {
    const opt = { ceil: false }
    expect(millisecondsToDhms(97323400, opt)).to.deep.equal({
      negative: 0,
      days: 1,
      hours: 3,
      minutes: 2,
      seconds: 3,
      decimals: 4,
    })
    expect(millisecondsToDhms(3723400, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 1,
      minutes: 2,
      seconds: 3,
      decimals: 4,
    })
    expect(millisecondsToDhms(3600000, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 1,
      minutes: 0,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(60000, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(1500, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 5,
    })
    expect(millisecondsToDhms(1000, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 0,
    })
    expect(millisecondsToDhms(500, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      decimals: 5,
    })
    expect(millisecondsToDhms(0, opt)).to.deep.equal({
      negative: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      decimals: 0,
    })
    expect(millisecondsToDhms(-500, opt)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 5,
    })
    expect(millisecondsToDhms(-1000, opt)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      decimals: 0,
    })
    expect(millisecondsToDhms(-1500, opt)).to.deep.equal({
      negative: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 2,
      decimals: 5,
    })
    expect(millisecondsToDhms(-97323400, opt)).to.deep.equal({
      negative: 1,
      days: 1,
      hours: 3,
      minutes: 2,
      seconds: 4,
      decimals: 4,
    })
  })
})
