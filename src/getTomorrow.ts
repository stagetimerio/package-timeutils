import { addDays } from 'date-fns/addDays'
import getToday from './getToday'

/**
 * Get the Date of 0:00 tomorrow in the given timezone
 *
 * @param  {string} [timezone] - assumes 'UTC' if empty
 * @param  {Date} [now] - provide a date for 'today', must be in UTC, used for testing
 * @return {Date}
 */
export default function getTomorrow (
  timezone: string | undefined = undefined,
  now: Date | undefined = undefined,
): Date {
  const today = getToday(timezone, now)
  return addDays(today, 1)
}
