export interface HMS {
  hours: number
  minutes: number
  seconds: number
  decimals: number
}

export interface DHMS extends HMS {
  negative: number // Rename to overtime
  days: number
}

export type SecondsDisplay = 'nonzero' | 'never'

/**
 * Duration format string. Parsed character-by-character via .includes():
 *
 *   D — show days component
 *   H — show hours component
 *   M — show minutes component
 *   S — show seconds component
 *   F — show fractional seconds (tenths)
 *   L — use letter separators (d h m s) instead of colons (:)
 *
 * Standard formats (defined as constants in @stagetimerio/shared):
 *   'HHHMMSS'  →  41:30:59         'L_DHMS' →  1d 17h 30m 59s
 *   'DHHMMSS'  →  1:17:30:59       'L_HMS'  →  41h 30m 59s
 *   'MMMSS'    →  230:59           'L_MS'   →  230m 59s
 *   'SSS'      →  92               'L_S'    →  92s
 *   Append 'F' for decimals:       'L_D', 'L_DH', 'L_DHM' for truncated
 *   'HHHMMSSF' →  41:30:59.5
 *
 * Repeated chars are cosmetic — only presence matters.
 * Any string with the right characters works: 'HMS' = 'HHHMMSS' = 'H_M_S'.
 */
export type DurationFormat = string

export type ZeroDisplay = 'always' | 'nonzero' | 'never'
