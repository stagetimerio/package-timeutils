/**
 * Checks if a given time zone is valid.
 *
 * This function verifies whether a given time zone identifier is valid by
 * attempting to create a DateTimeFormat object with the provided time zone.
 *
 * @param {string} tz - The time zone identifier to be validated.
 * @returns {boolean} - Returns true if the time zone is valid, otherwise false.
 * @throws {Error} - Throws an error if the environment does not support time zones.
 *
 * @example
 * isValidTimeZone('America/New_York') // true
 * isValidTimeZone('Invalid/Timezone') // false
 */
export function isValidTimezone(tz: string): boolean {
  if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
    throw new Error('Time zones are not available in this environment')
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}
