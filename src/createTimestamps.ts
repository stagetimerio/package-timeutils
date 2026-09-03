import { hmsToMilliseconds } from './hmsToMilliseconds'
import { parseCalendarDay } from './parseCalendarDay'
import { resolveAnchoredTime } from './timestamp-utils/resolveAnchoredTime'
import { resolveMarkerBoundaries } from './timestamp-utils/resolveMarkerBoundaries'
import { resolveTargetEnd } from './timestamp-utils/resolveTargetEnd'
import { resolveSegments, type Segment } from './timestamp-utils/resolveSegments'
import type {
  TimerInput,
  TimesetInput,
  TimestampState,
  MemoryInput,
  MarkerInput,
  BoundaryTimestamp,
  MarkerTimestamp,
  TargetInput,
  Timestamp,
  Timestamps,
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
 * (`timeset`), the room's date, the timezone, any memory of past runs, the
 * show target and the day-break markers. It returns `timestamps`, one row per
 * timer in list order; `markers`, one per marker in input order; and `target`,
 * the show end as the boundary closing the last segment (see
 * `BoundaryTimestamp` in `./types`). Each timer row has two parallel timelines
 * plus the facts:
 *
 *   - **planned** — pure schedule. What the rundown says.
 *   - **expected** — reality where known, projection where not: history (PAST),
 *     live kickoff + clock (ACTIVE), the prior row (FUTURE).
 *   - **memory** — the raw facts of the row's last run, or `null`.
 *
 * Plus derived fields per row: `startDrift` / `finishDrift` (expected − planned
 * at each endpoint), `gap` (the planned pause before this row), `liveGap` (the
 * pause actually there now — see the field doc in `./types`), and render
 * flags (`explicitStart`, `explicitFinish`).
 *
 * Read `expected` for the timeline and `memory` for facts — but `memory` is
 * stale on jumped-back rows (`state === 'FUTURE'`). See `Timestamp` in
 * `./types`.
 *
 * ## Rules
 *
 * - **Honest nulls.** `planned.start` / `planned.finish` are `null` when the
 *   chain has no anchor (no `startTime` / `finishTime`) reachable upstream
 *   *or* downstream. We don't fabricate a fallback like `kickoff || now` —
 *   null is the truth. No anchors anywhere → all planned values null. Once
 *   the run has memory, the front wall (below) is an anchor.
 * - **Anchors radiate both ways.** A single hard anchor (`startTime`, or
 *   FINISH_TIME with `finishTime`) seeds the chain forward (`next.start =
 *   prev.finish`) AND backward (`prev.finish = next.start`, `prev.start =
 *   prev.finish - duration`). Forward wins on collisions. The backward walk
 *   halts at any upstream hard `startTime` (which becomes its own backward
 *   anchor).
 * - **The front wall: fact fills holes, never overrides planning.** Once the
 *   run has memory, the first timer in list order with a recorded start pins
 *   its planned start to that fact (`pinnedStart: true`) — but only when no
 *   planning anchor reaches the row (no own `startTime`/`finishTime`, no
 *   chain from an upstream anchor). The pin forward-fills downstream like a
 *   hard start, so the reverse walk only fills the segment *above* the wall
 *   (advisory back-timed starts). Edits therefore propagate downstream only:
 *   a future-cue edit can't telescope planned starts upward through past
 *   rows. Derived every pass, never stored — the wall evaporates with the
 *   memory doc on reset, and editing the wall row's start promotes it to a
 *   real planned anchor. The memory read here is deliberately state-blind
 *   (unlike the per-row fact rule): the wall is a show-level anchor — "where
 *   did this run begin" — not a row-level display fact, so a jumped-back
 *   wall row still holds it.
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
 * - **No active cue → the projection is the plan.** `timeset.timerId` can be
 *   null or dangle at a deleted timer. With no position to be relative to,
 *   every row is `FUTURE` and the chain re-projects from the plan, ignoring
 *   memory — the pre-show reading. Deliberate: losing the cue blanks the
 *   output, so the timestamps agree. The one case where the chain walks past
 *   real facts: drift reads `0` while `memory` keeps the truth. Consumers
 *   gating on "has the show started" must check the pointer *resolves* —
 *   memory alone reads a plan-only projection as a live judgment.
 * - **Drift / gap inherit nulls.** `startDrift` / `finishDrift` / `gap` are
 *   `null` when either endpoint of the subtraction is null. `gap` is `0` for
 *   the first row by convention.
 * - **The rundown never runs backwards.** A typed time (`startTime`,
 *   `finishTime`, a marker's `time`, `target.time`) is a time-of-day; the
 *   calendar day it lands on follows from its position, never from the input.
 *   Every typed time resolves to the first occurrence of that time-of-day, in
 *   `timezone`, after its anchor: the start of its segment, which is the
 *   segment's first cue's resolved start. A cue may land on the start itself;
 *   a closing marker or the target lands strictly after it, since a day cannot
 *   end when it begins — two day ends typed the same time are 24 hours apart.
 *   So a cue typed earlier than the day's first cue rolls to the next day, and
 *   a closing marker can never land before the cues it closes. Until a
 *   segment has a start, typed times look from its entry: room date midnight
 *   for the first segment (today's midnight in a dateless room), then the
 *   previous marker's instant, or the previous finish under an untyped
 *   marker. The entry is only where a typed time is looked for; it is never
 *   a start in itself.
 *   Anchoring on the segment's *start* and not on the previous row is
 *   deliberate: a cue planned past the day's end shows as an overlap instead of
 *   silently rolling onto the next day. Resolution is therefore order-
 *   dependent — a typed start depends on the rows above it.
 * - **Strict input shapes.** Callers normalize: `startTime` / `finishTime` are
 *   `Date | null`, `kickoff` etc. are epoch ms. Library does no parsing of
 *   ISO strings or wall-clock formats.
 * - **`target` is a virtual show-end anchor.** The user-set `target.time`
 *   (resolved at or after the last segment's start, like any typed time) wins
 *   over the kickoff-frozen `target.frozen`. The resolved instant seeds the
 *   reverse walk from beyond the last row — trailing soft rows fill backward
 *   from it ("start here to land on target"). Forward-filled rows win as
 *   always.
 * - **Markers cut the rundown into segments.** A marker sits above a cue
 *   (`beforeTimerId`) and closes everything above it. Its resolved instant is
 *   that segment's end — the reverse walk seeds from it exactly as the show
 *   target seeds the last segment, so rows back-time to the end they are
 *   actually working toward. A marker's `frozen` end stands in for a missing
 *   `time`, as `target.frozen` does for the target. With neither, the marker
 *   declares the boundary without supplying an end: the segment above has no
 *   goalpost to fill backward from.
 * - **Every segment is a little room.** A marker is a wall, typed or not:
 *   a day end says nothing about when the next day starts, so nothing
 *   crosses it in either direction — no forward chain, no reverse fill, no
 *   `expected` projection. Inside its walls a segment times itself exactly
 *   like a room with no markers at all: a typed first cue times forward, a
 *   typed end (its own marker, or the target) times backward, a typed middle
 *   cue both ways, and with nothing typed every row stays null and the
 *   marker closing it has no end. The overrun above a marker is the night's
 *   to absorb: the first cue below starts from its own plan.
 */
export function createTimestamps (
  timers: TimerInput[],
  timeset: TimesetInput,
  timezone: string | undefined = undefined,
  now: number = Date.now(),
  roomDate: string | null = null, // 'YYYY-MM-DD'
  memory: MemoryInput = {},
  target: TargetInput | null = null,
  markers: MarkerInput[] = [],
): Timestamps {
  if (!Array.isArray(timers) || !timers.length || !timeset) {
    return { timestamps: [], markers: markers.map((marker) => unplacedMarker(marker)), target: emptyBoundary() }
  }

  // 00:00 local time in `timezone` on the room's date (or today if none).
  const roomMidnight: number = parseCalendarDay(roomDate, { timezone, now: new Date(now) }).getTime()
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

  // Front wall (see the rule above): the first timer in list order with a
  // recorded start. -1 pre-show or once the memory doc is gone — reset
  // restores pure planning by construction. Deleted timers aren't in the
  // list, so ghosts never hold the wall.
  const wallIdx: number = timers.findIndex(t => memory.timers?.[String(t._id)]?.start != null)

  // --- Segments ----------------------------------------------------------
  // Markers cut the rundown above the cue they anchor to; the show target
  // closes the last piece. With no markers this is one segment and every rule
  // below reduces to what it was before them. Ends are filled by pass 1.
  const boundaries = resolveMarkerBoundaries(markers, timers)
  const { segments } = resolveSegments(boundaries, timers.length)

  const out: Timestamp[] = []

  // --- Pass 1: forward planned + static fields ---------------------------
  // Walk the rundown one segment at a time, push a partial Timestamp with
  // `planned` and the fields that depend only on (timer, timeset): state,
  // memory, explicit flags. `expected`, drift, and gap are filled in pass 3.
  //
  // `entry` is where a segment's first typed time is looked for (see the rule
  // above). The first resolved start becomes the anchor for every typed time
  // left in the segment, the closing marker included.
  let entry: number = roomMidnight
  for (const [s, segment] of segments.entries()) {
    let segmentStart: number | null = null

    for (let i = segment.firstRow; i >= 0 && i <= segment.lastRow; i++) { // -1/-1 is an empty segment
      const timer = timers[i]!
      // A marker is a wall of the little room: the cue below it has nothing to chain off.
      const prev: Timestamp | undefined = i === segment.firstRow ? undefined : out[i - 1]
      const mem = memory.timers?.[String(timer._id)] ?? null

      let state: TimestampState
      if (i < activeIdx) state = TIMESTAMP_STATE.PAST
      else if (i === activeIdx && !activeIsArmed) state = TIMESTAMP_STATE.ACTIVE
      else state = TIMESTAMP_STATE.FUTURE // after the active cue, or the active cue while merely armed

      let plannedStart: number | null = null
      let plannedFinish: number | null = null
      let plannedDuration = 0

      // The first resolved start becomes the segment's, so a first cue's own
      // finish already counts from its start.
      if (timer.startTime) plannedStart = resolveAnchoredTime(timer.startTime, segmentStart ?? entry, timezone)
      else if (prev?.planned.finish) plannedStart = prev.planned.finish
      segmentStart ??= plannedStart

      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        if (timer.finishTime) plannedFinish = resolveAnchoredTime(timer.finishTime, segmentStart ?? entry, timezone)

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

      // Front wall pin — after the type blocks so every planning source (own
      // startTime, upstream chain, finishTime − duration) has had its say.
      // Fact fills the hole; it never overrides planning.
      let pinnedStart = false
      if (plannedStart == null && i === wallIdx && mem?.start != null) {
        plannedStart = mem.start
        plannedFinish = plannedStart + plannedDuration
        pinnedStart = true
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
        liveGap: null,
        segmentIndex: s,
        segmentEnd: null,
        pinnedStart,
        explicitStart: !!timer.startTime,
        explicitFinish: timer.type === TIMER_TYPES.FINISH_TIME,
      })

      segmentStart ??= plannedStart
    }

    const anchor: number = segmentStart ?? entry
    const closing = boundaries[s]
    if (closing) {
      segment.end = closing.time ? resolveAnchoredTime(closing.time, anchor, timezone, { after: true }) : closing.frozen ?? null
      entry = segment.end ?? out[segment.lastRow]?.planned.finish ?? entry
    } else {
      segment.end = resolveTargetEnd(target, anchor, timezone)
    }
  }

  // Both keyed by row, both sized by the number of day breaks rather than the
  // number of cues — a rundown of 900 cues and one marker holds one entry each.
  // The row that closes a segment back-times to that segment's own end, or to
  // nothing when it has none: the walk never leaves the little room (pass 2).
  const wallResetAtRow = new Map<number, number | null>()
  for (const { end, lastRow } of segments) {
    if (lastRow >= 0) wallResetAtRow.set(lastRow, end)
  }
  // The row that opens one: the long break above it swallows the overrun, so
  // the row starts from its own plan (pass 3).
  const dayBreakAtRow = new Set<number>(
    segments.slice(1).map((segment) => segment.firstRow).filter((row) => row >= 0),
  )

  // --- Pass 2: reverse planned ------------------------------------------
  // Fill remaining null planned rows by walking backward from each downstream
  // anchor. `wall` is the instant we step back from (next row's start). Each
  // segment's declared end acts as a virtual anchor past its last row.
  let wall: number | null = null
  for (let i = out.length - 1; i >= 0; i--) {
    const row = out[i]!

    // This row closes a segment: back-time to that segment's own end, not to
    // whatever the rows below are working toward.
    if (wallResetAtRow.has(i)) wall = wallResetAtRow.get(i)!

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

  // --- Pass 3: expected + drift + gap ----------------------------------------
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
        if (dayBreakAtRow.has(i)) {
          expectedStart = plannedStart // null when the day has no start of its own
        } else if (timer.startTime && plannedStart) {
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

    // Live gap — see the field doc in ./types. A still-future hard start
    // measures against its fixed anchor (`planned.start`), not the clamped
    // `expected.start`, so a live overlap can read negative.
    if (i === 0) row.liveGap = 0
    else if (!showStarted) row.liveGap = row.gap
    else if (prev?.expected.finish == null) row.liveGap = null
    else if (row.state === TIMESTAMP_STATE.FUTURE && timer.startTime && plannedStart != null) {
      row.liveGap = plannedStart - prev.expected.finish
    } else {
      row.liveGap = expectedStart != null ? expectedStart - prev.expected.finish : null
    }

    row.segmentEnd = segments[row.segmentIndex]!.end
  }

  // --- Boundaries: markers and the target, read off each segment's last cue --
  const boundaryOf = (segment: Segment): BoundaryTimestamp => {
    const last = out[segment.lastRow]
    const landing = last?.planned.finish ?? null
    const plannedEnd = segment.end ?? landing
    const expectedEnd = last?.expected.finish ?? plannedEnd
    return {
      planned: { end: plannedEnd },
      expected: { end: expectedEnd },
      fixedEnd: segment.end != null,
      gap: segment.end != null && landing != null ? segment.end - landing : null,
      drift: expectedEnd != null && plannedEnd != null ? expectedEnd - plannedEnd : null,
    }
  }

  // Boundary s closes segment s; markers that placed no boundary stay unplaced.
  const segmentByMarkerId = new Map(boundaries.map((boundary, s) => [String(boundary.markerId), s]))
  const markersOut: MarkerTimestamp[] = markers.map((marker) => {
    const s = segmentByMarkerId.get(String(marker._id))
    if (s === undefined) return unplacedMarker(marker)
    return { markerId: marker._id, index: boundaries[s]!.index, segmentIndex: s, ...boundaryOf(segments[s]!) }
  })

  return { timestamps: out, markers: markersOut, target: boundaryOf(segments[segments.length - 1]!) }
}

function emptyBoundary (): BoundaryTimestamp {
  return { planned: { end: null }, expected: { end: null }, fixedEnd: false, gap: null, drift: null }
}

function unplacedMarker (marker: MarkerInput): MarkerTimestamp {
  return { markerId: marker._id, index: null, segmentIndex: null, ...emptyBoundary() }
}
