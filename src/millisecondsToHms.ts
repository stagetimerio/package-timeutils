import type { HMS } from './types'

export default function millisecondsToHms(ms = 0): HMS {
  return {
    hours: Math.floor(ms / 3600000) || 0,
    minutes: Math.floor((ms % 3600000) / 60000) || 0,
    seconds: Math.floor((ms % 60000) / 1000) || 0,
    decimals: Math.floor((ms % 1000) / 100) || 0,
  }
}
