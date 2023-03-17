export default function dhmsToMilliseconds ({
  negative = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  decimals = 0,
  ceil = true,
}) {
  let ms = (days * 86400000) + (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + (decimals * 100)
  if (ceil && !negative && decimals > 0) ms -= 1000
  if (!ceil && negative && decimals > 0) ms -= 1000
  const prefix = negative ? -1 : 1
  return prefix * ms
}
