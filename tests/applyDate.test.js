import { default as chai } from 'chai'
import { applyDate } from '../index.js'
import { addMinutes } from 'date-fns'
const { expect } = chai

describe('timeUtils.applyDate', () => {
  test('Invalid data', () => {
    expect(applyDate(true)).to.be.null
    expect(applyDate(false)).to.be.null
    expect(applyDate(null)).to.be.null
    expect(applyDate(undefined)).to.be.null
    expect(applyDate('a')).to.be.null
  })

  test('US DST change March 12', () => {
    // From:  Sun Mar 12 2023 02:00:00 GMT-0800 (Pacific Standard Time) => '2023-03-12T10:00:00.000Z'
    // To:    Sun Mar 12 2023 03:00:00 GMT-0700 (Pacific Daylight Time) => '2023-03-12T10:00:00.000Z'
    let inTime, inDate, output

    // Time before and date after DST
    inTime = new Date('2023-03-11T07:10:00.000-08:00') // Sat Mar 11 2023 07:10:00 GMT-0800 (Pacific Standard Time)
    inDate = new Date('2023-03-13T20:33:33.000-07:00') // Mon Mar 13 2023 20:33:33 GMT-0700 (Pacific Daylight Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 07:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 13 2023

    // Time and date inside DST
    inTime = new Date('2023-03-14T15:10:00.000-07:00') // Tue Mar 14 2023 15:10:00 GMT-0700 (Pacific Daylight Time)
    inDate = new Date('2023-03-18T03:33:33.000-07:00') // Sat Mar 18 2023 03:33:33 GMT-0700 (Pacific Daylight Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 15:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 18 2023

    // Time after and date before DST
    inTime = new Date('2023-03-14T08:10:00.000-07:00') // Tue Mar 14 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
    inDate = new Date('2023-03-11T19:33:33.000-08:00') // Sat Mar 11 2023 19:33:33 GMT-0800 (Pacific Standard Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 08:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 11 2023
  })

  test('US DST change Nov 5', () => {
    // From:  Sun Nov 5 2023 02:00:00 GMT-0700 (Pacific Daylight Time) => '2023-11-05T09:00:00.000Z'
    // To:    Sun Nov 5 2023 01:00:00 GMT-0800 (Pacific Standard Time) => '2023-11-05T09:00:00.000Z'
    let inTime, inDate, output

    // Time before and date after DST change
    inTime = new Date('2023-11-03T15:10:00.000Z') // Fri Nov 03 2023 08:10:00 GMT-0700 (Pacific Daylight Time)
    inDate = new Date('2023-11-07T03:33:33.000Z') // Mon Nov 06 2023 19:33:33 GMT-0800 (Pacific Standard Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 07:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 13 2023

    // Time and date inside DST
    inTime = new Date('2023-11-07T15:10:00.000Z') // Tue Nov 07 2023 07:10:00 GMT-0800 (Pacific Standard Time)
    inDate = new Date('2023-11-07T03:33:33.000Z') // Mon Nov 06 2023 19:33:33 GMT-0800 (Pacific Standard Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 07:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 13 2023

    // Time after and date before DST
    inTime = new Date('2023-11-07T15:10:00.000Z') // Tue Nov 07 2023 07:10:00 GMT-0800 (Pacific Standard Time)
    inDate = new Date('2023-11-03T03:33:33.000Z') // Thu Nov 02 2023 20:33:33 GMT-0700 (Pacific Daylight Time)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 07:10:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 13 2023
  })

  test('DE DST change March 26', () => {
    // From:  Sun Mar 26 2023 02:00:00 GMT+0100 (Mitteleuropäische Normalzeit) => '2023-03-26T01:00:00.000Z'
    // To:    Sun Mar 26 2023 03:00:00 GMT+0200 (Mitteleuropäische Sommerzeit) => '2023-03-26T01:00:00.000Z'
    let inTime, inDate, output

    // Time before and date after DST change
    inTime = new Date('2023-03-25T01:43:00.000+01:00') // Sat Mar 25 2023 01:43:00 GMT+0100 (Mitteleuropäische Normalzeit)
    inDate = new Date('2023-03-27T23:10:00.000+02:00') // Mon Mar 27 2023 23:10:00 GMT+0200 (Mitteleuropäische Sommerzeit)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 01:43:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Mar 27 2023
  })

  test('DE DST change Oct 29', () => {
    // From:  Sun Oct 29 2023 03:00:00 GMT+0200 (Mitteleuropäische Sommerzeit) => '2023-10-29T01:00:00.000Z'
    // To:    Sun Oct 29 2023 02:00:00 GMT+0100 (Mitteleuropäische Normalzeit) => '2023-10-29T01:00:00.000Z'
    let inTime, inDate, output

    // Time before and date after DST change
    inTime = new Date('2023-10-29T02:53:00.000+02:00') // Sun Oct 29 2023 02:53:00 GMT+0200 (Mitteleuropäische Sommerzeit)
    inDate = new Date('2023-10-31T01:10:00.000+01:00') // Tue Oct 31 2023 01:10:00 GMT+0100 (Mitteleuropäische Normalzeit)
    output = applyDate(inTime, inDate)
    expect(output.toLocaleTimeString()).to.equal(inTime.toLocaleTimeString()) // 02:53:00
    expect(output.toLocaleDateString()).to.equal(inDate.toLocaleDateString()) // Oct 31 2023
  })

  test('Partial date strings parsed asUTC=true', () => {
    let inTime, inDate, validate
    inTime = '2011-01-27T05:48:00'
    inDate = '2011-02-12'
    validate = new Date('2011-02-12T05:48:00.000Z')
    expect(applyDate(inTime, inDate, { asUTC: true })).to.deep.equal(validate)
  })

  test('Partial date strings parsed asUTC=false', () => {
    let inTime, inDate, tzOffsst, validate
    inTime = '2011-01-27T05:48:00'
    inDate = '2011-02-12'
    tzOffsst = new Date('2011-02-12').getTimezoneOffset()
    validate = addMinutes(new Date('2011-02-12T05:48:00.000Z'), tzOffsst)
    expect(applyDate(inTime, inDate, { asUTC: false })).to.deep.equal(validate)
  })

  test('Very large time gap', () => {
    let inTime, inDate, output
    inTime = new Date('2011-06-27T06:51:00.000Z')
    inDate = new Date('2018-05-30T00:00:00.000Z')
    output = new Date('2018-05-30T06:51:00.000Z')
    expect(applyDate(inTime, inDate)).to.deep.equal(output)
  })

  test('Make sure it doesn\'t jump to next month for the 31st', () => {
    let inTime, inDate, output, validate
    inTime = new Date('2020-01-01T00:15:00.000Z')
    inDate = new Date('2022-02-02T00:00:00.000Z')
    output = applyDate(inTime, inDate)
    validate = new Date('2022-02-02T00:15:00.000Z')
    expect(output).to.deep.equal(validate)
  })
})
