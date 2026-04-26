import { describe, it, expect, beforeEach } from 'vitest'
import { createTimestamps } from '../src/createTimestamps'
import type { TimerInput, TimesetInput, MemoryInput } from '../src/types'
import { addMinutes } from 'date-fns/addMinutes'
import { parseDateAsToday } from '../src/parseDateAsToday'
import timestampsFixture1 from './fixtures/timestamps-1-in.json' with { type: 'json' }
import timestampsFixture2 from './fixtures/timestamps-2-in.json' with { type: 'json' }

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
        expect(t.startDrift).toBe(0)
        expect(t.finishDrift).toBe(0)
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
      expect(ts[0].startDrift).toBe(min(5))
      expect(ts[0].finishDrift).toBe(min(5))
    })

    it('DURATION overrunning: actual.finish = now', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const now = THREE_PM + min(12) // 2min overrun
      const ts = createTimestamps(timers, timeset, undefined, now)
      expect(ts[0].actual.finish).toBe(now)
      expect(ts[0].finishDrift).toBe(min(2))
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
      expect(ts[1].startDrift).toBe(min(5))
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
      expect(ts[1].startDrift).toBe(min(3))
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
      expect(ts[1].startDrift).toBe(-min(2))
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
      expect(ts[1].finishDrift).toBe(0) // finish didn't shift
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
      expect(ts[1].finishDrift).toBe(min(5)) // overflow drift propagates
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
      expect(ts[0].startDrift).toBe(min(2))
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
      expect(ts[0].startDrift).toBe(0)
      expect(ts[1].startDrift).toBe(0)
      expect(ts[2].state).toBe('ACTIVE')
    })

    it('skipped timer has zero actual duration, recovers finishDrift', () => {
      // Scenario: A ran long (+8min over), B skipped to recover time, C now active.
      // Expect B.actual.duration == 0, B.startDrift == +8min (inherited), B.finishDrift == -2min.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '3'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(18) // C started at 3:18 (8min late)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM, finish: THREE_PM + min(18), elapsed: min(18) }, // A ran 18min
          '3': { start: THREE_PM + min(18), finish: null, elapsed: 0 },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(19), null, memory)

      // A — PAST with memory, ran 8 min over
      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(true)
      expect(ts[0].finishDrift).toBe(min(8))

      // B — skipped: zero duration, startDrift inherited, finishDrift recovers
      expect(ts[1].state).toBe('PAST')
      expect(ts[1].hasMemory).toBe(false)
      expect(ts[1].actual.start).toBe(THREE_PM + min(18))
      expect(ts[1].actual.finish).toBe(THREE_PM + min(18))
      expect(ts[1].actual.duration).toBe(0)
      expect(ts[1].startDrift).toBe(min(8))       // propagated from A
      expect(ts[1].finishDrift).toBe(-min(2))  // 3:18 − 3:20 = recovered 10 min of 8 over

      // C — active
      expect(ts[2].state).toBe('ACTIVE')
    })

    it('FUTURE with stale memory (jumped back) ignores memory, projects normally', () => {
      // Show ran A→B→C, then jumped back to A. B and C are positionally FUTURE
      // again but still carry memory from the prior pass (kept on disk for
      // resume). Timestamp output must treat them as not-yet-played.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(30) // jumped back at 3:30, A restarted
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM + min(30), finish: null, elapsed: 0 }, // fresh
          '2': { start: THREE_PM + min(10), finish: THREE_PM + min(20), elapsed: min(10) }, // stale
          '3': { start: THREE_PM + min(20), finish: THREE_PM + min(30), elapsed: min(10) }, // stale
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(31), null, memory)

      // B — FUTURE, hasMemory flag preserved but actual comes from projection
      expect(ts[1].state).toBe('FUTURE')
      expect(ts[1].hasMemory).toBe(true)
      // Projects from active A: kickoff 3:30 + 10min = 3:40
      expect(ts[1].actual.start).toBe(THREE_PM + min(40))
      expect(ts[1].actual.finish).toBe(THREE_PM + min(50))
      expect(ts[1].actual.duration).toBe(min(10))

      // C — FUTURE, same treatment
      expect(ts[2].state).toBe('FUTURE')
      expect(ts[2].hasMemory).toBe(true)
      expect(ts[2].actual.start).toBe(THREE_PM + min(50))
      expect(ts[2].actual.finish).toBe(THREE_PM + min(60))
    })

    it('paused PAST timer: actual.duration is wall-clock (finish - start), not elapsed', () => {
      // Timer A kicked off at 3:00, ran 3 min, paused, transitioned at 3:20.
      // memory.elapsed = 3 min (resume layer) but wall-clock occupancy = 20 min.
      // Schedule layer must reflect the 20-min slot; elapsed stays in memory
      // for the resume/countdown path.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(20)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM, finish: THREE_PM + min(20), elapsed: min(3) },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(21), null, memory)
      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(true)
      expect(ts[0].actual.start).toBe(THREE_PM)
      expect(ts[0].actual.finish).toBe(THREE_PM + min(20))
      expect(ts[0].actual.duration).toBe(min(20)) // wall-clock, NOT elapsed (3min)
      expect(ts[0].finishDrift).toBe(min(10)) // planned was 10min, slot took 20min
    })

    it('unanchored chain, T0 has memory, T1 active: T0 anchors on memory.start (T2-12)', () => {
      // Phase-3-post-UX-testing T2-12 regression. No anchors anywhere.
      // T0 ran 8:28 (10min planned), then user started T1. `timeset.kickoff`
      // now holds T1's kickoff — using it as the chain origin would slide
      // T0's planned.start forward to T1's kickoff and produce a phantom
      // `-8:28` startDrift on T0. Memory.start is the truth-teller: T0's own
      // memory.start anchors the chain so T0 reads startDrift = 0 and the
      // duration delta carries forward as T1's startDrift.
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(8) + 28_000
      const memory: MemoryInput = {
        timers: {
          '1': {
            start: THREE_PM,
            finish: THREE_PM + min(8) + 28_000,
            elapsed: min(8) + 28_000,
          },
        },
      }
      const now = THREE_PM + min(8) + 30_000
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)

      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(true)
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[0].actual.start).toBe(THREE_PM)
      expect(ts[0].actual.finish).toBe(THREE_PM + min(8) + 28_000)
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(-(min(1) + 32_000))

      expect(ts[1].state).toBe('ACTIVE')
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].actual.start).toBe(THREE_PM + min(8) + 28_000)
      expect(ts[1].startDrift).toBe(-(min(1) + 32_000))
    })

    it('unanchored chain, T0 skipped, T1 has memory, T2 active: chain back-fills T0', () => {
      // Sibling of T2-12. T0 was skipped (no memory). T1 ran from THREE_PM
      // for 10 min, T2 became active. Forward walk finds T1's memory.start
      // as the first grounded moment; T0's plannedStart back-fills by
      // subtracting T0's typed duration so T1.planned.start lands on
      // T1.memory.start. T0 is positionally PAST without memory → skipped
      // (zero actual duration), startDrift = 0, finishDrift recovers T0's
      // full duration.
      timeset.timerId = '3'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(10)
      const memory: MemoryInput = {
        timers: {
          '2': { start: THREE_PM, finish: THREE_PM + min(10), elapsed: min(10) },
        },
      }
      const now = THREE_PM + min(11)
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)

      // T0 — skipped, planned slot back-fills 10 min before THREE_PM
      expect(ts[0].state).toBe('PAST')
      expect(ts[0].hasMemory).toBe(false)
      expect(ts[0].planned.start).toBe(THREE_PM - min(10))
      expect(ts[0].planned.finish).toBe(THREE_PM)
      expect(ts[0].actual.duration).toBe(0)
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(-min(10))

      // T1 — PAST hasMemory, planned slot lands on memory.start
      expect(ts[1].state).toBe('PAST')
      expect(ts[1].hasMemory).toBe(true)
      expect(ts[1].planned.start).toBe(THREE_PM)
      expect(ts[1].actual.start).toBe(THREE_PM)
      expect(ts[1].startDrift).toBe(0)

      // T2 — active, planned & actual aligned
      expect(ts[2].state).toBe('ACTIVE')
      expect(ts[2].planned.start).toBe(THREE_PM + min(10))
      expect(ts[2].actual.start).toBe(THREE_PM + min(10))
      expect(ts[2].startDrift).toBe(0)
    })

    it('unanchored chain, T0 active with stale memory: kickoff wins, not memory', () => {
      // Sibling of T2-12. T0 ran THREE_PM..THREE_PM+10min, switched to T1,
      // switched back to T0 at THREE_PM+30min. Memory from prior run still
      // on disk but T0 is currently active — its live kickoff is truth.
      // Walk picks kickoff at the active row, ignoring stale memory there.
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(30)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM, finish: THREE_PM + min(10), elapsed: min(10) },
        },
      }
      const now = THREE_PM + min(31)
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)

      expect(ts[0].state).toBe('ACTIVE')
      expect(ts[0].hasMemory).toBe(true)
      expect(ts[0].planned.start).toBe(THREE_PM + min(30))
      expect(ts[0].actual.start).toBe(THREE_PM + min(30))
      expect(ts[0].startDrift).toBe(0)
    })

    it('live duration edit on past timer shifts startDrift / finishDrift', () => {
      // Without snapshot pinning, live edits flow straight through: editing a
      // past timer's duration after it ran moves both planned.finish and the
      // chained drift on the next row. The user-placed anchor (none here)
      // would normally be the truth-teller; without one, edits propagate.
      timers[0].startTime = new Date(THREE_PM)
      timers[0].minutes = 20 // changed from 10 to 20 after the fact
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(13)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM + min(2), finish: THREE_PM + min(13), elapsed: min(11) },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(14), null, memory)
      // planned.start anchored to THREE_PM, planned.finish = THREE_PM + 20min (live)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[0].startDrift).toBe(min(2))
      // finishDrift = actual.finish (3PM+13) - planned.finish (3PM+20) = -7min
      expect(ts[0].finishDrift).toBe(-min(7))
    })
  })

  describe('reverse-walk soft-start derivation', () => {
    // Pre-kickoff (no active timer) only. Once kickoff happens, forward chain
    // wins everywhere — phase-3-pivot.md leaves Q8 open and we go conservative.

    it('pre-kickoff with END FINISH_TIME anchor: every upstream row reverse-derives', () => {
      // Three DURATION timers, no startTimes. Last is FINISH_TIME with finishTime=END.
      // Wait — fixture timer[2] is DURATION; convert the last to FINISH_TIME.
      timers[2].type = 'FINISH_TIME'
      timers[2].finishTime = new Date(THREE_PM + min(60))
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM)
      // Walk: target = END (3PM+60). t[1] reverse-fills to 50–60, t[0] to 40–50.
      expect(ts[0].planned.start).toBe(THREE_PM + min(40))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(50))
      expect(ts[1].planned.start).toBe(THREE_PM + min(50))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(60))
      // FINISH_TIME's plannedStart re-chains from t[1].plannedFinish; slack absorbed.
      expect(ts[2].planned.start).toBe(THREE_PM + min(60))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(60))
      expect(ts[2].planned.duration).toBe(0)
    })

    it('pre-kickoff with hard startTime mid-chain: rows before reverse from it', () => {
      timers[1].startTime = new Date(THREE_PM + min(30))
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM)
      // t[0] reverse-fills from t[1].plannedStart (3PM+30) - 10min = 3PM+20.
      expect(ts[0].planned.start).toBe(THREE_PM + min(20))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(30))
      // t[1] anchored, t[2] forward-chained.
      expect(ts[1].planned.start).toBe(THREE_PM + min(30))
      expect(ts[2].planned.start).toBe(THREE_PM + min(40))
    })

    it('FINISH_TIME without finishTime stops the walk', () => {
      // t[1] is FINISH_TIME but has no finishTime — variable duration, walk
      // stops there. Downstream END anchor on t[2] does not propagate to t[0].
      timers[1].type = 'FINISH_TIME'
      timers[1].finishTime = null
      timers[2].type = 'FINISH_TIME'
      timers[2].finishTime = new Date(THREE_PM + min(60))
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM)
      // t[0] gets no reverse target — falls back to forward chain (kickoff/now).
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
    })

    it('multiple anchors: upstream-of-startTime reverses; rows between anchors stay forward', () => {
      // Five timers, hard startTime at idx 2 and FINISH_TIME-with-finishTime at idx 4.
      // t[3] is forward-anchored (chained from t[2]'s startTime) — forward wins,
      // no reverse-fill from t[4]'s anchor. The slack between t[3].planned.finish
      // and t[4]'s anchor is absorbed into t[4].planned.duration.
      const five: TimerInput[] = [
        makeTimer({ _id: '1' }),
        makeTimer({ _id: '2' }),
        makeTimer({ _id: '3', startTime: new Date(THREE_PM + min(30)) }),
        makeTimer({ _id: '4' }),
        makeTimer({ _id: '5', type: 'FINISH_TIME', finishTime: new Date(THREE_PM + min(70)) }),
      ]
      const ts = createTimestamps(five, makeTimeset({ timerId: null }), undefined, THREE_PM)
      // Walk from idx-2 startTime (3PM+30): t[1] = 3PM+20..30, t[0] = 3PM+10..20.
      expect(ts[0].planned.start).toBe(THREE_PM + min(10))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[1].planned.start).toBe(THREE_PM + min(20))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(30))
      // t[3] forward-chained from t[2]'s anchor — NOT reverse-derived from t[4].
      expect(ts[3].planned.start).toBe(THREE_PM + min(40))
      expect(ts[3].planned.finish).toBe(THREE_PM + min(50))
      // t[4] FINISH_TIME absorbs slack: 20min slot ending at 3PM+70.
      expect(ts[4].planned.start).toBe(THREE_PM + min(50))
      expect(ts[4].planned.finish).toBe(THREE_PM + min(70))
      expect(ts[4].planned.duration).toBe(min(20))
    })

    it('active timer present: NO reverse-walk (forward wins post-kickoff)', () => {
      // Same END anchor as the pre-kickoff test, but timer 1 active. Reverse
      // skipped — t[0]'s plannedStart stays = kickoff, NOT reverse-derived.
      timers[2].type = 'FINISH_TIME'
      timers[2].finishTime = new Date(THREE_PM + min(60))
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM + min(1))
      // Forward chain: t[0] = kickoff (3PM) → 3PM+10, t[1] = 3PM+10 → 3PM+20.
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
    })

    it('no anchors anywhere: reverse-walk no-op, forward chain only', () => {
      // Pure case-1: no startTime, no FINISH_TIME. Reverse-walk has no target,
      // forward chain runs unchanged.
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM)
      expect(ts[0].planned.start).toBe(THREE_PM) // = now (kickoffMs fallback)
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
    })

    it('overcommit: anchor sits before forward-chain end → negative gap on anchor row', () => {
      // Hard startTime at idx 1 = 3PM+5min, but t[0] is 10min. Reverse-walk
      // pulls t[0] back to 3PM-5min..3PM+5min. The anchor row's gap is the
      // overcommit signal: planned.start - prev.planned.finish = 0 (clean
      // here because reverse-walk landed exactly on the anchor by construction).
      timers[1].startTime = new Date(THREE_PM + min(5))
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM)
      // t[0] reverse-derived to land at anchor: 3PM-5 .. 3PM+5
      expect(ts[0].planned.start).toBe(THREE_PM - min(5))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(5))
      expect(ts[1].planned.start).toBe(THREE_PM + min(5))
      // gap on anchor row reads 0 — reverse-walk made forward land on anchor.
      expect(ts[1].gap).toBe(0)
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
      expect(ts[0].startDrift).toBe(0)
      // t2 started after reset (14 < 15 → still before) → also zero-drift
      expect(ts[1].startDrift).toBe(0)
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
      expect(ts[0].startDrift).toBe(0) // zeroed
      expect(ts[1].startDrift).toBe(min(3)) // 13 - 10 = 3
    })

    it('reset during active timer: startDrift & finishDrift zero at reset moment', () => {
      // Event running +8 min late. Timer A planned 3:00–3:10, kicked off late
      // at 3:08. At 3:20 user hits reset. `now` = 3:20.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(8)
      const memory: MemoryInput = {
        driftResetAt: THREE_PM + min(20),
        timers: {
          '1': { start: THREE_PM + min(8), finish: null, elapsed: 0 },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(20), null, memory)
      expect(ts[0].state).toBe('ACTIVE')
      expect(ts[0].actual.start).toBe(THREE_PM + min(20)) // floored to reset
      expect(ts[0].actual.finish).toBe(THREE_PM + min(30)) // reset + 10min duration
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(0)
      // Future timer B (planned 3:10–3:20) chains clean from active
      expect(ts[1].state).toBe('FUTURE')
      expect(ts[1].actual.start).toBe(THREE_PM + min(30))
      expect(ts[1].startDrift).toBe(0)
      expect(ts[1].finishDrift).toBe(0)
    })

    it('reset during active timer: drift accumulates again after reset', () => {
      // Same setup, but `now` is 5 min past reset — active timer now overrunning.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(8)
      const memory: MemoryInput = {
        driftResetAt: THREE_PM + min(20),
        timers: {
          '1': { start: THREE_PM + min(8), finish: null, elapsed: 0 },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(35), null, memory)
      // Active: actual start still reset (3:20), finish grows past scheduled
      expect(ts[0].actual.start).toBe(THREE_PM + min(20))
      expect(ts[0].actual.finish).toBe(THREE_PM + min(35)) // now > reset + 10
      expect(ts[0].startDrift).toBe(0) // still zero — it "started" at reset
      expect(ts[0].finishDrift).toBe(min(5)) // 5 min over the new slot
    })

    it('reset with no active timer: future row with plannedStart < reset floors forward', () => {
      // Edge case: reset pressed with no timer active (e.g. during a gap).
      // First future timer had a planned start before the reset — its baseline
      // should floor at reset, and it starts "now" from the reset moment.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = null
      const memory: MemoryInput = {
        driftResetAt: THREE_PM + min(20),
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(20), null, memory)
      expect(ts[0].state).toBe('FUTURE')
      expect(ts[0].actual.start).toBe(THREE_PM + min(20))
      expect(ts[0].actual.finish).toBe(THREE_PM + min(30))
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(0)
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
      expect(ts[1].finishDrift).toBe(min(2)) // ran 2 min over plan
    })
  })

  // Regression tests ported from the legacy client-side createTimestamps suite.
  // Each captures a real production bug in date-boundary handling. The new impl
  // uses the same `parseDateAsToday` / `applyDate` primitives, so these bugs
  // remain reachable and must stay tested.
  describe('regression: date-boundary bugs', () => {
    // Monticello bug: FINISH_TIME with a past startTime + no finishDatePlus →
    // parseDateAsToday(finishTime) used to anchor finish to "today" instead of
    // the startTime's day, producing a huge (days-long) planned.duration.
    // Fix: pass `start` as the `now` reference when parsing finishTime.
    it('FINISH_TIME: finish anchors to start day, not "today" (Monticello bug)', () => {
      timers[0].type = 'FINISH_TIME'
      timers[0].startTime = '2025-05-21T08:00:00.000Z'
      timers[0].finishTime = '2025-05-21T08:10:00.000Z'
      // `now` chosen well after the configured date — the bug surfaced when
      // "today" diverged from the startTime's day.
      const later = new Date('2025-07-01T12:00:00.000Z').getTime()
      const ts = createTimestamps(timers, timeset, 'UTC', later)
      // Essence: finish is 10 min after start, on the same day. No 24h drift.
      expect(ts[0].planned.duration).toBe(10 * 60_000)
    })

    // Michael Havey bug #1: a multi-timer chain where timestamp.finish on the
    // LINKED middle row got shifted by ±24h (a DST-aware off-by-one). Fix:
    // applyDate received timer.finishTime's date, not timer.finishDate.
    // In the new architecture the one-shot `resolveAnchoredTime` helper
    // collapses the bug's code path, but the regression is cheap to preserve.
    it('Michael Havey bug #1: LINKED chain with roomDate does not produce 24h gap', () => {
      const timers = timestampsFixture1 as unknown as TimerInput[]
      const active = timers[1]!
      const ts = createTimestamps(
        timers,
        makeTimeset({
          timerId: active._id,
          kickoff: new Date(active.startTime as string),
          lastStop: new Date(active.startTime as string),
          deadline: new Date(active.finishTime as string),
          running: true,
        }),
        'UTC',
        new Date(active.startTime as string).getTime(),
        '2023-03-27',
      )
      // Any gap ≥ 24h indicates the date-boundary regression. DST shifts can
      // contribute ±1h, so allow a generous envelope well under 24h.
      for (const t of ts) {
        expect(Math.abs(t.gap)).toBeLessThan(2 * 60 * 60_000)
      }
      // Duration on each row is sane (never days-long).
      for (const t of ts) {
        expect(Math.abs(t.planned.duration)).toBeLessThan(24 * 60 * 60_000)
      }
    })

    // Michael Havey bug #2: timestamps[2].planned.start was wrong by exactly
    // one day, producing a 24h negative gap. Same class of fix as #1, on the
    // startTime branch. Fixture: three LINKED FINISH_TIME/FINISH_TIME rows.
    it('Michael Havey bug #2: LINKED chain does not shift start by 24h', () => {
      const timers = timestampsFixture2 as unknown as TimerInput[]
      const active = timers[0]!
      const ts = createTimestamps(
        timers,
        makeTimeset({
          timerId: active._id,
          kickoff: new Date(active.startTime as string),
          lastStop: new Date(active.startTime as string),
          deadline: new Date(active.finishTime as string),
          running: true,
        }),
        'UTC',
        new Date(active.startTime as string).getTime(),
        '2023-03-25',
      )
      for (const t of ts) {
        expect(Math.abs(t.gap)).toBeLessThan(2 * 60 * 60_000)
        expect(Math.abs(t.planned.duration)).toBeLessThan(24 * 60 * 60_000)
      }
    })

    // "Don't carry after Until finish date": FINISH_TIME with finishTime
    // BEFORE startTime (inverted — planned.duration is negative). Old model
    // floored carry at 0. New model lets drift cascade, but bounded by the
    // inversion — no runaway escalation across downstream rows.
    it('inverted FINISH_TIME: downstream drift is bounded, not cascading', () => {
      timers[0].type = 'FINISH_TIME'
      timers[0].startTime = new Date(THREE_PM)
      timers[0].finishTime = new Date(THREE_PM - 10 * 60_000) // 10 min before startTime
      timeset.timerId = timers[0]._id
      timeset.kickoff = THREE_PM
      timeset.lastStop = THREE_PM
      timeset.running = true
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM)
      expect(ts[0].planned.duration).toBe(-10 * 60_000)
      // Active FINISH_TIME anchor absorbs up to its (negative-capacity) duration.
      // Drift surfaces as startDrift on the next row — bounded by the inversion.
      const inheritedDrift = ts[1].startDrift
      expect(inheritedDrift).toBeGreaterThanOrEqual(0)
      expect(inheritedDrift).toBeLessThanOrEqual(10 * 60_000)
      // Downstream row does not amplify drift — it inherits the same bounded value.
      expect(ts[2].startDrift).toBe(inheritedDrift)
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
        expect(t).toHaveProperty('startDrift')
        expect(t).toHaveProperty('finishDrift')
        expect(t).toHaveProperty('gap')
        expect(t).toHaveProperty('hasMemory')
        expect(t).toHaveProperty('explicitStart')
        expect(t).toHaveProperty('explicitFinish')
        expect(typeof t.planned.start).toBe('number')
      }
    })
  })
})
