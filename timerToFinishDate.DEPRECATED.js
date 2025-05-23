import timerToStartDate from './timerToStartDate.DEPRECATED.js'
import parseDateAsToday from './parseDateAsToday.js'
import { applyDate } from './applyDate.js'

//
// DEPRECATED: Moved to stagetimer/server/utils/timeUtils.js
//

export default function timerToFinishDate (timer) {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToFinishDate')
  if (!timer) return null
  const start = timerToStartDate(timer)
  let finish = null
  if (start) {
    finish = parseDateAsToday(timer.finishTime, { reference: start, tollerance: 0 })
  } else {
    finish = parseDateAsToday(timer.finishTime)
  }
  if (timer.finishDate) {
    finish = applyDate(finish, timer.finishDate)
  }
  return finish
}
