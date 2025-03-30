/**
 * Get the timezone offset for a given date and timezone.
 *
 * @param {string} timezone - The IANA timezone string (e.g., 'Australia/Sydney')
 * @param {Date} date - The date to get the offset for
 * @return {number} The offset in milliseconds
 */
export function getTimezoneOffset (
  timezone,
  date,
) {
  if (!(date instanceof Date)) throw new Error('`date` must be a valid Date')
  if (typeof timezone !== 'string') throw new Error('`timezone` must be provided')

  const options = {
    timeZone: timezone,
    timeZoneName: 'longOffset', // Note: Typescript parser may be outdated, 'longOffset' is valid
  }
  const offsetStr = new Intl.DateTimeFormat('en', options).format(date).split(', ')[1]

  // Parse offsetStr into milliseconds
  const match = offsetStr.match(/GMT(?:([+-]\d{2}):(\d{2}))?/)
  if (!match) throw new Error('Unable to parse timezone offset')
  if (!match[1]) return 0
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  const offset = ((hours * 60 + minutes) * 60 * 1000)

  return offset
}
