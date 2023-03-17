import format from 'date-fns/format/index.js'

export default function toYYYYMMDD (date, { asUTC = false } = {}) {
  if (asUTC) return date.toISOString().split('T')[0]
  else return format(date, 'yyyy-MM-dd')
}
