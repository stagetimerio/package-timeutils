import parseDateAsToday from './parseDateAsToday.js'
import applyDate from './applyDate.js'

export default function timerToStartDate (timer) {
  if (!timer) return null
  let start = parseDateAsToday(timer.startTime)
  if (timer.startDate) start = applyDate(start, timer.startDate)
  return start
}
