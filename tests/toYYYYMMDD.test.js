import { expect } from 'chai'
import { toYYYYMMDD } from '../index.js'
import { format } from 'date-fns'

const at2AM = new Date('2020-01-05T02:00:00.000Z')
const at9PM = new Date('2020-01-05T21:00:00.000Z')

describe('toYYYYMMDD', () => {
  test('toYYYYMMDD, at2AM, asUTC=false', () => {
    expect(toYYYYMMDD(at2AM, { asUTC: false })).to.equal(format(at2AM, 'yyyy-MM-dd'))
  })
  test('toYYYYMMDD, at2AM, asUTC=true', () => {
    expect(toYYYYMMDD(at2AM, { asUTC: true })).to.equal('2020-01-05')
  })
  test('toYYYYMMDD, at9PM, asUTC=false', () => {
    expect(toYYYYMMDD(at9PM, { asUTC: false })).to.equal(format(at9PM, 'yyyy-MM-dd'))
  })
  test('toYYYYMMDD, at9PM, asUTC=true', () => {
    expect(toYYYYMMDD(at9PM, { asUTC: true })).to.equal('2020-01-05')
  })
})
