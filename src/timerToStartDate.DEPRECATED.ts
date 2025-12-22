import parseDateAsToday from './parseDateAsToday'
import { applyDate } from './applyDate'

interface Timer {
  startTime?: Date | string
  startDate?: Date | string
}

export default function timerToStartDate(timer: Timer | null | undefined): Date | null {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToStartDate')
  if (!timer) return null
  let start = parseDateAsToday(timer.startTime as Date | string)
  if (timer.startDate) start = applyDate(start, timer.startDate) as Date
  return start
}
