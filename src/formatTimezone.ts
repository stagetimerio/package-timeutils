import abbreviations from './abbreviations'

type FormatOption = 'city' | 'long' | 'abbr' | 'offset'

/**
 * Formats an IANA timezone string into a specified representation.
 *
 * Support for timeZoneName = 'longOffset'
 *   - Chrome 95
 *   - Edge 95
 *   - Firefox 91
 *   - Safari 15.4
 *   - Node.js 17
 *
 * @param {string} timezone - The IANA timezone string, e.g., 'America/Los_Angeles'.
 * @param {string|string[]} format - One of 'long', 'abbr', 'offset', or an array of these values.
 * @param {Date} date - The reference date used to determine the 'long', 'abbr' and 'offset'
 * @return {string} The formatted timezone string.
 */
export default function formatTimezone (
  timezone: string,
  format: FormatOption | FormatOption[] = 'long',
  date: Date = new Date(),
): string {
  if (!timezone) return ''

  const formatOpts: Intl.DateTimeFormatOptions & { timeZone: string } = { timeZone: timezone }
  const formatArray = Array.isArray(format) ? format : [format]

  for (const fmt of formatArray) {
    switch (fmt) {
      case 'city': {
        const parts = timezone.split('/')
        return `${parts[0]} / ${parts.pop()}`.replace(/_/g, ' ')
      }

      case 'long':
        formatOpts.timeZoneName = 'long'
        return new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1] ?? ''

      case 'abbr': {
        formatOpts.timeZoneName = 'long'
        const long = new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1]
        if (!long) break
        const abbrMap = abbreviations as Record<string, string>
        const abbr = abbrMap[long] || abbrMap[long.replace('Standard ', '')]
        if (abbr) return abbr
        break
      }

      case 'offset': {
        let offset = ''
        try {
          formatOpts.timeZoneName = 'longOffset'
          offset = new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1] ?? ''
        } catch {
          formatOpts.timeZoneName = 'short'
          offset = new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1] ?? ''
        }
        return offset === 'GMT' ? 'GMT+00:00' : offset
      }

      default:
        throw new Error('Format option must be one of \'city\', \'long\', \'abbr\' or \'offset\'')
    }
  }

  return ''
}
