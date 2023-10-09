import parseDateAsToday from './parseDateAsToday.js'
import applyDate from './applyDate.js'

//
// DEPRECATED: Moved to stagetimer/server/utils/timeUtils.js
//

export default function timerToStartDate (timer) {
  console.info('DEPRECATED @stagetimerio/timeutils/timerToStartDate')
  if (!timer) return null
  let start = parseDateAsToday(timer.startTime)
  if (timer.startDate) start = applyDate(start, timer.startDate)
  return start
}
