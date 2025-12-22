export interface HMS {
  hours: number
  minutes: number
  seconds: number
  decimals: number
}

export interface DHMS extends HMS {
  negative: number
  days: number
}

export type TimeFormat = '12h' | '12h_a' | '24h'
export type SecondsDisplay = 'always' | 'nonzero' | 'never'

export type CountdownFormatCode =
  | 'DHHMMSS'
  | 'DHHMMSSF'
  | 'HHHMMSS'
  | 'HHHMMSSF'
  | 'MMMSS'
  | 'MMMSSF'
  | 'SSS'
  | 'SSSF'
  | 'L_D'
  | 'L_DH'
  | 'L_DHM'
  | 'L_DHMS'
  | 'L_HMS'
  | 'L_MS'
  | 'L_S'
