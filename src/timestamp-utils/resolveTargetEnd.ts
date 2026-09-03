import { resolveAnchoredTime } from './resolveAnchoredTime'
import type { TargetInput } from '../types'

/**
 * Resolve the show target end to an epoch-ms instant.
 *
 * The user-set ("white") `target.time` is placed strictly after `anchor` — the
 * last segment's start — like a day end, and wins over the kickoff-frozen
 * ("gray") `target.frozen` instant. Returns `null` when neither is set: the
 * live-derived end is not a fixed line, so there is nothing to resolve.
 */
export function resolveTargetEnd (
  target: TargetInput | null,
  anchor: number,
  timezone: string | undefined,
): number | null {
  if (target?.time) return resolveAnchoredTime(target.time, anchor, timezone, { after: true })
  return target?.frozen ?? null
}
