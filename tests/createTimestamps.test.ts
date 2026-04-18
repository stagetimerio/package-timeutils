import { describe, it, expect, beforeEach } from 'vitest'
import { createTimestamps } from '../src/createTimestamps'
import type { TimerInput, TimesetInput, MemoryInput } from '../src/types'
import { addMinutes } from 'date-fns/addMinutes'
import { parseDateAsToday } from '../src/parseDateAsToday'

const THREE_PM = parseDateAsToday('2022-01-01T15:00:00.000Z').getTime()
const min = (n: number) => n * 60_000

function makeTimer (overrides: Partial<TimerInput> = {}): TimerInput {
  return {
    _id: '1',
    type: 'DURATION',
    trigger: 'MANUAL',
    hours: 0,
    minutes: 10,
    seconds: 0,
    startTime: null,
    finishTime: null,
    ...overrides,
  }
}

function makeTimers (): TimerInput[] {
  return [
    makeTimer({ _id: '1' }),
    makeTimer({ _id: '2' }),
    makeTimer({ _id: '3' }),
  ]
}

function makeTimeset (overrides: Partial<TimesetInput> = {}): TimesetInput {
  return {
    timerId: null,
    running: false,
    kickoff: THREE_PM,
    lastStop: THREE_PM,
    deadline: THREE_PM + min(10),
    ...overrides,
  }
}

