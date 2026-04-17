import hmsToMilliseconds from './hmsToMilliseconds'
import parseDateAsToday from './parseDateAsToday'
import { applyDate } from './applyDate'
import getToday from './getToday'
import { addDays } from 'date-fns/addDays'
import { addMinutes } from 'date-fns/addMinutes'

// --- Types ---------------------------------------------------------------

export type TimerType = 'DURATION' | 'FINISH_TIME' | 'TIME_WARP'
export type TimerTrigger = 'MANUAL' | 'LINKED' | 'SCHEDULED'
export type TimestampState = 'PAST' | 'ACTIVE' | 'FUTURE'

export interface TimerInput {
  _id: string | number
  type: TimerType
  trigger: TimerTrigger
  hours?: number
  minutes?: number
  seconds?: number
  startTime?: string | Date | null
  startDatePlus?: number
  finishTime?: string | Date | null
  finishDatePlus?: number
}

export interface TimesetInput {
  timerId: string | number | null
  running: boolean
  kickoff: number | Date | null
  lastStop: number | Date | null
  deadline?: number | Date | null
}

export interface MemoryTimerEntry {
  start: number | null
  finish: number | null
  elapsed: number
  plannedStart?: number | null
  plannedFinish?: number | null
  plannedDuration?: number | null
}

export interface MemoryInput {
  driftResetAt?: number | null
  timers?: Record<string, MemoryTimerEntry> | Map<string, MemoryTimerEntry>
}

export interface Timestamp {
  timerId: string | number
  state: TimestampState
  planned: { start: number, finish: number, duration: number }
  actual: { start: number, finish: number, duration: number }
  drift: number
  overUnder: number
  gap: number
  hasMemory: boolean
  explicitStart: boolean
  explicitFinish: boolean
}

// --- Constants -----------------------------------------------------------

const TIMER_TYPES = {
  DURATION: 'DURATION' as const,
  FINISH_TIME: 'FINISH_TIME' as const,
  TIME_WARP: 'TIME_WARP' as const,
}

const TIMER_TRIGGERS = {
  MANUAL: 'MANUAL' as const,
  LINKED: 'LINKED' as const,
  SCHEDULED: 'SCHEDULED' as const,
}

const DRIFT_ROUND_MS = 500

// --- Helpers -------------------------------------------------------------

function toMs (value: number | Date | null | undefined): number | null {
  if (value == null) return null
  if (value instanceof Date) return value.getTime()
  return typeof value === 'number' ? value : null
}

function resolveTimerDate (
  roomDate: string | null,
  datePlus: number = 0,
  timezone?: string,
): Date {
  const referenceDate = roomDate ? new Date(roomDate + 'T12:00:00Z') : undefined
  const baseDate = getToday(timezone, referenceDate)
  return datePlus ? addDays(baseDate, datePlus) : baseDate
}

function resolveAnchoredTime (
  rawInput: string | Date,
  datePlus: number,
  roomDate: string | null,
  timezone: string | undefined,
  prevFinishMs: number | null,
): number {
  const prevFinish30 = prevFinishMs !== null ? addMinutes(new Date(prevFinishMs), -30) : undefined
  const parsed = parseDateAsToday(rawInput, {
    timezone,
    after: prevFinish30,
    now: prevFinish30,
  })
  let result: Date | null = parsed
  if (datePlus > 0 || roomDate) {
    const targetDate = resolveTimerDate(roomDate, datePlus, timezone)
    result = applyDate(result, targetDate, timezone)
  }
  return result ? result.getTime() : 0
}

function memoryEntryOf (
  memory: MemoryInput | undefined,
  timerId: string | number,
): MemoryTimerEntry | null {
  if (!memory || !memory.timers) return null
  const key = String(timerId)
  const timers = memory.timers
  if (timers instanceof Map) return timers.get(key) ?? null
  return (timers as Record<string, MemoryTimerEntry>)[key] ?? null
}

function roundDrift (ms: number): number {
  const sign = ms < 0 ? -1 : 1
  return sign * Math.floor(Math.abs(ms) / DRIFT_ROUND_MS) * DRIFT_ROUND_MS
}

// --- Main ----------------------------------------------------------------

/**
 * Build planned + actual timestamp chain for a list of timers.
 *
 * The planned chain walks from the current timer config (startTime anchors,
 * durations, FINISH_TIME). The actual chain walks independently, fed by
 * memory for PAST timers, kickoff for ACTIVE, and drift propagation for
 * FUTURE timers. `drift` and `overUnder` emerge as the difference between
 * the two chains.
 */
