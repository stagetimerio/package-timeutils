import { hmsToMilliseconds } from './hmsToMilliseconds'
import { parseCalendarDay } from './parseCalendarDay'
import { applyDate } from './applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'
import type {
  TimerInput,
  TimesetInput,
  TimestampState,
  MemoryInput,
  TargetInput,
  Timestamp,
} from './types'

// --- Constants -----------------------------------------------------------

const TIMER_TYPES = {
  DURATION: 'DURATION' as const,
  FINISH_TIME: 'FINISH_TIME' as const,
  TIME_WARP: 'TIME_WARP' as const,
}

const TIMESTAMP_STATE = {
  PAST: 'PAST' as TimestampState,
  ACTIVE: 'ACTIVE' as TimestampState,
  FUTURE: 'FUTURE' as TimestampState,
}

// --- Main ----------------------------------------------------------------

/**
 * Builds planned + expected timestamp chain for a list of timers.
 *
 * You give it a rundown — a list of timers, plus what's currently running
 * (`timeset`), the room's date, the timezone, and any memory of past runs.
 * It returns one row per timer with two parallel timelines plus the facts:
 *
 *   - **planned** — when the rundown *says* this timer should start, finish,
 *     and how long it should last. Pure schedule.
 *   - **expected** — the reality-anchored chain: recorded history (PAST), live
 *     kickoff + clock (ACTIVE), projection from the prior row (FUTURE). Reality
 *     where known, projection where not.
 *   - **memory** — the raw recorded facts for this timer, or `null`. Never a
 *     guess.
 *
 * Plus a few derived fields per row: `startDrift` / `finishDrift` (expected −
 * planned at each endpoint), `gap` (the planned pause before this row), and
 * flags for how the row should render (`explicitStart`, `explicitFinish`).
 *
 * Consumers should **read memory-first** — `memory.start ?? expected.start`,
 * same for finish — so facts win wherever they exist and `expected` is only
 * consulted where it genuinely is a forecast. See `Timestamp` in `./types`.
 *
 * ## Rules
 *
 * - **Honest nulls.** `planned.start` / `planned.finish` are `null` when the
 *   chain has no anchor (no `startTime` / `finishTime`) reachable upstream
 *   *or* downstream. We don't fabricate a fallback like `kickoff || now` —
 *   null is the truth. No anchors anywhere → all planned values null.
 * - **Anchors radiate both ways.** A single hard anchor (`startTime`, or
 *   FINISH_TIME with `finishTime`) seeds the chain forward (`next.start =
 *   prev.finish`) AND backward (`prev.finish = next.start`, `prev.start =
 *   prev.finish - duration`). Forward wins on collisions. The backward walk
 *   halts at any upstream hard `startTime` (which becomes its own backward
 *   anchor).
 * - **Duration defaults to 0.** Durations can never be negative, so `0` is the
 *   honest "don't know" value. Saves null checks at the boundary.
 * - **Expected mirrors planned by default.** When we don't know any better
 *   (no kickoff, no memory, no prev expected to chain from), `expected ===
 *   planned` — including null. Kickoff (ACTIVE) and memory (PAST) override
 *   this; FUTURE chains forward from the previous row's `expected.finish` once
 *   any timer has run.
 * - **Hard anchors honor scheduled gaps.** A FUTURE timer with a `startTime`
 *   later than the prior row's expected finish waits at the anchor — the gap
 *   was scheduled on purpose. Chaining only kicks in once we've overshot the
 *   anchor (prior row ran long):
 *   `expectedStart = max(plannedStart, prevExpectedFinish)`. No anchor → always
 *   chain.
 * - **State is positional, not historical — with one live exception.** `ACTIVE`
 *   is the row at `timeset.timerId`; `PAST` is everything before it; `FUTURE`
 *   everything after. Memory ("this timer once ran") never sets state. The
 *   exception: an *armed* current cue — one that's merely reset/parked at the
 *   start (`running === false` and `lastStop === kickoff`) — hasn't started, so
 *   it is `FUTURE`, not `ACTIVE`. `ACTIVE` therefore means "the current cue,
 *   and it's live" (running or paused mid-cue). Consumers that need the parked
 *   cue's identity read `timeset.timerId`, not state. With no active timer (or
 *   an armed one), no row is ACTIVE. This keeps the stale reset `kickoff` out of
 *   the projection: a FUTURE armed cue chains from the prior row's finish (or
 *   mirrors planned when first) instead of reading a frozen snapshot.
 * - **Before the show starts, the projection is just the plan.** As long as
 *   nothing has run yet (no cue is live, no memory of a past run), pointing
 *   at a cue is just pointing — it doesn't mean the earlier cues were
 *   skipped. So pre-show, the expected chain ignores which cue is armed and
 *   projects every row straight from the plan. Without this, arming cue 3
 *   would treat cues 1-2 as "skipped in zero seconds" and the expected end
 *   would jump around as the pointer moves. Once the show has started,
 *   PAST rows without memory really do mean "skipped" and collapse as
 *   documented. `state` itself is not affected — only the expected chain.
 * - **Drift / gap inherit nulls.** `startDrift` / `finishDrift` / `gap` are
 *   `null` when either endpoint of the subtraction is null. `gap` is `0` for
 *   the first row by convention.
 * - **One canonical day.** All wall-clock anchors (`startTime` / `finishTime`)
 *   are placed on `roomDate + datePlus` in `timezone`. No prev-finish
 *   compensation, no "today" guessing — every anchor has a fully determined
 *   calendar day.
 * - **Strict input shapes.** Callers normalize: `startTime` / `finishTime` are
 *   `Date | null`, `kickoff` etc. are epoch ms. Library does no parsing of
 *   ISO strings or wall-clock formats.
 * - **`target` is a virtual show-end anchor.** The user-set `target.time`
 *   (resolved onto roomDate + `target.datePlus`, like any timer anchor) wins
 *   over the kickoff-frozen `target.frozen`. The resolved instant seeds the
 *   reverse walk from beyond the last row — trailing soft rows fill backward
 *   from it ("start here to land on target"). Forward-filled rows win as
 *   always.
 * - **`backTime` is backward timing from the target.** Per row, the latest
 *   start that still lands the show on `targetEnd`, walking the planned chain
 *   backward through the same durations + gaps. Because every planned row
 *   satisfies `finish = start + duration` and gaps are the residuals between
 *   rows, that walk telescopes to a uniform shift:
 *   `backTime = planned.start + (targetEnd − plannedEnd)` — scheduled gaps
 *   survive by construction. No fixed target → the plan's own end stands in
 *   (shift 0, `backTime ≡ planned.start`). Unknown plan end or null
 *   `planned.start` → `null`.
 */
