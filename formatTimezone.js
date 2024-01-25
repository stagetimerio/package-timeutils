import abbreviations from './abbreviations.js'

/**
 * Formats an IANA timezone string into a specified representation.
 *
 * @param {string} timezone - The IANA timezone string, e.g., 'America/Los_Angeles'.
 * @param {string|string[]} format - One of 'long', 'abbr', 'offset', or an array of these values.
 * @return {string} The formatted timezone string.
 */
export default function formatTimezone (timezone, format = 'long') {
  const date = new Date()
  const formatOpts = { timeZone: timezone }

  const formatArray = Array.isArray(format) ? format : [format]

  for (let fmt of formatArray) {
    switch (fmt) {
    case 'city':
      const parts = timezone.split('/')
      return `${parts[0]} / ${parts.pop()}`.replace(/_/g, ' ')

    case 'long':
      formatOpts.timeZoneName = 'long'
      return new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1]

    case 'abbr':
      formatOpts.timeZoneName = 'long'
      const long = new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1]
      const abbr = abbreviations[long] || abbreviations[long.replace('Standard ', '')]
      if (abbr) return abbr
      break

    case 'offset':
      formatOpts.timeZoneName = 'longOffset'
      const offset = new Intl.DateTimeFormat('en-US', formatOpts).format(date).split(', ')[1]
      return offset === 'GMT' ? 'GMT+00:00' : offset

    default:
      throw new Error('Invalid format option')
    }
  }

  return ''
}
