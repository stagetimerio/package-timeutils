import timerToStartDate from './timerToStartDate.DEPRECATED'
import parseDateAsToday from './parseDateAsToday'
import { applyDate } from './applyDate'

interface Timer {
  startTime?: Date | string
  startDate?: Date | string
  finishTime?: Date | string
  finishDate?: Date | string
}

export default function timerToFinishDate(timer: Timer | null | undefined): Date | null {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToFinishDate')
  if (!timer) return null
  const start = timerToStartDate(timer)
  let finish: Date | null = null
  if (start) {
    // Original code passed { reference: start, tollerance: 0 } which were ignored
    // by parseDateAsToday, so this effectively just called parseDateAsToday(finishTime)
    finish = parseDateAsToday(timer.finishTime as Date | string)
  } else {
    finish = parseDateAsToday(timer.finishTime as Date | string)
  }
  if (timer.finishDate) {
    finish = applyDate(finish, timer.finishDate)
  }
  return finish
}
