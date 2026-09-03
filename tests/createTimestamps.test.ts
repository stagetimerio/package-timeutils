import { describe, it, expect, beforeEach } from 'vitest'
import { createTimestamps as createAll } from '../src/createTimestamps'
import type { TimerInput, TimesetInput, MemoryInput, MarkerInput } from '../src/types'
import { parseDateAsToday } from '../src/parseDateAsToday'
import timestampsFixture1 from './fixtures/timestamps-1-in.json' with { type: 'json' }
import timestampsFixture2 from './fixtures/timestamps-2-in.json' with { type: 'json' }

// Nearly every case here reads the timer rows only; the marker list has its own block.
const createTimestamps = (...args: Parameters<typeof createAll>) => createAll(...args).timestamps

const THREE_PM = parseDateAsToday('2022-01-01T15:00:00.000Z').getTime()
const min = (n: number) => n * 60_000
const at = (iso: string) => new Date(iso).getTime()
const tod = (hhmm: string) => new Date(`2000-01-01T${hhmm}:00.000Z`) // time-of-day carrier; the date part is inert

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

    it('all FUTURE timers with no kickoff: expected mirrors planned, drift = 0', () => {
      timers[0].startTime = new Date(THREE_PM)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      for (const t of ts) {
        expect(t.state).toBe('FUTURE')
        expect(t.expected.start).toBe(t.planned.start)
        expect(t.expected.finish).toBe(t.planned.finish)
        expect(t.startDrift).toBe(0)
        expect(t.finishDrift).toBe(0)
        expect(t.memory).toBe(null)
      }
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

  describe('liveGap', () => {
    it('is 0 for the first row and equals gap pre-show', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15)) // 5min scheduled gap
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[0].liveGap).toBe(0)
      expect(ts[1].liveGap).toBe(min(5))
      expect(ts[2].liveGap).toBe(0) // chained
    })

    it('is null when the planned gap is unresolvable pre-show', () => {
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[1].gap).toBe(null)
      expect(ts[1].liveGap).toBe(null)
    })

    it('an armed pointer pre-show does not flip liveGap to live values', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15))
      timeset.timerId = '2'
      timeset.running = false
      timeset.kickoff = THREE_PM
      timeset.lastStop = THREE_PM // armed: parked at the start, not started
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[1].liveGap).toBe(ts[1].gap)
    })

    it('drift eats the buffer: hard-start FUTURE row measures against its anchor', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15)) // 5min planned buffer
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(2) // 2min late
      const now = THREE_PM + min(5)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 expected finish = 12; anchor at 15 → 3min left of the 5min buffer
      expect(ts[1].gap).toBe(min(5))
      expect(ts[1].liveGap).toBe(min(3))
    })

    it('goes negative on a live overlap where expected.start clamps', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].startTime = new Date(THREE_PM + min(15)) // 5min planned buffer
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(8) // 8min late
      const now = THREE_PM + min(10)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 expected finish = 18, anchor at 15 → 3min live overlap; the clamped
      // expected.start (18) could never show it
      expect(ts[1].expected.start).toBe(THREE_PM + min(18))
      expect(ts[1].liveGap).toBe(-min(3))
    })

    it('soft FUTURE rows chain to 0 once the show has started', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5)
      const now = THREE_PM + min(6)
      const ts = createTimestamps(timers, timeset, undefined, now)
      expect(ts[1].liveGap).toBe(0)
      expect(ts[2].liveGap).toBe(0)
    })

    it('a row already run reads the pause actually taken', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '2'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(12)
      const now = THREE_PM + min(13)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM, finish: THREE_PM + min(10), elapsed: min(10) },
          '2': { start: THREE_PM + min(12), finish: null, elapsed: min(1) },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)
      // t2 started at 12, t1 finished at 10 → a 2min pause was actually taken
      expect(ts[1].liveGap).toBe(min(2))
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
    it('DURATION: expected.start = kickoff, drift = kickoff - planned.start', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) // 5min late
      timeset.deadline = THREE_PM + min(15)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(5))
      expect(ts[0].state).toBe('ACTIVE')
      expect(ts[0].expected.start).toBe(THREE_PM + min(5))
      expect(ts[0].expected.duration).toBe(min(10))
      expect(ts[0].expected.finish).toBe(THREE_PM + min(15))
      expect(ts[0].startDrift).toBe(min(5))
      expect(ts[0].finishDrift).toBe(min(5))
    })

    it('armed/reset first cue (not running, lastStop === kickoff): mirrors planned, no stale projection', () => {
      // resetTimer parks the playhead at the start: running=false, lastStop ===
      // kickoff. The kickoff is a reset artifact and `now` is stale. An armed
      // FIRST cue has no upstream to chain from, so it mirrors planned — a
      // not-yet-started show must not read late by (now − plannedStart).
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = false
      timeset.kickoff = THREE_PM + min(5) // reset 5min after the planned start
      timeset.lastStop = THREE_PM + min(5) // === kickoff → armed, never ran
      timeset.deadline = THREE_PM + min(15)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(5))

      expect(ts[0].state).toBe('FUTURE') // armed, not live → FUTURE (identity is timeset.timerId's job)
      expect(ts[0].expected.start).toBe(THREE_PM) // = planned, not the 3:05 kickoff
      expect(ts[0].expected.finish).toBe(THREE_PM + min(10))
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(0)
      expect(ts[1].expected.start).toBe(THREE_PM + min(10)) // downstream stays on plan
      expect(ts[2].expected.finish).toBe(THREE_PM + min(30))
    })

    it('armed later cue mid-show (has memory): chains from prev finish — drift carries, no staleness', () => {
      // Cues 1-2 ran late; the operator armed (reset) cue 3 between cues. The
      // show is live, so the armed cue chains off cue 2's recorded finish (a
      // stable fact) rather than snapping back to plan or reading its stale
      // reset kickoff.
      timers[0].startTime = new Date(THREE_PM) // anchors the planned chain (3:00/3:10/3:20)
      timeset.timerId = '3'
      timeset.running = false
      timeset.kickoff = THREE_PM + min(99) // reset instant is irrelevant — must NOT be used
      timeset.lastStop = THREE_PM + min(99) // === kickoff → armed
      timeset.deadline = THREE_PM + min(109)
      const memory: MemoryInput = { timers: {
        '1': { start: THREE_PM, finish: THREE_PM + min(12), elapsed: min(12) },
        '2': { start: THREE_PM + min(12), finish: THREE_PM + min(25), elapsed: min(13) },
      } }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(99), null, memory)

      expect(ts[2].state).toBe('FUTURE') // armed mid-show → FUTURE, chains from prior finish
      expect(ts[2].expected.start).toBe(THREE_PM + min(25)) // = cue 2's recorded finish, not the 99min kickoff
      expect(ts[2].expected.finish).toBe(THREE_PM + min(35))
      expect(ts[2].startDrift).toBe(min(5)) // planned 3:20 → expected 3:25
    })

    it('DURATION overrunning: expected.finish = now', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const now = THREE_PM + min(12) // 2min overrun
      const ts = createTimestamps(timers, timeset, undefined, now)
      expect(ts[0].expected.finish).toBe(now)
      expect(ts[0].finishDrift).toBe(min(2))
    })

    it('FUTURE timer after ACTIVE: drift chains through', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) // 5min late
      const now = THREE_PM + min(7)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 expected: start=5, duration=10, finish=15
      // t2 planned.start = prev.planned.finish = THREE_PM + 10
      // t2 expected.start (non-linked) = max(prev.expected.finish=15, planned.start=10) = 15
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].expected.start).toBe(THREE_PM + min(15))
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
      // t1 expected: start=8, duration=10, finish=18
      // t2 planned.start = THREE_PM + 15. expected.start = max(18, 15) = 18
      // drift = 18 - 15 = 3min (gap of 5min absorbed 5 of 8 min drift)
      expect(ts[1].expected.start).toBe(THREE_PM + min(18))
      expect(ts[1].startDrift).toBe(min(3))
    })

    it('paused + jump fwd: projection slides earlier as the playhead burns through duration', () => {
      // Operator started 5min late, paused at 1min in, then jumped fwd 2min
      // while still paused. movePlayhead leaves kickoff alone and shifts
      // lastStop forward (lastStop = kickoff + 3min). The projection must use
      // lastStop, not kickoff, or the chain freezes — bug T2-16.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = false
      timeset.kickoff = THREE_PM + min(5) // started 5min late
      timeset.lastStop = THREE_PM + min(8) // playhead now at 3min in (1 ran, 2 jumped)
      const memory = {
        timers: {
          '1': { start: THREE_PM + min(5), finish: null, elapsed: min(1) },
        },
      }
      const now = THREE_PM + min(6) // 1min after first press, paused since
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)
      // History on the active row: memory.start = +5:00 drift
      expect(ts[0].expected.start).toBe(THREE_PM + min(5))
      expect(ts[0].startDrift).toBe(min(5))
      // Projection: now + duration − (lastStop − kickoff) = 6 + 10 − 3 = 13
      // (vs the bug: kickoff + duration = 15, frozen against jumps)
      expect(ts[0].expected.finish).toBe(THREE_PM + min(13))
      // Downstream chains from the new projection
      expect(ts[1].expected.start).toBe(THREE_PM + min(13))
      expect(ts[1].startDrift).toBe(min(3))
    })

    it('after a pause-and-jump, "what time did we actually start" sticks; only the projected finish moves', () => {
      // The original first-press was 5:00 late. Operator paused, jumped 30s
      // forward, resumed — kickoff slid to 5:30 late. The active row's
      // start drift must still read +5:00 (the real history, kept in
      // memory.start), but its finish — and every downstream row's
      // start — must reflect where the playhead is now (+5:30).
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) + 30_000 // 5:30 late after jump
      const memory = {
        timers: {
          '1': { start: THREE_PM + min(5), finish: null, elapsed: min(2) },
        },
      }
      const now = THREE_PM + min(7)
      const ts = createTimestamps(timers, timeset, undefined, now, null, memory)
      // History on the active row: memory.start, +5:00 drift
      expect(ts[0].expected.start).toBe(THREE_PM + min(5))
      expect(ts[0].startDrift).toBe(min(5))
      // Projection on the active row: kickoff + duration, +5:30 drift
      expect(ts[0].expected.finish).toBe(THREE_PM + min(15) + 30_000)
      expect(ts[0].finishDrift).toBe(min(5) + 30_000)
      // Downstream chains from the projection, not the history
      expect(ts[1].expected.start).toBe(THREE_PM + min(15) + 30_000)
      expect(ts[1].startDrift).toBe(min(5) + 30_000)
    })

  })

  describe('FINISH_TIME anchoring in expected chain', () => {
    it('FUTURE FINISH_TIME absorbs drift up to duration, expected.finish stays = planned.finish', () => {
      timers[0].startTime = new Date(THREE_PM)
      timers[1].type = 'FINISH_TIME'
      timers[1].finishTime = new Date(THREE_PM + min(25)) // t2: 10-25 planned (15 min duration)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(10) // 10min late
      const now = THREE_PM + min(11)
      const ts = createTimestamps(timers, timeset, undefined, now)
      // t1 expected: 10-20. t2 expected.start = max(t1.finish, t1.planned.finish) = max(20, 10) = 20
      // t2 expected.finish = max(planned.finish=25, expected.start=20) = 25
      // t2 expected.duration = 25 - 20 = 5 (absorbed 10min from 15min)
      expect(ts[1].expected.start).toBe(THREE_PM + min(20))
      expect(ts[1].expected.finish).toBe(THREE_PM + min(25))
      expect(ts[1].expected.duration).toBe(min(5))
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
      // t1 expected: 10-20. t2 expected.start = max(20, 10) = 20
      // t2 expected.finish = max(planned=15, expected.start=20) = 20
      // t2 expected.duration = max(0, 20-20) = 0 (clamped)
      expect(ts[1].expected.start).toBe(THREE_PM + min(20))
      expect(ts[1].expected.finish).toBe(THREE_PM + min(20))
      expect(ts[1].expected.duration).toBe(0)
      expect(ts[1].finishDrift).toBe(min(5)) // overflow drift propagates
    })
  })

  describe('PAST with memory', () => {
    it('populates expected from memory entry, drift based on planned', () => {
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
      // Settled row: `expected` passes through the facts, so it equals `memory`.
      expect(ts[0].memory).toEqual({ start: THREE_PM + min(2), finish: THREE_PM + min(12), elapsed: min(10) })
      expect(ts[0].expected.start).toBe(THREE_PM + min(2))
      expect(ts[0].expected.finish).toBe(THREE_PM + min(12))
      expect(ts[0].expected.duration).toBe(min(10))
      expect(ts[0].startDrift).toBe(min(2))
    })

    it('skipped PAST (positionally past, no memory) chains from prev, drift = 0', () => {
      // Active is timer 3, timer 1 and 2 have no memory entries (skipped).
      // State is positional → t1 and t2 are PAST; null memory flags them as unrun.
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
      expect(ts[0].memory).toBe(null)
      expect(ts[1].state).toBe('PAST')
      expect(ts[1].memory).toBe(null)
      expect(ts[0].startDrift).toBe(0)
      expect(ts[1].startDrift).toBe(0)
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

      // B — FUTURE. The two channels diverge here: `memory` still holds the
      // prior pass's facts, while `expected` projects the *next* run. This is
      // exactly why settledness can't be read off `memory !== null`.
      expect(ts[1].state).toBe('FUTURE')
      expect(ts[1].memory).toEqual({ start: THREE_PM + min(10), finish: THREE_PM + min(20), elapsed: min(10) })
      // Projects from active A: kickoff 3:30 + 10min = 3:40
      expect(ts[1].expected.start).toBe(THREE_PM + min(40))
      expect(ts[1].expected.finish).toBe(THREE_PM + min(50))
      expect(ts[1].expected.duration).toBe(min(10))

      // C — FUTURE, same treatment
      expect(ts[2].state).toBe('FUTURE')
      expect(ts[2].memory?.finish).toBe(THREE_PM + min(30))
      expect(ts[2].expected.start).toBe(THREE_PM + min(50))
      expect(ts[2].expected.finish).toBe(THREE_PM + min(60))

      // The trap: `memory.start ?? expected.start` looks like a safe
      // "prefer the fact" read, and is wrong here — it returns last pass's
      // 3:10 for a cue that runs at 3:40. `memory` is stale exactly when
      // state is FUTURE; read `expected` for the timeline.
      expect(ts[1].memory?.start ?? ts[1].expected.start).toBe(THREE_PM + min(10)) // stale!
      expect(ts[1].expected.start).toBe(THREE_PM + min(40)) // correct
    })

    it('paused PAST timer: expected.duration is wall-clock (finish - start), not elapsed', () => {
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
      expect(ts[0].memory?.elapsed).toBe(min(3)) // resume layer, untouched by the schedule layer
      expect(ts[0].expected.start).toBe(THREE_PM)
      expect(ts[0].expected.finish).toBe(THREE_PM + min(20))
      expect(ts[0].expected.duration).toBe(min(20)) // wall-clock, NOT elapsed (3min)
      expect(ts[0].finishDrift).toBe(min(10)) // planned was 10min, slot took 20min
    })

    it('no active cue (deleted or null): every row FUTURE, chain re-projects from the plan', () => {
      // Deleting the active cue leaves `timerId` dangling at a timer that is
      // no longer in the list (the delete path stops the timer but never
      // clears the pointer). With nothing to be positional about, the chain
      // reads exactly as it would pre-show — the plan — even though cue 1
      // really ran 5min late. Deliberate: the state is destructive and blanks
      // the output, so the timestamps agree rather than half-projecting off
      // history. The facts survive on `memory` for consumers that read it.
      timers[0].startTime = new Date(THREE_PM)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM + min(5), finish: THREE_PM + min(15), elapsed: min(10) },
        },
      }
      const now = THREE_PM + min(16)

      for (const timerId of ['99', null]) { // '99' = dangling, null = none
        const ts = createTimestamps(
          timers,
          { ...timeset, timerId, running: false, kickoff: THREE_PM + min(5), lastStop: now },
          undefined, now, null, memory,
        )
        expect(ts.every(t => t.state === 'FUTURE')).toBe(true)
        // Chain forgets the 5min: projects the plan.
        expect(ts[0].expected.start).toBe(THREE_PM)
        expect(ts[0].startDrift).toBe(0)
        // ...but the fact is still right there.
        expect(ts[0].memory?.start).toBe(THREE_PM + min(5))
      }
    })

    it('ACTIVE cue: memory carries the fact start, expected carries the projected finish', () => {
      // The hybrid row, and the reason facts are tracked per field: `start` is
      // a fact (it really started at 3:02) while `finish` is still a projection
      // (it hasn't stopped). The old `hasMemory` boolean keyed on `finish`, so
      // it read false here — indistinguishable from a cue that never ran.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(2)
      const memory: MemoryInput = {
        timers: {
          '1': { start: THREE_PM + min(2), finish: null, elapsed: 0 },
        },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(5), null, memory)
      expect(ts[0].state).toBe('ACTIVE')
      // Fact: started, not stopped.
      expect(ts[0].memory?.start).toBe(THREE_PM + min(2))
      expect(ts[0].memory?.finish).toBe(null)
      // Forecast: 10min duration from a 3:02 kickoff → 3:12.
      expect(ts[0].expected.start).toBe(THREE_PM + min(2))
      expect(ts[0].expected.finish).toBe(THREE_PM + min(12))
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
      // finishDrift = expected.finish (3PM+13) - planned.finish (3PM+20) = -7min
      expect(ts[0].finishDrift).toBe(-min(7))
    })
  })



  // Before the show starts, pointing at a cue is just pointing: nothing has
  // run, so the earlier rows were never skipped, and the projection must not
  // change just because the pointer moved.
  describe('pre-show: pointer position does not fabricate history', () => {
    it('arming a later cue pre-show: expected mirrors the plan, expected end stays the plan end', () => {
      // The bug: pre-show (no memory, cue merely armed), arming cue 3 marked
      // cues 1-2 as skipped-in-zero-seconds and started cue 3's projection at
      // cue 2's planned start — the expected end read exactly cue 2's
      // duration short, and jumped around as the pointer moved.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '3'
      timeset.running = false
      timeset.kickoff = THREE_PM + min(99) // reset artifact, must not be read
      timeset.lastStop = THREE_PM + min(99) // === kickoff → armed
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))

      expect(ts[0].state).toBe('PAST') // state stays positional (list dimming)
      expect(ts[1].state).toBe('PAST')
      expect(ts[2].state).toBe('FUTURE') // armed → FUTURE
      for (const t of ts) {
        expect(t.expected.start).toBe(t.planned.start)
        expect(t.expected.finish).toBe(t.planned.finish)
        expect(t.expected.duration).toBe(t.planned.duration)
        expect(t.startDrift).toBe(0)
        expect(t.finishDrift).toBe(0)
      }
      // The armed cue projects at its OWN planned start, not cue 2's.
      expect(ts[2].expected.start).toBe(THREE_PM + min(20))
      expect(ts[2].expected.finish).toBe(THREE_PM + min(30)) // = plan end
    })

    it('pre-show projection is invariant under pointer position', () => {
      timers[0].startTime = new Date(THREE_PM)
      const arm = (timerId: string | null) => createTimestamps(
        timers,
        makeTimeset({ timerId, running: false, kickoff: THREE_PM + min(99), lastStop: THREE_PM + min(99) }),
        undefined,
        THREE_PM - min(30),
      ).map((t) => t.expected)
      const base = arm(null)
      expect(arm('1')).toEqual(base)
      expect(arm('2')).toEqual(base)
      expect(arm('3')).toEqual(base)
    })
  })

  // Reverse walk: as soon as ANY hard time exists in the rundown (a hard
  // `startTime`, or FINISH_TIME with `finishTime`), the chain walks BACKWARD
  // from each downstream anchor to fill in soft `planned.start`/`finish` for
  // the timers before it. "To land on this anchor, start here."
  //
  // Step: prev.finish = next.start; prev.start = prev.finish - prev.duration.
  // Forward wins on collisions. Walk halts at: top of rundown, FINISH_TIME
  // without finishTime (variable duration), or another upstream hard
  // `startTime` (which becomes its own backward anchor).
  describe('reverse walk: soft starts derived from downstream anchors', () => {
    // Default case: a single hard startTime on the last row reverse-fills
    // every earlier soft row.
    it('hard startTime on last row reverse-fills all earlier rows', () => {
      timeset.timerId = null
      timers[2].startTime = new Date(THREE_PM + min(20))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      // t3: own anchor.
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(30))
      // t2: finish = t3.start; start = finish - 10min.
      expect(ts[1].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      // t1: finish = t2.start; start = finish - 10min.
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[0].planned.start).toBe(THREE_PM)
    })

    // Hard startTime mid-chain: forward radiates downstream, reverse fills
    // the soft rows upstream of it.
    it('hard startTime mid-chain: forward downstream, reverse upstream', () => {
      timeset.timerId = null
      timers[1].startTime = new Date(THREE_PM + min(15))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      // Forward from t2.
      expect(ts[1].planned.start).toBe(THREE_PM + min(15))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(25))
      expect(ts[2].planned.start).toBe(THREE_PM + min(25))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(35))
      // Reverse fills t1.
      expect(ts[0].planned.finish).toBe(THREE_PM + min(15))
      expect(ts[0].planned.start).toBe(THREE_PM + min(5))
    })

    // Reverse walk halts at an upstream hard startTime — that anchor becomes
    // its own backward source instead of being overwritten. Earlier rows get
    // reverse-filled from THAT anchor, not the further-downstream one.
    it('reverse halts at upstream hard startTime; that anchor seeds its own walk', () => {
      const fourTimers: TimerInput[] = [
        makeTimer({ _id: '1' }),
        makeTimer({ _id: '2', startTime: new Date(THREE_PM + min(20)) }),
        makeTimer({ _id: '3' }),
        makeTimer({ _id: '4', startTime: new Date(THREE_PM + min(60)) }),
      ]
      timeset.timerId = null
      const ts = createTimestamps(fourTimers, timeset, undefined, THREE_PM - min(30))
      // Forward from t2: t2 = 20–30, t3 = 30–40, t4 = own anchor (20-min gap).
      expect(ts[1].planned.start).toBe(THREE_PM + min(20))
      expect(ts[2].planned.start).toBe(THREE_PM + min(30))
      expect(ts[3].planned.start).toBe(THREE_PM + min(60))
      // Reverse from t4 hits t2 (hard startTime), halts. Reverse from t2
      // fills t1 — t1.finish = t2.start, t1.start = finish - 10min.
      expect(ts[0].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[0].planned.start).toBe(THREE_PM + min(10))
    })

    // Canonical "set end time" case: FINISH_TIME with finishTime on the
    // last row anchors planned.finish; the row's configured H/M/S provides
    // the slot duration the reverse walk subtracts.
    it('FINISH_TIME-with-finishTime on last row anchors reverse walk', () => {
      timeset.timerId = null
      timers[2].type = 'FINISH_TIME'
      timers[2].finishTime = new Date(THREE_PM + min(30))
      // t3.minutes = 10 (default).
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(30))
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[0].planned.start).toBe(THREE_PM)
    })

    // Reverse-derived planned values feed the expected chain like any other
    // planned values: FUTURE timers with no kickoff mirror them, drift = 0.
    it('reverse-derived planned values flow into expected chain', () => {
      timeset.timerId = null
      timers[2].startTime = new Date(THREE_PM + min(20))
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(ts[0].state).toBe('FUTURE')
      expect(ts[0].expected.start).toBe(THREE_PM)
      expect(ts[0].expected.finish).toBe(THREE_PM + min(10))
      expect(ts[0].startDrift).toBe(0)
      expect(ts[0].finishDrift).toBe(0)
    })
  })

  // `target` (7th param) is the show-level target end. It seeds the reverse
  // walk as a virtual anchor past the last row: an otherwise anchor-less
  // rundown gets back times on every row ("start here to land on target").
  // Forward-filled rows always win.
  describe('targetEnd: virtual show-end anchor', () => {
    it('anchor-less rundown: every row reverse-fills from targetEnd', () => {
      timeset.timerId = null
      const targetEnd = THREE_PM + min(30)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, { frozen: targetEnd })
      // 3 × 10min back from the target.
      expect(ts[2].planned.finish).toBe(targetEnd)
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[1].planned.finish).toBe(THREE_PM + min(20))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[0].planned.start).toBe(THREE_PM)
    })

    it('null targetEnd: anchor-less rundown keeps honest nulls', () => {
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, null)
      for (const t of ts) {
        expect(t.planned.start).toBeNull()
        expect(t.planned.finish).toBeNull()
      }
    })

    it('forward wins: forward-filled rows are not overwritten by targetEnd', () => {
      timeset.timerId = null
      timers[0].startTime = new Date(THREE_PM)
      // Target 15min later than the forward chain's natural end.
      const targetEnd = THREE_PM + min(45)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, { frozen: targetEnd })
      // Forward chain from t1's anchor stands; targetEnd changes nothing.
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(30))
    })

    it('hard startTime mid-chain: trailing rows forward-fill, leading rows reverse-fill from the hard anchor, not targetEnd', () => {
      timeset.timerId = null
      timers[1].startTime = new Date(THREE_PM + min(15))
      const targetEnd = THREE_PM + min(60)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, { frozen: targetEnd })
      // Forward from t2 fills t2 + t3 — targetEnd cannot touch them.
      expect(ts[1].planned.start).toBe(THREE_PM + min(15))
      expect(ts[2].planned.finish).toBe(THREE_PM + min(35))
      // t1 reverse-fills from t2's hard anchor (nearest downstream wall).
      expect(ts[0].planned.finish).toBe(THREE_PM + min(15))
      expect(ts[0].planned.start).toBe(THREE_PM + min(5))
    })

    it('resolvable over/under: late kickoff in an anchor-less show drifts against the target', () => {
      // No hard times anywhere; target end frozen at 3PM+30. Show kicks off
      // 5min behind the back-walked plan — drift is finally non-zero
      // (against a derived end it was structurally 0).
      const targetEnd = THREE_PM + min(30)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM + min(5) // back time said start at THREE_PM
      const now = THREE_PM + min(6)
      const ts = createTimestamps(timers, timeset, undefined, now, null, {}, { frozen: targetEnd })
      expect(ts[0].planned.start).toBe(THREE_PM) // back-walked from target
      expect(ts[0].startDrift).toBe(min(5))
      // Projection lands the show 5min past the target.
      expect(ts[2].planned.finish).toBe(targetEnd)
      expect(ts[2].expected.finish).toBe(targetEnd + min(5))
      expect(ts[2].finishDrift).toBe(min(5))
    })

    it('white target: lands on the room date when no cue precedes it, and the chain back-fills from it', () => {
      timeset.timerId = null
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15', {},
        { time: tod('18:00') })
      const target = at('2024-06-15T18:00:00.000Z')
      expect(ts[2].planned.finish).toBe(target)
      expect(ts[2].planned.start).toBe(target - min(10))
      expect(ts[1].planned.finish).toBe(target - min(10))
      expect(ts[1].planned.start).toBe(target - min(20))
      expect(ts[0].planned.finish).toBe(target - min(20))
      expect(ts[0].planned.start).toBe(target - min(30))
    })

    it('white time wins over frozen gray', () => {
      timeset.timerId = null
      const white = THREE_PM + min(45)
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), null, {},
        { time: new Date(white), frozen: THREE_PM + min(30) })
      expect(ts[2].planned.finish).toBe(white)
    })

    it('reverse-derived back times flow into expected chain pre-kickoff (drift 0)', () => {
      timeset.timerId = null
      const targetEnd = THREE_PM + min(30)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, { frozen: targetEnd })
      for (const t of ts) {
        expect(t.state).toBe('FUTURE')
        expect(t.expected.start).toBe(t.planned.start)
        expect(t.expected.finish).toBe(t.planned.finish)
        expect(t.startDrift).toBe(0)
        expect(t.finishDrift).toBe(0)
      }
    })
  })

  // A typed time is a time-of-day; the date it lands on follows from its
  // position in the rundown. Worked examples from timing-v2-days.md.
  describe('the rundown never runs backwards', () => {
    const roomDate = '2026-09-03'
    const now = at('2026-09-02T12:00:00.000Z')
    const cue = (_id: string, start: string | null, hours: number, minutes = 0) =>
      makeTimer({ _id, hours, minutes, startTime: start ? tod(start) : null })
    const eod = (_id: string, time: string | null, beforeTimerId: string | null): MarkerInput =>
      ({ _id, type: 'END_OF_DAY', time: time ? tod(time) : null, beforeTimerId })
    const plan = (cues: TimerInput[], target: { time: Date } | null = null, markers: MarkerInput[] = []) =>
      createTimestamps(cues, makeTimeset({ timerId: null }), 'UTC', now, roomDate, {}, target, markers)

    it('segment 1 anchors on room date midnight: a first cue typed 00:30 runs on the room date', () => {
      const ts = plan([cue('1', '00:30', 1)])
      expect(ts[0].planned.start).toBe(at('2026-09-03T00:30:00.000Z'))
    })

    it('a dateless room anchors on today\'s midnight, even when that time of day has passed', () => {
      const ts = createTimestamps([cue('1', '09:00', 1)], makeTimeset({ timerId: null }), 'UTC', at('2026-09-02T20:00:00.000Z'), null)
      expect(ts[0].planned.start).toBe(at('2026-09-02T09:00:00.000Z'))
    })

    it('a countdown to the show: a room dated weeks ahead needs no offset', () => {
      const ts = createTimestamps([cue('1', '09:00', 1)], makeTimeset({ timerId: null }), 'UTC', now, '2026-09-22')
      expect(ts[0].planned.start).toBe(at('2026-09-22T09:00:00.000Z'))
    })

    it('a start typed earlier than the segment start lands the same day — an overlap, not the next day', () => {
      const ts = plan([cue('1', '10:00', 1), cue('2', '10:45', 0, 30)])
      expect(ts[1].planned.start).toBe(at('2026-09-03T10:45:00.000Z'))
      expect(ts[1].gap).toBe(-min(15))
    })

    it('a start typed before the day\'s first cue rolls to the next day: 23:30 then 00:15 is the next morning', () => {
      const ts = plan([cue('1', '23:30', 1), cue('2', '00:15', 0, 30)])
      expect(ts[1].planned.start).toBe(at('2026-09-04T00:15:00.000Z'))
      expect(ts[1].gap).toBe(-min(15))
    })

    it('FINISH_TIME: a finish typed past midnight lands on the next date, even on the day\'s first cue', () => {
      const loadIn = makeTimer({ _id: '1', type: 'FINISH_TIME', startTime: tod('22:00'), finishTime: tod('01:00') })
      const ts = plan([loadIn])
      expect(ts[0].planned.finish).toBe(at('2026-09-04T01:00:00.000Z'))
      expect(ts[0].planned.duration).toBe(min(180))
    })

    it('FINISH_TIME: a finish counts from the segment start, so a slipped start reads as an overlap, not a day', () => {
      const lunch = makeTimer({ _id: '2', type: 'FINISH_TIME', finishTime: tod('13:00') })
      const ts = plan([cue('1', '12:00', 1, 30), lunch])
      expect(ts[1].planned.start).toBe(at('2026-09-03T13:30:00.000Z'))
      expect(ts[1].planned.finish).toBe(at('2026-09-03T13:00:00.000Z'))
      expect(ts[1].planned.duration).toBe(-min(30))
    })

    it('a marker resolves after its segment\'s start, never before the cues it closes; the cue below anchors on it', () => {
      const ts = plan([cue('1', '10:00', 1), cue('2', '11:00', 1)], null, [eod('m1', '09:00', '2')])
      expect(ts[0].segmentEnd).toBe(at('2026-09-04T09:00:00.000Z'))
      expect(ts[1].planned.start).toBe(at('2026-09-04T11:00:00.000Z'))
    })

    it('an untyped marker hands the previous finish on: a typed start below it that has passed rolls to the next day', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', '21:30', 0, 30), cue('3', '21:45', 0, 30)], null, [eod('m1', null, '3')])
      expect(ts[2].planned.start).toBe(at('2026-09-04T21:45:00.000Z'))
    })

    it('an untyped marker keeps the chain: a soft cue below it starts at the previous finish', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 30)], null, [eod('m1', null, '2')])
      expect(ts[1].planned.start).toBe(at('2026-09-03T21:30:00.000Z'))
    })

    it('a typed marker is a wall: a soft cue below it has no start until its day names one', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', '21:30', 0, 30), cue('3', null, 0, 35), cue('4', null, 0, 10)], null, [eod('m1', '01:30', '3')])
      expect(ts[2].planned.start).toBeNull()
      expect(ts[2].planned.finish).toBeNull()
      expect(ts[3].planned.start).toBeNull()
      expect(ts[2].segmentEnd).toBeNull()
    })

    it('the day below a wall anchors itself like a room: forward from a typed first cue', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', '09:00', 0, 35), cue('3', null, 0, 10)], null, [eod('m1', '01:30', '2')])
      expect(ts[1].planned.start).toBe(at('2026-09-04T09:00:00.000Z'))
      expect(ts[2].planned.start).toBe(at('2026-09-04T09:35:00.000Z'))
    })

    it('the day below a wall anchors itself like a room: backward from its own typed end', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 35), cue('3', null, 0, 10)], null, [eod('m1', '01:30', '2'), eod('m2', '22:00', null)])
      expect(ts[2].planned.finish).toBe(at('2026-09-04T22:00:00.000Z'))
      expect(ts[1].planned.start).toBe(at('2026-09-04T21:15:00.000Z'))
    })

    it('the day below a wall anchors itself like a room: out from a typed middle cue', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 35), cue('3', '10:00', 0, 10), cue('4', null, 0, 10)], null, [eod('m1', '01:30', '2')])
      expect(ts[1].planned.start).toBe(at('2026-09-04T09:25:00.000Z'))
      expect(ts[2].planned.start).toBe(at('2026-09-04T10:00:00.000Z'))
      expect(ts[3].planned.start).toBe(at('2026-09-04T10:10:00.000Z'))
    })

    it('a day cannot end when it begins: two day ends typed the same time are 24h apart', () => {
      const markers = [eod('m1', '01:30', '2'), eod('m2', '01:30', '3')]
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 35), cue('3', null, 0, 10)], null, markers)
      expect(ts[0].segmentEnd).toBe(at('2026-09-04T01:30:00.000Z'))
      expect(ts[1].segmentEnd).toBe(at('2026-09-05T01:30:00.000Z'))
      // Day 2 fills back from its own end; day 3 has no end and no start.
      expect(ts[1].planned.finish).toBe(at('2026-09-05T01:30:00.000Z'))
      expect(ts[2].planned.start).toBeNull()
    })

    it('the next day\'s end lands within 24h of its start: later on the clock stays, earlier rolls', () => {
      const day2 = (end: string) => plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 35)], null, [eod('m1', '03:00', '2'), eod('m2', end, null)])[1].segmentEnd
      expect(day2('22:00')).toBe(at('2026-09-04T22:00:00.000Z')) // 19h
      expect(day2('01:30')).toBe(at('2026-09-05T01:30:00.000Z')) // 22.5h
    })

    it('a typed first cue is the day\'s start: its end typed earlier on the clock lands the next morning', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', '09:00', 3)], null, [eod('m1', '02:00', '2'), eod('m2', '05:00', null)])
      expect(ts[1].planned.start).toBe(at('2026-09-04T09:00:00.000Z'))
      expect(ts[1].segmentEnd).toBe(at('2026-09-05T05:00:00.000Z'))
    })

    it('the target closes the last day the same way: typed at the day\'s start, it is a day away', () => {
      const ts = plan([cue('1', '21:00', 0, 30), cue('2', null, 0, 35)], { time: tod('01:30') }, [eod('m1', '01:30', '2')])
      expect(ts[1].segmentEnd).toBe(at('2026-09-05T01:30:00.000Z'))
    })

    it('a typed marker absorbs the overrun above it: the next day does not inherit it', () => {
      const ts = plan([cue('1', '01:00', 1), cue('2', '09:00', 0, 30)], null, [eod('m1', '01:30', '2')])
      expect(ts[0].planned.finish).toBe(at('2026-09-03T02:00:00.000Z'))
      expect(ts[0].segmentEnd).toBe(at('2026-09-03T01:30:00.000Z'))
      expect(ts[1].planned.start).toBe(at('2026-09-03T09:00:00.000Z'))
    })

    it('two markers typed 02:30 with a 01:00 hard start between them', () => {
      const markers = [eod('m1', '02:30', '2'), eod('m2', '02:30', null)]
      const ts = plan([cue('1', '20:00', 1), cue('2', '01:00', 1)], null, markers)
      expect(ts[0].segmentEnd).toBe(at('2026-09-04T02:30:00.000Z'))
      expect(ts[1].planned.start).toBe(at('2026-09-05T01:00:00.000Z'))
      expect(ts[1].segmentEnd).toBe(at('2026-09-05T02:30:00.000Z'))
    })

    it('a marker at the top of the list anchors on room date midnight, and segment 2 anchors on it', () => {
      const ts = plan([cue('1', '07:00', 1)], null, [eod('m1', '08:00', '1')])
      expect(ts[0].segmentIndex).toBe(1)
      expect(ts[0].planned.start).toBe(at('2026-09-04T07:00:00.000Z'))
    })

    it('the target anchors on the last segment\'s start: an overnight show end lands on the next date', () => {
      const ts = plan([cue('1', '23:00', 0, 30)], { time: tod('01:30') })
      expect(ts[0].segmentEnd).toBe(at('2026-09-04T01:30:00.000Z'))
    })

    it('Lukas\'s staging room: three show days on one evening', () => {
      // Intro 21:00, Keynote 21:30, untyped End of day 1, Questions chained,
      // End of day 2 typed 1:30 AM, Retro chained, End of show typed 11:30 PM.
      const markers = [eod('m1', null, '3'), eod('m2', '01:30', '4')]
      const ts = plan(
        [cue('1', '21:00', 0, 30), cue('2', '21:30', 0, 30), cue('3', null, 0, 35), cue('4', null, 0, 10)],
        { time: tod('23:30') },
        markers,
      )
      expect(ts.map(t => t.segmentIndex)).toEqual([0, 0, 1, 2])
      // Questions chains off Keynote under the untyped marker and ends 22:35;
      // its day ends 1:30 the next morning, 2h55m later.
      expect(ts[2].planned.finish).toBe(at('2026-09-03T22:35:00.000Z'))
      expect(ts[2].segmentEnd! - ts[2].planned.finish!).toBe(min(175))
      // Day 3 has no start of its own. The show end typed 23:30 is the first
      // one after day 2's end, and Retro fills back from it.
      expect(ts[3].segmentEnd).toBe(at('2026-09-04T23:30:00.000Z'))
      expect(ts[3].planned.start).toBe(at('2026-09-04T23:20:00.000Z'))
      expect(ts[3].segmentEnd! - ts[3].planned.finish!).toBe(0)
    })

    it('accepted: typed times inside a long segment resolve within 24h of its start, the rows above show as overlap', () => {
      const ts = plan([cue('1', '09:00', 8), cue('2', null, 8), cue('3', null, 8), cue('4', '10:00', 1)])
      expect(ts[2].planned.finish).toBe(at('2026-09-04T09:00:00.000Z'))
      expect(ts[3].planned.start).toBe(at('2026-09-03T10:00:00.000Z'))
      expect(ts[3].gap).toBe(-min(23 * 60))
    })
  })

  describe('timezone + roomDate handling', () => {
    it('applies roomDate to startTime anchored times', () => {
      timers[0].startTime = '2022-01-01T15:00:00.000Z'
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15')
      expect(new Date(ts[0].planned.start).toISOString()).toBe('2024-06-15T15:00:00.000Z')
    })

    it('FINISH_TIME with roomDate', () => {
      timers[0].type = 'FINISH_TIME'
      timers[0].finishTime = '2022-01-01T15:30:00.000Z'
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), '2024-06-15')
      expect(new Date(ts[0].planned.finish).toISOString()).toBe('2024-06-15T15:30:00.000Z')
    })
  })

  // Regression tests ported from the legacy client-side createTimestamps suite.
  // Each captures a real production bug in date-boundary handling. The new impl
  // uses the same `parseDateAsToday` / `applyDate` primitives, so these bugs
  // remain reachable and must stay tested.
  describe('regression: date-boundary bugs', () => {
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
      // A first cue's finish counts from its own start and cannot invert, so
      // the inverted cue sits second, under a cue that opens the segment.
      timers = [makeTimer({ _id: '0', startTime: new Date(THREE_PM - min(30)) }), ...timers]
      timers[1].type = 'FINISH_TIME'
      timers[1].startTime = new Date(THREE_PM)
      timers[1].finishTime = new Date(THREE_PM - 10 * 60_000) // 10 min before startTime
      timeset.timerId = timers[1]._id
      timeset.kickoff = THREE_PM
      timeset.lastStop = THREE_PM
      timeset.running = true
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM)
      expect(ts[1].planned.duration).toBe(-10 * 60_000)
      // Active FINISH_TIME anchor absorbs up to its (negative-capacity) duration.
      // Drift surfaces as startDrift on the next row — bounded by the inversion.
      const inheritedDrift = ts[2].startDrift
      expect(inheritedDrift).toBeGreaterThanOrEqual(0)
      expect(inheritedDrift).toBeLessThanOrEqual(10 * 60_000)
      // Downstream row does not amplify drift — it inherits the same bounded value.
      expect(ts[3].startDrift).toBe(inheritedDrift)
    })
  })

  // The front wall (R38): once the run has memory, the first row in list
  // order with a recorded start pins its planned start to that fact — but
  // only when no planning anchor reaches the row. Fact fills holes, never
  // overrides planning. The pin forward-fills downstream, so edits propagate
  // downstream only; the reverse walk only fills the segment above the wall.
  describe('front wall: planned chain clamped on the recorded show start', () => {
    it('anchor-less show: wall pins planned.start to the recorded start, chain forward-fills', () => {
      timeset.timerId = '1'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM, finish: null, elapsed: 0 } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(2), null, memory)
      expect(ts[0].pinnedStart).toBe(true)
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].planned.finish).toBe(THREE_PM + min(10))
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[2].planned.start).toBe(THREE_PM + min(20))
      expect(ts[1].pinnedStart).toBe(false)
      expect(ts[2].pinnedStart).toBe(false)
      // Anchor-row drift is 0 by construction — the accepted, minimal tautology.
      expect(ts[0].startDrift).toBe(0)
    })

    it('regression: editing a future cue cannot move planned starts at or above the edit', () => {
      // The original bug: with no hard anchor, the whole planned chain was
      // reverse-filled from the (kickoff-frozen) target end, so extending a
      // future cue telescoped every planned start upward through past rows.
      timeset.timerId = '1'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM, finish: null, elapsed: 0 } },
      }
      const target = { frozen: THREE_PM + min(30) }
      const before = createTimestamps(timers, timeset, undefined, THREE_PM + min(2), null, memory, target)

      timers[2].minutes = 20 // extend the last cue by 10min
      const after = createTimestamps(timers, timeset, undefined, THREE_PM + min(2), null, memory, target)

      expect(after[0].planned.start).toBe(before[0].planned.start)
      expect(after[1].planned.start).toBe(before[1].planned.start)
      expect(after[2].planned.start).toBe(before[2].planned.start)
      // The excess lands downstream: the plan end overshoots the frozen target.
      expect(after[2].planned.finish).toBe(before[2].planned.finish + min(10))
      expect(after[2].planned.finish).toBe(target.frozen + min(10))
    })

    it('show started mid-list: rows above the wall get back-timed advisory starts, no pin', () => {
      timeset.timerId = '2'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '2': { start: THREE_PM, finish: null, elapsed: 0 } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(1), null, memory)
      // Wall is row 1; row 0 back-times off the pin ("you'd have needed to start here").
      expect(ts[1].pinnedStart).toBe(true)
      expect(ts[1].planned.start).toBe(THREE_PM)
      expect(ts[0].pinnedStart).toBe(false)
      expect(ts[0].planned.start).toBe(THREE_PM - min(10))
      expect(ts[0].planned.finish).toBe(THREE_PM)
      // The plan keeps its duration; only `expected` collapses the skipped row.
      expect(ts[0].planned.duration).toBe(min(10))
      expect(ts[0].expected.finish).toBe(ts[0].expected.start)
      expect(ts[0].memory).toBe(null)
    })

    it('soft-first/hard-second: pre-show back-times off the anchor, mid-show the wall pins', () => {
      timers[1].startTime = new Date(THREE_PM + min(15))

      // Pre-show: cue 1 back-times off cue 2's hard start.
      const pre = createTimestamps(timers, timeset, undefined, THREE_PM - min(30))
      expect(pre[0].planned.start).toBe(THREE_PM + min(5))
      expect(pre[0].pinnedStart).toBe(false)

      // Mid-show: the wall pins cue 1 at its recorded start — its planned
      // start no longer slides under its own duration edits.
      timeset.timerId = '1'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM, finish: null, elapsed: 0 } },
      }
      const mid = createTimestamps(timers, timeset, undefined, THREE_PM + min(1), null, memory)
      expect(mid[0].pinnedStart).toBe(true)
      expect(mid[0].planned.start).toBe(THREE_PM)
      expect(mid[1].planned.start).toBe(THREE_PM + min(15)) // hard anchor untouched

      timers[0].minutes = 20 // pre-fix this back-timed the start 10min earlier
      const edited = createTimestamps(timers, timeset, undefined, THREE_PM + min(1), null, memory)
      expect(edited[0].planned.start).toBe(THREE_PM)
    })

    it('planning wins: a wall row with its own startTime is never pinned — drift is measured', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM + min(2), finish: null, elapsed: 0 } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(3), null, memory)
      expect(ts[0].pinnedStart).toBe(false)
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[0].startDrift).toBe(min(2)) // real measurement, not 0-by-construction
    })

    it('planning wins: an upstream anchor chain reaching the wall row is never overridden', () => {
      // Cue 1 has a hard start but never ran; the show began at cue 2. The
      // chain from cue 1's anchor IS the plan — measure against it.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '2'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '2': { start: THREE_PM + min(15), finish: null, elapsed: 0 } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(16), null, memory)
      expect(ts[1].pinnedStart).toBe(false)
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
      expect(ts[1].startDrift).toBe(min(5))
    })

    it('planning wins: a FINISH_TIME wall row derives its start from finishTime, no pin', () => {
      timers[0].type = 'FINISH_TIME'
      timers[0].finishTime = new Date(THREE_PM + min(10))
      timeset.timerId = '1'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM + min(1), finish: null, elapsed: 0 } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(2), null, memory)
      expect(ts[0].pinnedStart).toBe(false)
      expect(ts[0].planned.start).toBe(THREE_PM) // finishTime − duration
    })

    it('no memory → no wall: reset restores pure planning (honest nulls)', () => {
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM)
      for (const t of ts) {
        expect(t.pinnedStart).toBe(false)
        expect(t.planned.start).toBe(null)
      }
    })

    it('wall relocation (accepted wart): running an earlier cue moves the wall up in list order', () => {
      // Show began at cue 3; the wall sits there.
      timeset.timerId = '3'
      timeset.running = true
      const memory: MemoryInput = {
        timers: { '3': { start: THREE_PM, finish: null, elapsed: 0 } },
      }
      const ts1 = createTimestamps(timers, timeset, undefined, THREE_PM + min(1), null, memory)
      expect(ts1[2].pinnedStart).toBe(true)
      expect(ts1[2].planned.start).toBe(THREE_PM)

      // Operator jumps back and runs cue 1 (later in wall-clock): the wall
      // relocates to cue 1 and the whole plan re-derives from that later time.
      timeset.timerId = '1'
      memory.timers!['1'] = { start: THREE_PM + min(50), finish: null, elapsed: 0 }
      const ts2 = createTimestamps(timers, timeset, undefined, THREE_PM + min(51), null, memory)
      expect(ts2[0].pinnedStart).toBe(true)
      expect(ts2[0].planned.start).toBe(THREE_PM + min(50))
      expect(ts2[2].pinnedStart).toBe(false)
      expect(ts2[2].planned.start).toBe(THREE_PM + min(70)) // forward-filled from the new wall
    })

    it('dangling/null pointer with memory: the wall still pins the planned chain', () => {
      // Losing the cue blanks the projection (every row FUTURE, re-projects
      // from the plan) — but the plan itself stays clamped on the run's start.
      const memory: MemoryInput = {
        timers: { '1': { start: THREE_PM, finish: THREE_PM + min(10), elapsed: min(10) } },
      }
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM + min(11), null, memory)
      expect(ts[0].state).toBe('FUTURE')
      expect(ts[0].pinnedStart).toBe(true)
      expect(ts[0].planned.start).toBe(THREE_PM)
      expect(ts[1].planned.start).toBe(THREE_PM + min(10))
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
        expect(t).toHaveProperty('expected.start')
        expect(t).toHaveProperty('expected.finish')
        expect(t).toHaveProperty('expected.duration')
        expect(t).toHaveProperty('startDrift')
        expect(t).toHaveProperty('finishDrift')
        expect(t).toHaveProperty('gap')
        expect(t).toHaveProperty('liveGap')
        expect(t).toHaveProperty('segmentIndex')
        expect(t).toHaveProperty('segmentEnd')
        expect(t).toHaveProperty('memory')
        expect(t).toHaveProperty('pinnedStart')
        expect(t).toHaveProperty('explicitStart')
        expect(t).toHaveProperty('explicitFinish')
        expect(typeof t.planned.start).toBe('number')
      }
    })
  })

  // Markers cut the rundown into segments: each closes the stretch above it
  // and supplies that stretch's own end, so a multi-day show stops being
  // measured against the end of the last day.
  describe('markers: per-segment ends', () => {
    const marker = (overrides: Partial<MarkerInput> = {}): MarkerInput => ({
      _id: 'm1',
      type: 'END_OF_DAY',
      beforeTimerId: '3',
      ...overrides,
    })

    it('no markers: one segment, every row scoped to the show target', () => {
      timers[0].startTime = new Date(THREE_PM)
      const targetEnd = THREE_PM + min(40)
      const ts = createTimestamps(timers, timeset, undefined, THREE_PM - min(30), null, {}, { frozen: targetEnd })
      for (const t of ts) {
        expect(t.segmentIndex).toBe(0)
        expect(t.segmentEnd).toBe(targetEnd)
      }
    })

    it('splits the rundown at its anchor: rows above and below carry different ends', () => {
      timers[0].startTime = new Date(THREE_PM)
      const dayEnd = THREE_PM + min(25)
      const targetEnd = THREE_PM + min(40)
      const markers = [marker({ time: new Date(dayEnd) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, { frozen: targetEnd }, markers)
      expect(ts.map(t => t.segmentIndex)).toEqual([0, 0, 1])
      expect(ts[0].segmentEnd).toBe(dayEnd)
      expect(ts[1].segmentEnd).toBe(dayEnd)
      expect(ts[2].segmentEnd).toBe(targetEnd)
    })

    it('reverse walk: soft rows above a marker fill back from it, not from the target', () => {
      // No hard anchors anywhere. t3 back-fills from the target, t1/t2 from the
      // marker — without markers all three would chain back off the target.
      timeset.timerId = null
      const dayEnd = THREE_PM + min(25)
      const targetEnd = THREE_PM + min(90)
      const markers = [marker({ time: new Date(dayEnd) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(60), null, {}, { frozen: targetEnd }, markers)
      expect(ts[1].planned.finish).toBe(dayEnd)
      expect(ts[1].planned.start).toBe(dayEnd - min(10))
      expect(ts[0].planned.finish).toBe(dayEnd - min(10))
      expect(ts[2].planned.finish).toBe(targetEnd)
    })

    it('END_OF_DAY absorbs the overrun above it: the next day starts on plan', () => {
      // t1 is 15 minutes past its 10-minute slot. Without the marker t2 would
      // chain off that overrun; the night swallows it instead.
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      timers[1].startTime = new Date(THREE_PM + min(20))
      const markers = [marker({ beforeTimerId: '2', time: new Date(THREE_PM + min(10)) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM + min(25), null, {}, null, markers)
      expect(ts[0].expected.finish).toBe(THREE_PM + min(25))
      expect(ts[1].planned.start).toBe(THREE_PM + min(20))
      expect(ts[1].expected.start).toBe(ts[1].planned.start)
      expect(ts[1].startDrift).toBe(0)
    })

    it('a typed marker is a wall for expected too: a day with no start of its own shows none while the day above runs', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const markers = [marker({ beforeTimerId: '2', time: new Date(THREE_PM + min(10)) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM + min(25), null, {}, null, markers)
      expect(ts[1].planned.start).toBeNull()
      expect(ts[1].expected.start).toBeNull()
      expect(ts[2].expected.start).toBeNull()
    })

    it('marker without a time: still cuts the rundown, but supplies no end to fill back from', () => {
      timeset.timerId = null
      const targetEnd = THREE_PM + min(90)
      const markers = [marker({ time: null })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(60), null, {}, { frozen: targetEnd }, markers)
      expect(ts.map(t => t.segmentIndex)).toEqual([0, 0, 1])
      expect(ts[0].segmentEnd).toBeNull()
      expect(ts[2].segmentEnd).toBe(targetEnd)
      // The wall carries through: the whole plan still chains back off the target.
      expect(ts[2].planned.finish).toBe(targetEnd)
      expect(ts[0].planned.start).toBe(targetEnd - min(30))
    })

    it('drops an anchor naming no cue in this rundown', () => {
      timers[0].startTime = new Date(THREE_PM)
      const markers = [marker({ beforeTimerId: 'deleted', time: new Date(THREE_PM + min(25)) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, markers)
      for (const t of ts) expect(t.segmentIndex).toBe(0)
    })

    it('keeps only the first marker at any one boundary', () => {
      timers[0].startTime = new Date(THREE_PM)
      const markers = [
        marker({ _id: 'm1', time: new Date(THREE_PM + min(25)) }),
        marker({ _id: 'm2', time: new Date(THREE_PM + min(35)) }),
      ]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, markers)
      expect(ts.map(t => t.segmentIndex)).toEqual([0, 0, 1])
      expect(ts[0].segmentEnd).toBe(THREE_PM + min(25))
    })

    it('null anchor: the marker sits below the last cue and closes the whole rundown', () => {
      timers[0].startTime = new Date(THREE_PM)
      const dayEnd = THREE_PM + min(40)
      const markers = [marker({ beforeTimerId: null, time: new Date(dayEnd) })]
      const ts = createTimestamps(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, { frozen: THREE_PM + min(90) }, markers)
      for (const t of ts) {
        expect(t.segmentIndex).toBe(0)
        expect(t.segmentEnd).toBe(dayEnd)
      }
    })

    it('returns one marker per input marker, in input order, in the boundary shape', () => {
      timers[0].startTime = new Date(THREE_PM)
      const dayEnd = THREE_PM + min(25)
      const markers = [
        marker({ _id: 'm2', beforeTimerId: null, time: new Date(THREE_PM + min(40)) }),
        marker({ _id: 'm1', beforeTimerId: '2', time: new Date(dayEnd) }),
      ]
      const { timestamps, markers: out } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, markers)
      expect(out.map(m => [m.markerId, m.index, m.segmentIndex])).toEqual([['m2', 3, 1], ['m1', 1, 0]])
      expect(out[1]).toMatchObject({
        planned: { end: dayEnd },
        expected: { end: timestamps[0].planned.finish },
        fixedEnd: true,
        gap: dayEnd - timestamps[0].planned.finish,
        drift: timestamps[0].planned.finish - dayEnd,
      })
      expect(out[0].planned.end).toBe(THREE_PM + min(40))
      expect(out[0].expected.end).toBe(timestamps[2].planned.finish)
      expect(timestamps[0].segmentEnd).toBe(dayEnd)
      expect(timestamps[2].segmentEnd).toBe(THREE_PM + min(40))
    })

    it('a typed marker pre-show: gap is the plan\'s slack, drift its mirror', () => {
      timers[0].startTime = new Date(THREE_PM)
      const dayEnd = THREE_PM + min(25)
      const { markers: out } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, [marker({ beforeTimerId: '2', time: new Date(dayEnd) })])
      expect(out[0]).toEqual({
        markerId: 'm1', index: 1, segmentIndex: 0,
        planned: { end: dayEnd }, expected: { end: THREE_PM + min(10) },
        fixedEnd: true, gap: min(15), drift: -min(15),
      })
    })

    it('a typed marker with the day running over: expected lands late, drift reads the overrun', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const markers = [marker({ beforeTimerId: '2', time: new Date(THREE_PM + min(10)) })]
      const { markers: out } = createAll(timers, timeset, 'UTC', THREE_PM + min(25), null, {}, null, markers)
      expect(out[0]).toMatchObject({
        planned: { end: THREE_PM + min(10) }, expected: { end: THREE_PM + min(25) },
        fixedEnd: true, gap: 0, drift: min(15),
      })
    })

    it('a marker without a time is not fixed: planned end is where the plan lands, gap null', () => {
      timers[0].startTime = new Date(THREE_PM)
      const { timestamps, markers: out } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, [marker({ time: null })])
      expect(out[0]).toEqual({
        markerId: 'm1', index: 2, segmentIndex: 0,
        planned: { end: timestamps[1].planned.finish }, expected: { end: timestamps[1].planned.finish },
        fixedEnd: false, gap: null, drift: 0,
      })
      expect(timestamps[0].segmentEnd).toBeNull()
    })

    it('a marker naming no cue, or doubling a boundary, keeps its slot with every field null', () => {
      timers[0].startTime = new Date(THREE_PM)
      const markers = [
        marker({ _id: 'm1', time: new Date(THREE_PM + min(25)) }),
        marker({ _id: 'm2', time: new Date(THREE_PM + min(35)) }),
        marker({ _id: 'm3', beforeTimerId: 'deleted', time: new Date(THREE_PM + min(45)) }),
      ]
      const { markers: out } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, null, markers)
      expect(out.map(m => m.markerId)).toEqual(['m1', 'm2', 'm3'])
      expect(out[0]).toMatchObject({ index: 2, segmentIndex: 0, planned: { end: THREE_PM + min(25) }, fixedEnd: true })
      const unplaced = { index: null, segmentIndex: null, planned: { end: null }, expected: { end: null }, fixedEnd: false, gap: null, drift: null }
      expect(out[1]).toEqual({ markerId: 'm2', ...unplaced })
      expect(out[2]).toEqual({ markerId: 'm3', ...unplaced })
    })

    it('an empty rundown returns no rows, every marker unplaced, and an empty target', () => {
      const { timestamps, markers: out, target } = createAll([], timeset, 'UTC', THREE_PM, null, {}, null, [marker()])
      expect(timestamps).toEqual([])
      expect(out[0]).toMatchObject({ markerId: 'm1', index: null, planned: { end: null } })
      expect(target).toEqual({ planned: { end: null }, expected: { end: null }, fixedEnd: false, gap: null, drift: null })
    })

    it("David's two-day show: Day 1 reads its own 13 minutes, Day 2 stays clean", () => {
      // Day 1 (Aug 24): doors 19:00, keynote 19:30 which runs 28 minutes long,
      // then a session hard-anchored at 20:45 — a 15-minute gap that eats 15 of
      // the overrun and leaves 13 riding into the night. Day 1 ends 02:00.
      // Day 2 (Aug 25): keynote 09:00, show ends 12:00.
      const roomDate = '2026-08-24'
      const dayEnd = at('2026-08-25T02:00:00.000Z')
      const targetEnd = at('2026-08-25T12:00:00.000Z')
      const cues: TimerInput[] = [
        makeTimer({ _id: 'd1a', minutes: 30, startTime: new Date(at('2000-01-01T19:00:00.000Z')) }),
        makeTimer({ _id: 'd1b', hours: 1, minutes: 0, startTime: new Date(at('2000-01-01T19:30:00.000Z')) }),
        makeTimer({ _id: 'd1c', hours: 5, minutes: 15, startTime: new Date(at('2000-01-01T20:45:00.000Z')) }),
        makeTimer({ _id: 'd2a', hours: 3, minutes: 0, startTime: new Date(at('2000-01-01T09:00:00.000Z')) }),
      ]
      const kickoff = at('2026-08-24T20:58:00.000Z')
      const ts = createTimestamps(
        cues,
        makeTimeset({ timerId: 'd1c', running: true, kickoff, lastStop: kickoff }),
        'UTC',
        kickoff + min(2),
        roomDate,
        {
          timers: {
            d1a: { start: at('2026-08-24T19:00:00.000Z'), finish: at('2026-08-24T19:30:00.000Z'), elapsed: min(30) },
            d1b: { start: at('2026-08-24T19:30:00.000Z'), finish: kickoff, elapsed: min(88) },
          },
        },
        { time: new Date(at('2000-01-01T12:00:00.000Z')) },
        [{ _id: 'm1', type: 'END_OF_DAY', time: new Date(at('2000-01-01T02:00:00.000Z')), beforeTimerId: 'd2a' }],
      )
      // Day 1 is measured against 02:00 and lands 13 minutes past it.
      expect(ts[2].segmentIndex).toBe(0)
      expect(ts[2].segmentEnd).toBe(dayEnd)
      expect(ts[2].planned.finish).toBe(dayEnd)
      expect(ts[2].expected.finish).toBe(dayEnd + min(13))
      // Day 2 is measured against 12:00 and is not carrying Day 1's overrun.
      expect(ts[3].segmentIndex).toBe(1)
      expect(ts[3].segmentEnd).toBe(targetEnd)
      expect(ts[3].expected.finish).toBe(targetEnd)
      expect(ts[3].startDrift).toBe(0)
    })
  })

  describe('target: the show end as a boundary', () => {
    const marker = (overrides: Partial<MarkerInput> = {}): MarkerInput => ({ _id: 'm1', type: 'END_OF_DAY', ...overrides })

    it('a frozen target pre-show: fixed, with the plan\'s slack as gap and its mirror as drift', () => {
      timers[0].startTime = new Date(THREE_PM)
      const { target } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, { frozen: THREE_PM + min(40) })
      expect(target).toEqual({
        planned: { end: THREE_PM + min(40) }, expected: { end: THREE_PM + min(30) },
        fixedEnd: true, gap: min(10), drift: -min(10),
      })
    })

    it('no target given: the plan\'s own landing, not fixed, gap null', () => {
      timers[0].startTime = new Date(THREE_PM)
      const { target } = createAll(timers, timeset, 'UTC', THREE_PM - min(30))
      expect(target).toEqual({
        planned: { end: THREE_PM + min(30) }, expected: { end: THREE_PM + min(30) },
        fixedEnd: false, gap: null, drift: 0,
      })
    })

    it('running late against a typed target: expected follows the last cue, drift reads the overrun', () => {
      timers[0].startTime = new Date(THREE_PM)
      timeset.timerId = '1'
      timeset.running = true
      timeset.kickoff = THREE_PM
      const { timestamps, target } = createAll(timers, timeset, 'UTC', THREE_PM + min(25), null, {}, { time: new Date(THREE_PM + min(30)) })
      expect(target.planned.end).toBe(THREE_PM + min(30))
      expect(target.expected.end).toBe(timestamps[2].expected.finish)
      expect(target.expected.end).toBe(THREE_PM + min(45))
      expect(target.drift).toBe(min(15))
    })

    it('with markers, the target closes only the last segment', () => {
      timers[0].startTime = new Date(THREE_PM)
      const markers = [marker({ beforeTimerId: '3', time: new Date(THREE_PM + min(25)) })]
      const { timestamps, target } = createAll(timers, timeset, 'UTC', THREE_PM - min(30), null, {}, { frozen: THREE_PM + min(50) }, markers)
      expect(target.planned.end).toBe(THREE_PM + min(50))
      expect(target.gap).toBe(THREE_PM + min(50) - timestamps[2].planned.finish)
      expect(timestamps[2].segmentEnd).toBe(THREE_PM + min(50))
    })
  })

})