export function createTimestamps (
  timers: TimerInput[],
  timeset: TimesetInput,
  timezone: string | undefined = undefined,
  now: number = Date.now(),
  roomDate: string | null = null, // 'YYYY-MM-DD'
  memory: MemoryInput = {},
  target: TargetInput | null = null,
): Timestamp[] {
  if (!Array.isArray(timers) || !timers.length) return []
  if (!timeset) return []

  // 00:00 local time in `timezone` on the room's date (or today if none).
  const iRoomDate: Date = parseCalendarDay(roomDate, { timezone, now: new Date(now) })
  const kickoffMs: number | null = timeset.kickoff
  const activeIdx: number = timeset.timerId
    ? timers.findIndex(t => String(t._id) === String(timeset.timerId))
    : -1

  // The current cue is "armed" when reset/parked at the very start (not running,
  // playhead still at kickoff) — not started, so it's FUTURE not ACTIVE (below).
  const activeIsArmed: boolean = activeIdx >= 0
    && !timeset.running
    && timeset.lastStop === kickoffMs

  // Has anything run yet? True when a cue is live right now, or memory holds
  // at least one past run. Memory alone would almost be enough (kickoff
  // writes an entry), but timeset and memory arrive as separate events — the
  // first clause covers the moment a cue is already running while its memory
  // entry hasn't landed yet.
  const showStarted: boolean = (activeIdx >= 0 && !activeIsArmed)
    || Object.keys(memory.timers ?? {}).length > 0

  const out: Timestamp[] = []

  // --- Pass 1: forward planned + static fields ---------------------------
  // Walk the rundown, push a partial Timestamp with `planned` and the fields
  // that depend only on (timer, timeset): state, memory, explicit flags.
  // `expected`, drift, and gap are filled in pass 3.
  for (const [i, timer] of timers.entries()) {
    const prev = out[i - 1]
    const mem = memory.timers?.[String(timer._id)] ?? null

    let state: TimestampState
    if (i < activeIdx) state = TIMESTAMP_STATE.PAST
    else if (i === activeIdx && !activeIsArmed) state = TIMESTAMP_STATE.ACTIVE
    else state = TIMESTAMP_STATE.FUTURE // after the active cue, or the active cue while merely armed

    let plannedStart: number | null = null
    let plannedFinish: number | null = null
    let plannedDuration = 0

    if (timer.startTime) plannedStart = resolveAnchoredTime(timer.startTime, iRoomDate, timer.startDatePlus, timezone)
    else if (prev?.planned.finish) plannedStart = prev.planned.finish

    if (timer.type === TIMER_TYPES.FINISH_TIME) {
      if (timer.finishTime) plannedFinish = resolveAnchoredTime(timer.finishTime, iRoomDate, timer.finishDatePlus, timezone)

      if (plannedStart && plannedFinish) {
        plannedDuration = plannedFinish - plannedStart
      } else if (plannedFinish) {
        plannedDuration = hmsToMilliseconds(timer)
        plannedStart = plannedFinish - plannedDuration
      }
    } else {
      plannedDuration = hmsToMilliseconds(timer)
      if (plannedStart) plannedFinish = plannedStart + plannedDuration
    }

    out.push({
      timerId: timer._id,
      state,
      planned: { start: plannedStart, finish: plannedFinish, duration: plannedDuration },
      expected: { start: null, finish: null, duration: 0 },
      memory: mem,
      startDrift: null,
      finishDrift: null,
      gap: null,
      backTime: null,
      explicitStart: !!timer.startTime,
      explicitFinish: timer.type === TIMER_TYPES.FINISH_TIME,
    })
  }

  // --- Pass 2: reverse planned ------------------------------------------
  // Fill remaining null planned rows by walking backward from each downstream
  // anchor. `wall` is the instant we step back from (next row's start). The
  // resolved show target end acts as a virtual anchor past the last row.
  const targetEnd: number | null = resolveTargetEnd(target, { timezone, now, roomDate })
  let wall: number | null = targetEnd
  for (let i = out.length - 1; i >= 0; i--) {
    const row = out[i]!

    // Forward already filled this row. Forward wins; row's start is the new
    // wall (an upstream hard anchor seeds its own backward run).
    if (row.planned.start) {
      wall = row.planned.start
      continue
    }
    // Reverse-fill from the wall.
    if (!wall) continue
    row.planned.finish = wall
    row.planned.start = wall - row.planned.duration
    wall = row.planned.start
  }

  // Back-time headroom: how far the target sits past the plan's own end.
  // Timing the plan backward from the target reuses the same durations + gaps,
  // so per row `backTime = planned.start + headroom` (see the rule above). No
  // fixed target → the plan end stands in → headroom 0 → backTime ≡ planned.start.
  const plannedEnd: number | null = out[out.length - 1]!.planned.finish
  const headroom: number | null = plannedEnd != null
    ? (targetEnd ?? plannedEnd) - plannedEnd
    : null

  // --- Pass 3: expected + drift + gap + backTime -------------------------
  for (const [i, timer] of timers.entries()) {
    const row = out[i]!
    const prev = out[i - 1]
    const mem = row.memory
    const { start: plannedStart, finish: plannedFinish, duration: plannedDuration } = row.planned

    // Default: expected mirrors planned.
    let expectedStart: number | null = plannedStart
    let expectedFinish: number | null = plannedFinish

    // Before the show starts, treat every row as FUTURE here: a row that is
    // "past" only because of where the pointer sits was never skipped, and
    // must not collapse to zero duration. (Pre-show there is no live cue and
    // no memory, so the ACTIVE / PAST-with-memory branches can't apply anyway
    // — this only disarms the skip-collapse.)
    const chainState: TimestampState = showStarted ? row.state : TIMESTAMP_STATE.FUTURE

    // - expected start
    // An armed (reset/parked) current cue is FUTURE here — see pass 1 — so it
    // chains from the previous row's finish (or mirrors planned when first)
    // instead of projecting off its stale reset kickoff.
    switch (chainState) {
      case TIMESTAMP_STATE.PAST:
        if (mem?.start) expectedStart = mem.start
        break
      case TIMESTAMP_STATE.ACTIVE:
        // Prefer memory.start over kickoff: kickoff drifts with pause/resume/
        // jump cycles, memory.start preserves the original first-kickoff.
        if (mem?.start) expectedStart = mem.start
        else if (kickoffMs) expectedStart = kickoffMs
        break
      case TIMESTAMP_STATE.FUTURE:
        // Hard `startTime` honors the scheduled gap; chain forward only if
        // we've already overshot the anchor. Otherwise chain from prev.
        if (timer.startTime && plannedStart) {
          expectedStart = prev?.expected.finish ? Math.max(plannedStart, prev.expected.finish) : plannedStart
        } else if (prev?.expected.finish) {
          expectedStart = prev.expected.finish
        }
        break
    }

    // - expected finish
    switch (chainState) {
      case TIMESTAMP_STATE.PAST:
        if (mem?.finish) expectedFinish = mem.finish
        else expectedFinish = expectedStart // skipped: collapse to zero duration
        break
      case TIMESTAMP_STATE.ACTIVE: {
        // Project from the live playhead.
        //   Running: playhead = now; elapsed = now − kickoff.
        //   Paused:  playhead = lastStop; elapsed = lastStop − kickoff.
        // movePlayhead shifts lastStop (not kickoff) while paused, so the
        // projection has to read from it — otherwise jump fwd/back wouldn't
        // slide the active row's finish or any downstream chained start.
        // finish = now + (duration − elapsed); collapses to kickoff + duration
        // when running, slides correctly when paused.
        if (kickoffMs !== null) {
          const playhead = timeset.running ? now : (timeset.lastStop ?? now)
          const elapsed = playhead - kickoffMs
          if (timer.type === TIMER_TYPES.FINISH_TIME && plannedFinish) {
            expectedFinish = Math.max(plannedFinish, kickoffMs, now)
          } else {
            expectedFinish = Math.max(now + plannedDuration - elapsed, now)
          }
        } else if (expectedStart) {
          if (timer.type === TIMER_TYPES.FINISH_TIME && plannedFinish) {
            expectedFinish = Math.max(plannedFinish, expectedStart, now)
          } else {
            expectedFinish = Math.max(expectedStart + plannedDuration, now)
          }
        }
        break
      }
      case TIMESTAMP_STATE.FUTURE:
        if (expectedStart) {
          if (timer.type === TIMER_TYPES.FINISH_TIME) {
            expectedFinish = Math.max(plannedFinish ?? expectedStart, expectedStart)
          } else {
            expectedFinish = expectedStart + plannedDuration
          }
        }
        break
    }

    const expectedDuration = expectedStart && expectedFinish ? Math.max(0, expectedFinish - expectedStart) : 0

    row.expected = { start: expectedStart, finish: expectedFinish, duration: expectedDuration }
    row.startDrift = expectedStart && plannedStart ? expectedStart - plannedStart : null
    row.finishDrift = expectedFinish && plannedFinish ? expectedFinish - plannedFinish : null
    row.gap = plannedStart && prev?.planned.finish
      ? plannedStart - prev.planned.finish
      : i === 0 ? 0 : null
    row.backTime = headroom != null && plannedStart != null ? plannedStart + headroom : null
  }

  return out
}

