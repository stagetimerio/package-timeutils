import timerToStartDate from './timerToStartDate.js'
import parseDateAsToday from './parseDateAsToday.js'
import applyDate from './applyDate.js'

export default function timerToFinishDate (timer) {
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
