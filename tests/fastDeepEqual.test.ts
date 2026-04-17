import { describe, it, expect } from 'vitest'
import { fastDeepEqual } from '../src/fastDeepEqual'
import npmFastDeepEqual from 'fast-deep-equal'

describe('fastDeepEqual', () => {
  it('performance comparison (informational only)', () => {
    const iterations = 1000

    const obj1 = {
      planned: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 30 * 60000 },
      actual: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 30 * 60000 },
      timers: {
        '#1': {
          id: '#1',
          index: 0,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 5 * 60000 },
          actual: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 5 * 60000 },
        },
        '#2': {
          id: '#2',
          index: 1,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:05:00.000Z'), duration: 10 * 60000 },
          actual: { start: new Date('2024-07-26T09:05:00.000Z'), duration: 10 * 60000 },
        },
        '#3': {
          id: '#3',
          index: 2,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:15:00.000Z'), duration: 15 * 60000 },
          actual: { start: new Date('2024-07-26T09:15:00.000Z'), duration: 15 * 60000 },
        },
      },
    }

    const obj2 = {
      planned: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 30 * 60000 },
      actual: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 30 * 60000 },
      timers: {
        '#1': {
          id: '#1',
          index: 0,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 5 * 60000 },
          actual: { start: new Date('2024-07-26T09:00:00.000Z'), duration: 5 * 60000 },
        },
        '#2': {
          id: '#2',
          index: 1,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:05:00.000Z'), duration: 10 * 60000 },
          actual: { start: new Date('2024-07-26T09:05:00.000Z'), duration: 10 * 60000 },
        },
        '#3': {
          id: '#3',
          index: 2,
          state: 'FUTURE',
          planned: { start: new Date('2024-07-26T09:15:00.000Z'), duration: 15 * 60000 },
          actual: { start: new Date('2024-07-26T09:15:00.000Z'), duration: 15 * 60000 },
        },
      },
    }

    const start1 = performance.now()
    for (let i = 0; i < iterations; i++) {
      void (JSON.stringify(obj1) === JSON.stringify(obj2))
    }
    const duration1 = performance.now() - start1

    const start2 = performance.now()
    for (let i = 0; i < iterations; i++) {
      npmFastDeepEqual(obj1, obj2)
    }
    const duration2 = performance.now() - start2

    const start3 = performance.now()
    for (let i = 0; i < iterations; i++) {
      fastDeepEqual(obj1, obj2)
    }
    const duration3 = performance.now() - start3

    console.info(`
---
## Performance Comparison (1000 iterations)
- JSON.stringify:  \`${duration1.toFixed(1)}ms\`
- fast-deep-equal: \`${duration2.toFixed(1)}ms\`
- fastDeepEqual:   \`${duration3.toFixed(1)}ms\`
---`)

    expect(fastDeepEqual(obj1, obj2)).toBe(true)

    if (duration3 > duration1 || duration3 > duration2) {
      console.warn('⚠️  fastDeepEqual may be slower than expected in this environment')
    }
  })

  it('should compare primitives correctly', () => {
    expect(fastDeepEqual(1, 1)).toBe(true)
    expect(fastDeepEqual('hello', 'hello')).toBe(true)
    expect(fastDeepEqual(true, true)).toBe(true)
    expect(fastDeepEqual(null, null)).toBe(true)
    expect(fastDeepEqual(undefined, undefined)).toBe(true)
    expect(fastDeepEqual(1, 2)).toBe(false)
    expect(fastDeepEqual('hello', 'world')).toBe(false)
    expect(fastDeepEqual(true, false)).toBe(false)
    expect(fastDeepEqual(null, undefined)).toBe(false)
  })

  it('should compare arrays correctly', () => {
    expect(fastDeepEqual([], [])).toBe(true)
    expect(fastDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(fastDeepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
    expect(fastDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(fastDeepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('should compare objects correctly', () => {
    expect(fastDeepEqual({}, {})).toBe(true)
    expect(fastDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(fastDeepEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } })).toBe(true)
    expect(fastDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(fastDeepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    expect(fastDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('should compare arrays in objects correctly', () => {
    expect(fastDeepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
    expect(fastDeepEqual({ a: [1, 2] }, { a: [9, 9] })).toBe(false)
    expect(fastDeepEqual({ a: [{ b: 1 }, 2] }, { a: [{ b: 1 }, 2] })).toBe(true)
    expect(fastDeepEqual({ a: [{ b: 1 }, 2] }, { a: [{ b: 9 }, 2] })).toBe(false)
    expect(fastDeepEqual({ a: [{ b: 1 }, 2] }, { a: [{ b: 1 }, 9] })).toBe(false)
  })

  it('should compare Date objects correctly', () => {
    const date1 = new Date('2023-01-01')
    const date2 = new Date('2023-01-01')
    const date3 = new Date('2023-01-02')
    expect(fastDeepEqual(date1, date2)).toBe(true)
    expect(fastDeepEqual(date1, date3)).toBe(false)
  })

  it('should handle nested structures', () => {
    const obj1 = { a: [1, { b: 2 }], c: { d: [3, 4] } }
    const obj2 = { a: [1, { b: 2 }], c: { d: [3, 4] } }
    const obj3 = { a: [1, { b: 3 }], c: { d: [3, 4] } }
    expect(fastDeepEqual(obj1, obj2)).toBe(true)
    expect(fastDeepEqual(obj1, obj3)).toBe(false)
  })

  it('should handle functions', () => {
    const func1 = () => {}
    const func2 = () => {}
    expect(fastDeepEqual(func1, func1)).toBe(true)
    expect(fastDeepEqual(func1, func2)).toBe(false)
  })

  it('should handle NaN correctly', () => {
    expect(fastDeepEqual(NaN, NaN)).toBe(true)
    expect(fastDeepEqual({ a: NaN }, { a: NaN })).toBe(true)
  })

  it('should handle different types correctly', () => {
    expect(fastDeepEqual(1, '1')).toBe(false)
    expect(fastDeepEqual([], {})).toBe(false)
    expect(fastDeepEqual(new Date(), {})).toBe(false)
  })
})
