import { expect } from 'chai'
import { formatDurationInWords } from '../src/index'

describe('formatDurationInWords', () => {
  describe('approximate (default)', () => {
    test('less than a minute', () => {
      expect(formatDurationInWords(5000)).to.equal('less than a minute')
    })

    test('1 minute', () => {
      expect(formatDurationInWords(60000)).to.equal('1 minute')
    })

    test('about 1 hour', () => {
      expect(formatDurationInWords(3600000)).to.equal('about 1 hour')
    })

    test('about 2 hours', () => {
      expect(formatDurationInWords(7200000)).to.equal('about 2 hours')
    })

    test('1 day', () => {
      expect(formatDurationInWords(86400000)).to.equal('1 day')
    })

    test('negative value uses absolute', () => {
      expect(formatDurationInWords(-3600000)).to.equal('about 1 hour')
    })

    test('zero', () => {
      expect(formatDurationInWords(0)).to.equal('less than a minute')
    })
  })

  describe('exact mode', () => {
    test('1 hour 30 minutes', () => {
      expect(formatDurationInWords(5400000, { exact: true })).to.equal('1 hr 30 mins')
    })

    test('singular units', () => {
      expect(formatDurationInWords(90061000, { exact: true })).to.equal('1 day 1 hr 1 min 1 sec')
    })

    test('plural units', () => {
      expect(formatDurationInWords(183722000, { exact: true })).to.equal('2 days 3 hrs 2 mins 2 secs')
    })

    test('hours only', () => {
      expect(formatDurationInWords(7200000, { exact: true })).to.equal('2 hrs')
    })

    test('minutes only', () => {
      expect(formatDurationInWords(300000, { exact: true })).to.equal('5 mins')
    })

    test('seconds only', () => {
      expect(formatDurationInWords(45000, { exact: true })).to.equal('45 secs')
    })

    test('skips zero components', () => {
      expect(formatDurationInWords(3660000, { exact: true })).to.equal('1 hr 1 min')
    })
  })

  describe('space option', () => {
    test('non-breaking space', () => {
      expect(formatDurationInWords(5400000, { exact: true, space: '\u00A0' })).to.equal('1\u00A0hr 30\u00A0mins')
    })

    test('empty space', () => {
      expect(formatDurationInWords(5400000, { exact: true, space: '' })).to.equal('1hr 30mins')
    })
  })
})
