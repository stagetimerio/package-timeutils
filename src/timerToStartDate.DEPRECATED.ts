import parseDateAsToday from './parseDateAsToday'
import { applyDate } from './applyDate'

interface Timer {
  startTime?: Date | string
  startDate?: Date | string
}

function toUTCDateString(date: Date | string): Date | string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date}T00:00:00.000Z`
  }
  return date
}

export default function timerToStartDate(timer: Timer | null | undefined): Date | null {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToStartDate')
  if (!timer) return null
  let start = parseDateAsToday(timer.startTime as Date | string)
  if (timer.startDate) start = applyDate(start, toUTCDateString(timer.startDate)) as Date
  return start
}
