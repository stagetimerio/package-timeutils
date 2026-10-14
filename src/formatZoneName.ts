// Building an Intl.DateTimeFormat costs far more than formatting with one, and timing code
// asks per cue. One formatter per zone and name, kept for good: there are only a few hundred zones.
const formats = new Map<string, Intl.DateTimeFormat>()

/**
 * The zone part of `date` formatted in `timezone`, e.g. 'GMT+02:00' for 'longOffset'.
 *
 * @throws {RangeError} For an unknown timezone, or a `timeZoneName` the runtime does not support.
 */
export function formatZoneName (
  timezone: string,
  timeZoneName: 'long' | 'short' | 'longOffset',
  date: Date,
): string {
  const key = `${timezone} ${timeZoneName}`
  let format = formats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName })
    formats.set(key, format)
  }
  return format.format(date).split(', ')[1] ?? ''
}

