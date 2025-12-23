import timerToStartDate from './timerToStartDate.DEPRECATED'
import parseDateAsToday from './parseDateAsToday'
import { applyDate } from './applyDate'

interface Timer {
  startTime?: Date | string
  startDate?: Date | string
  finishTime?: Date | string
  finishDate?: Date | string
}

function toUTCDateString(date: Date | string): Date | string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date}T00:00:00.000Z`
  }
  return date
}

export default function timerToFinishDate(timer: Timer | null | undefined): Date | null {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToFinishDate')
  if (!timer) return null
  const start = timerToStartDate(timer)
  let finish: Date | null = null
  if (start) {
    finish = parseDateAsToday(timer.finishTime as Date | string, { after: start, now: start })
  } else {
    finish = parseDateAsToday(timer.finishTime as Date | string)
  }
  if (timer.finishDate) {
    finish = applyDate(finish, toUTCDateString(timer.finishDate))
  }
  return finish
}