describe('createTimestamps', () => {
  let timers: TimerInput[]
  let timeset: TimesetInput
  beforeEach(() => {
    timers = makeTimers()
    timeset = makeTimeset()
  })

  describe('planned chain — FUTURE only', () => {
    it('returns empty array for empty/missing inputs', () => {
      expect(createTimestamps([], timeset)).toEqual([])
      expect(createTimestamps(timers, null as unknown as TimesetInput)).toEqual([])
    })

    it('chains planned times from start anchor through durations', () => {
      timers[0].startTime = new Date(THREE_PM)
      const now = THREE_PM - min(30) // well before first timer
      const ts = createTimestamps(timers, timeset, undefined, now)

      expect(ts).toHaveLength(3)
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[0].planned.duration).toBe(min(10))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(30))
    })

    it('all FUTURE timers with no kickoff: actual mirrors planned, drift = 0', () => {
      timers[0].startTime = new Date(THREE_PM)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      for (const t of ts) {
        expect(t.state).toBe('FUTURE')
        expect(t.actual.start).toBe(t.planned.start)
        expect(t.actual.finish).toBe(t.planned.finish)
        expect(t.drift).toBe(0)
        expect(t.overUnder).toBe(0)
        expect(t.hasMemory).toBe(false)
      }
    })

    it('without startTime, first timer anchors to now', () => {
      const now = THREE_PM
      const ts = createTimestamps(timers, timeset, undefined, now)
      expect(ts[0].planned.start).toBe(now)
      expect(ts[0].planned.finish).toBe(now + min(10))
      expect(ts[0].explicitStart).toBe(false)
      expect(ts[1].planned.start).toBe(now + min(10))
    })

    it('computes planned gap between non-contiguous timers', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[0].gap).toBe(0)
      expect(ts[1].gap).toBe(min(5)) // 5min gap
    })

    it('computes negative gap (overlap) when next timer starts before prev finishes', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(6))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[1].gap).toBe(-min(4))
    })
  })

  describe('FINISH_TIME planned', () => {
    it('computes planned.duration from finishTime - plannedStart', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].type = 'FINISH_TIME'
      timers[1].finishTime = new Date(THREE_PM + min(25))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(25))
      expect(ts[1].planned.duration).toBe(min(15))
      expect(ts[1].explicitFinish).toBe(true)
    })
  })

  describe('ACTIVE timer', () => {
    it('DURATION: actual.start = kickoff, drift = kickoff - planned.start', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) // 5min late
      timeset.deadline = THREE_PM + min(15)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(5))
      expect(ts[0].state).toBe('ACTIVE')
      expect(ts[0].actual.start).toBe(THREE_PM + min(5))
      expect(ts[0].actual.duration).toBe(min(10))
      expect(ts[0].actual.finish).toBe(THREE_PM + min(15))
      expect(ts[0].drift).toBe(min(5))
      expect(ts[0].overUnder).toBe(min(5))
    })

    it('DURATION overrunning: actual.finish = now', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const now = THREE_PM + min(12) // 2min overrun
      const ts = createTimestamps(timers, timeset, undefined, now)
      expect(ts[0].actual.finish).toBe(now)
      expect(ts[0].overUnder).toBe(min(2))
    })

    it('FUTURE timer after ACTIVE: drift chains through', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) // 5min late
      const now = THREE_PM + min(7)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 actual: start=5, duration=10, finish=15
      // t2 planned.start = prev.planned.finish = THREE_PM + 10
      // t2 actual.start (non-linked) = max(prev.actual.finish=15, planned.start=10) = 15
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].actual.start).toBe(THREE_PM + min(15))
      expect(ts[1].drift).toBe(min(5))
    })

    it('FUTURE timer after ACTIVE with gap: gap absorbs part of drift', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15)) // 5min planned gap
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(8) // 8min late
      const now = THREE_PM + min(10)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 actual: start=8, duration=10, finish=18
      // t2 planned.start = THREE_PM + 15. actual.start = max(18, 15) = 18
      // drift = 18 - 15 = 3min (gap of 5min absorbed 5 of 8 min drift)
      expect(ts[1].actual.start).toBe(THREE_PM + min(18))
      expect(ts[1].drift).toBe(min(3))
    })

    it('LINKED timer: drift passes through without gap absorption', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].trigger = 'LINKED'
      timers[1].startTime = new Date(THREE_PM + min(15)) // 5min gap planned
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(3)
      const now = THREE_PM + min(5)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // planned: t1 0-10, t2 15-25
      // actual: t1 starts at 3, finishes at 13. t2 LINKED so actual.start = t1.actual.finish = 13
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[1].planned.start).toBe(THREE_PM + min(15))
      expect(ts[1].actual.start).toBe(THREE_PM + min(13))
      // Drift: actual.start (3PM+13) - planned.start (3PM+15) = -2min (ahead of schedule!)
      expect(ts[1].drift).toBe(-min(2))
    })
  })

  describe('FINISH_TIME anchoring in actual chain', () => {
    it('FUTURE FINISH_TIME absorbs drift up to duration, actual.finish stays = planned.finish', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].type = 'FINISH_TIME'
      timers[1].finishTime = new Date(THREE_PM + min(25)) // t2: 10-25 planned (15 min duration)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(10) // 10min late
      const now = THREE_PM + min(11)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 actual: 10-20. t2 actual.start = max(t1.finish, t1.planned.finish) = max(20, 10) = 20
      // t2 actual.finish = max(planned.finish=25, actual.start=20) = 25
      // t2 actual.duration = 25 - 20 = 5 (absorbed 10min from 15min)
      expect(ts[1].actual.start).toBe(THREE_PM + min(20))
      expect(ts[1].actual.finish).toBe(THREE_PM + min(25))
      expect(ts[1].actual.duration).toBe(min(5))
      expect(ts[1].overUnder).toBe(0) // finish didn't shift
    })

    it('FUTURE FINISH_TIME clamps when drift exceeds duration', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].type = 'FINISH_TIME'
      timers[1].finishTime = new Date(THREE_PM + min(15)) // t2: 10-15 planned (5 min)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(10) // 10min late (more than t2's duration)
      const now = THREE_PM + min(11)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 actual: 10-20. t2 actual.start = max(20, 10) = 20
      // t2 actual.finish = max(planned=15, actual.start=20) = 20
      // t2 actual.duration = max(0, 20-20) = 0 (clamped)
      expect(ts[1].actual.start).toBe(THREE_PM + min(20))
      expect(ts[1].actual.finish).toBe(THREE_PM + min(20))
      expect(ts[1].actual.duration).toBe(0)
      expect(ts[1].overUnder).toBe(min(5)) // overflow drift propagates
    })
  })

  describe('PAST with memory', () => {
    it('populates actual from memory entry, drift based on planned', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(10))
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(12)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM + min(2), finish: THREE_PM + min(12), elapsed: min(10) },
        },
      }
      const now = THREE_PM + min(13)
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)
      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(true)
      expect(ts[0].actual.start).toBe(THREE_PM + min(2))
      expect(ts[0].actual.finish).toBe(THREE_PM + min(12))
      expect(ts[0].actual.duration).toBe(min(10))
      expect(ts[0].drift).toBe(min(2))
    })

    it('skipped PAST (positionally past, no memory) chains from prev, drift = 0', () => {
      // Active is timer 3, timer 1 and 2 have no memory entries (skipped).
      // State is positional → t1 and t2 are PAST; hasMemory flags them as unrun.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '3'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5)
      const memory: MemoryInput = {
        timers: {
          '3': { start: THREE_PM + min(5), finish: null, elapsed: 0 },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(6), null, memory)
      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(false)
      expect(ts[1].state).toBe('PAST')
      expect(ts[1].hasMemory).toBe(false)
      expect(ts[0].drift).toBe(0)
      expect(ts[1].drift).toBe(0)
      expect(ts[2].state).toBe('ACTIVE')
    })

    it('uses snapshot plannedStart as drift baseline', () => {
      timers[0].startTime = new Date(THREE_PM)
      // User edited timer duration AFTER it ran; snapshot preserves the original planned values
      timers[0].minutes = 20 // changed from 10 to 20 after the fact
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(13)
      const memory: MemoryInput = {
        timers: {
          '1': {
            start: THREE_PM + min(2),
            finish: THREE_PM + min(13),
            elapsed: min(11),
            plannedStart: THREE_PM,              // snapshot at first kickoff
            plannedFinish: THREE_PM + min(10),   // was 10-minute timer then
            plannedDuration: min(10),
          },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(14), null, memory)
      // Drift should use snapshot (THREE_PM), not current planned (which is still THREE_PM since startTime didn't change)
      expect(ts[0].drift).toBe(min(2))
      // overUnder from snapshot: actual.finish (3PM+13) - snapshot.plannedFinish (3PM+10) = 3min
      expect(ts[0].overUnder).toBe(min(3))
    })
  })

  describe('driftResetAt', () => {
    it('treats memory entries before reset as zero drift', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(10))
      timeset.timerId = '3'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(25)
      const memory: MemoryInput = {
        driftResetAt: THREE_PM + min(15), // reset set between t1 and t2
        timers: {
          '1': { start: THREE_PM + min(2), finish: THREE_PM + min(13), elapsed: min(11) },
          '2': { start: THREE_PM + min(14), finish: THREE_PM + min(25), elapsed: min(11) },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(26), null, memory)
      // t1 started before reset (2 < 15) → zero-drift: actual = planned
      expect(ts[0].actual.start).toBe(ts[0].planned.start)
      expect(ts[0].actual.finish).toBe(ts[0].planned.finish)
      expect(ts[0].drift).toBe(0)
      // t2 started after reset (14 < 15 → still before) → also zero-drift
      expect(ts[1].drift).toBe(0)
    })

    it('memory entries after reset keep their drift', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(10))
      timeset.timerId = '3'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(15)
      const memory: MemoryInput = {
        driftResetAt: THREE_PM + min(5),
        timers: {
          '1': { start: THREE_PM + min(2), finish: THREE_PM + min(12), elapsed: min(10) }, // before reset
          '2': { start: THREE_PM + min(13), finish: THREE_PM + min(15), elapsed: min(2) }, // after reset
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(16), null, memory)
      expect(ts[0].drift).toBe(0) // zeroed
      expect(ts[1].drift).toBe(min(3)) // 13 - 10 = 3
    })
  })

  describe('timezone + roomDate handling', () => {
    it('applies roomDate to startTime anchored times', () => {
      timers[0].startTime = '2022-01-01T15:00:00.000Z'
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15')
      expect(new Date(ts[0].planned.start).toISOString()).toBe('2024-06-15T15:00:00.000Z')
    })

    it('applies startDatePlus offset', () => {
      timers[0].startTime = '2022-01-01T15:00:00.000Z'
      timers[0].startDatePlus = 1
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15')
      expect(new Date(ts[0].planned.start).toISOString()).toBe('2024-06-16T15:00:00.000Z')
    })

    it('FINISH_TIME with roomDate', () => {
      timers[0].type = 'FINISH_TIME'
      timers[0].finishTime = '2022-01-01T15:30:00.000Z'
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15')
      expect(new Date(ts[0].planned.finish).toISOString()).toBe('2024-06-15T15:30:00.000Z')
    })
  })

  describe('ENDED state — no active timer, all memory', () => {
    it('all timers PAST with memory, no active', () => {
      timeset.timerId = null
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM, finish: THREE_PM + min(10), elapsed: min(10) },
          '2': { start: THREE_PM + min(10), finish: THREE_PM + min(22), elapsed: min(12) },
          '3': { start: THREE_PM + min(22), finish: THREE_PM + min(30), elapsed: min(8) },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(31), null, memory)
      expect(ts[0].state).toBe('PAST')
      expect(ts[1].state).toBe('PAST')
      expect(ts[2].state).toBe('PAST')
      expect(ts[0].actual.duration).toBe(min(10))
      expect(ts[1].actual.duration).toBe(min(12))
      expect(ts[1].overUnder).toBe(min(2)) // ran 2 min over plan
    })
  })

  describe('output shape', () => {
    it('every timestamp has the documented keys', () => {
      timers[0].startTime = new Date(THREE_PM)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      for (const t of ts) {
        expect(t).toHaveProperty('timerId')
        expect(t).toHaveProperty('state')
        expect(t).toHaveProperty('planned.start')
        expect(t).toHaveProperty('planned.finish')
        expect(t).toHaveProperty('planned.duration')
        expect(t).toHaveProperty('actual.start')
        expect(t).toHaveProperty('actual.finish')
        expect(t).toHaveProperty('actual.duration')
        expect(t).toHaveProperty('drift')
        expect(t).toHaveProperty('overUnder')
        expect(t).toHaveProperty('gap')
        expect(t).toHaveProperty('hasMemory')
        expect(t).toHaveProperty('explicitStart')
        expect(t).toHaveProperty('explicitFinish')
        expect(typeof t.planned.start).toBe('number')
      }
    })
  })
})
