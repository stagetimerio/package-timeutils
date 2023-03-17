export default function hmsToMilliseconds ({ hours = 0, minutes = 0, seconds = 0 } = {}) {
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000)
}