export default function createTimestamps (
  timers: TimerInput[],
  timeset: TimesetInput,
  timezone: string | undefined = undefined,
  now: number = Date.now(),
  roomDate: string | null = null,
  memory: MemoryInput = {},
): Timestamp[] {
  if (!Array.isArray(timers) || !timers.length) return []
  if (!timeset) return []

  const kickoffMs = toMs(timeset.kickoff)
  const driftResetAt = memory.driftResetAt ?? null

  // Planned chain state
  let prevPlannedFinish: number = 0

  // Actual chain state
  let prevActualFinish: number = 0
  let prevActualExists = false

  const out: Timestamp[] = []

  for (const timer of timers) {
    const memoryEntry = memoryEntryOf(memory, timer._id)
    const hasMemoryFinish = !!(memoryEntry && memoryEntry.finish != null)

    const isActive = timeset.timerId != null && String(timeset.timerId) === String(timer._id)

    const state: TimestampState = isActive
      ? 'ACTIVE'
      : hasMemoryFinish ? 'PAST' : 'FUTURE'
    const hasMemory = state === 'PAST' && hasMemoryFinish

    // ---------------------------------------------------------------------
    // 1. Planned chain (current config)
    // ---------------------------------------------------------------------

    const explicitStart = Boolean(timer.startTime)
    let plannedStart: number
    if (timer.startTime) {
      plannedStart = resolveAnchoredTime(
        timer.startTime,
        timer.startDatePlus ?? 0,
        roomDate,
        timezone,
        prevPlannedFinish || null,
      )
    } else if (prevPlannedFinish) {
      plannedStart = prevPlannedFinish
    } else {
      // First timer with no scheduled start: project from active kickoff or now
      plannedStart = kickoffMs ?? now
    }

    let plannedFinish: number
    let plannedDuration: number
    let explicitFinish = false
    if (timer.type === TIMER_TYPES.FINISH_TIME) {
      explicitFinish = true
      if (timer.finishTime) {
        plannedFinish = resolveAnchoredTime(
          timer.finishTime,
          timer.finishDatePlus ?? 0,
          roomDate,
          timezone,
          plannedStart || null,
        )
      } else {
        plannedFinish = plannedStart
      }
      plannedDuration = plannedFinish - plannedStart
    } else {
      plannedDuration = hmsToMilliseconds(timer)
      plannedFinish = plannedStart + plannedDuration
    }

    const planned = { start: plannedStart, finish: plannedFinish, duration: plannedDuration }

    // ---------------------------------------------------------------------
    // 2. Drift baseline (use snapshot if present)
    // ---------------------------------------------------------------------

    const snapStart = memoryEntry?.plannedStart ?? null
    const snapFinish = memoryEntry?.plannedFinish ?? null
    const driftBaselineStart = snapStart !== null ? snapStart : plannedStart
    const driftBaselineFinish = snapFinish !== null ? snapFinish : plannedFinish

    // ---------------------------------------------------------------------
    // 3. Actual chain
    // ---------------------------------------------------------------------

    let actualStart: number
    let actualFinish: number
    let actualDuration: number

    if (state === 'PAST' && hasMemory) {
      const memStart = memoryEntry!.start ?? memoryEntry!.finish! - (memoryEntry!.elapsed ?? 0)
      const memFinish = memoryEntry!.finish!
      const beforeReset = driftResetAt != null && memStart < driftResetAt
      if (beforeReset) {
        // Drift reset erases any drift before the reset point
        actualStart = driftBaselineStart
        actualFinish = driftBaselineFinish
        actualDuration = driftBaselineFinish - driftBaselineStart
      } else {
        actualStart = memStart
        actualFinish = memFinish
        actualDuration = memoryEntry!.elapsed ?? (memFinish - memStart)
      }
    } else if (state === 'PAST') {
      // PAST without memory — treat as if it ran exactly as planned
      actualStart = plannedStart
      actualFinish = plannedFinish
      actualDuration = plannedDuration
    } else if (state === 'ACTIVE') {
      actualStart = kickoffMs ?? plannedStart
      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        const baseFinish = Math.max(plannedFinish, actualStart)
        actualFinish = Math.max(baseFinish, now)
        actualDuration = Math.max(0, actualFinish - actualStart)
      } else {
        const scheduled = actualStart + plannedDuration
        actualFinish = Math.max(scheduled, now)
        actualDuration = Math.max(0, actualFinish - actualStart)
      }
    } else {
      // FUTURE
      if (timer.trigger === TIMER_TRIGGERS.LINKED && prevActualExists) {
        actualStart = prevActualFinish
      } else if (prevActualExists) {
        actualStart = Math.max(prevActualFinish, plannedStart)
      } else {
        actualStart = plannedStart
      }

      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        actualFinish = Math.max(plannedFinish, actualStart)
        actualDuration = Math.max(0, actualFinish - actualStart)
      } else {
        actualDuration = plannedDuration
        actualFinish = actualStart + actualDuration
      }
    }

    const actual = { start: actualStart, finish: actualFinish, duration: actualDuration }

    // ---------------------------------------------------------------------
    // 4. Emergent values
    // ---------------------------------------------------------------------

    const drift = roundDrift(actualStart - driftBaselineStart)
    const overUnder = roundDrift(actualFinish - driftBaselineFinish)
    const gap = prevPlannedFinish ? plannedStart - prevPlannedFinish : 0

    out.push({
      timerId: timer._id,
      state,
      planned,
      actual,
      drift,
      overUnder,
      gap,
      hasMemory,
      explicitStart,
      explicitFinish,
    })

    prevPlannedFinish = plannedFinish
    prevActualFinish = actualFinish
    prevActualExists = true
  }

  return out
}