/**
 * Resolve the show target end to an epoch-ms instant.
 *
 * Same precedence and date placement as `createTimestamps` uses internally
 * (this IS the function it calls): the user-set ("white") `target.time` is
 * placed on `roomDate + target.datePlus` in `timezone`, exactly like a timer
 * anchor, and wins over the kickoff-frozen ("gray") `target.frozen` instant.
 * Returns `null` when neither is set — the live-derived end is not a fixed
 * line, so there is nothing to resolve.
 *
 * Exported so display layers can compare the same instant the reverse walk
 * anchors on (e.g. the gap between the last timer's planned finish and the
 * target) without re-implementing the precedence rules.
 */
export function resolveTargetEnd (
  target: TargetInput | null,
  {
    timezone = undefined,
    now = Date.now(),
    roomDate = null,
  }: {
    timezone?: string
    now?: number
    roomDate?: string | null
  } = {},
): number | null {
  if (target?.time) {
    const iRoomDate = parseCalendarDay(roomDate, { timezone, now: new Date(now) })
    return resolveAnchoredTime(target.time, iRoomDate, target.datePlus, timezone)
  }
  return target?.frozen ?? null
}

// --- Helpers -------------------------------------------------------------

/**
 * Resolve a wall-clock anchor to epoch ms by placing the time-of-day from
 * `rawInput` on `roomDate + datePlus` in the target timezone.
 */
function resolveAnchoredTime (
  rawInput: Date,
  roomDate: Date,
  datePlus: number = 0,
  timezone: string | undefined = 'UTC',
): number {
  const day = datePlus ? addDays(roomDate, datePlus, { in: tz(timezone) }) : roomDate
  const result = applyDate(rawInput, day, timezone)
  return result ? result.getTime() : 0
}
