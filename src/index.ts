/*!
 * @stagetimerio/timeutils
 * © Lukas Hermann <hey@lukashermann.dev>
 * All rights reserved.
 */

export { default as millisecondsToHms } from './millisecondsToHms'
export { default as millisecondsToDhms } from './millisecondsToDhms'
export { default as hmsToMilliseconds } from './hmsToMilliseconds'
export { default as dhmsToMilliseconds } from './dhmsToMilliseconds'
export { default as isValidDate } from './isValidDate'
export { default as parseDate } from './parseDate'
export { default as getToday } from './getToday'
export { default as getTomorrow } from './getTomorrow'
export { default as parseDateAsToday } from './parseDateAsToday'
export { default as abbreviations } from './abbreviations'
export { default as formatTimezone } from './formatTimezone'
export { default as isSameDay } from './isSameDay'
export { fastDeepEqual } from './fastDeepEqual'
export { default as createTimestamps } from './createTimestamps'
export type {
  TimerType,
  TimerTrigger,
  TimestampState,
  TimerInput,
  TimesetInput,
  MemoryTimerEntry,
  MemoryInput,
  Timestamp,
} from './createTimestamps'
export * from './applyDate'
export * from './formatTimeOfDay'
export * from './dhmsToDigits'
export * from './formatDuration'
export * from './formatDurationInWords'
export * from './isValidTimezone'
export * from './getTimezoneOffset'
export * from './moveAfter'

export type { HMS, DHMS, SecondsDisplay, TenthsDisplay, DurationFormat, ZeroDisplay } from './types'
