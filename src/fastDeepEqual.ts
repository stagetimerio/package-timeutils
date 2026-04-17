/**
 * Performs a fast deep equality comparison between two values.
 *
 * This function efficiently compares two values for deep equality, handling
 * primitives, objects, arrays, and Date objects. It's optimized for performance
 * while still providing a thorough deep comparison.
 *
 * @param value1 The first value to compare.
 * @param value2 The second value to compare.
 * @returns {boolean} True if the values are deeply equal, false otherwise.
 *
 * @example
 * fastDeepEqual({a: [1, 2], b: {c: 3}}, {a: [1, 2], b: {c: 3}}); // returns true
 * fastDeepEqual({a: 1}, {a: '1'}); // returns false
 *
 * @remarks
 * - This function does not handle circular references.
 * - Functions are compared by reference, not by their string representation.
 * - `NaN` is considered equal to itself, unlike in standard equality comparisons.
 */
export function fastDeepEqual (value1: unknown, value2: unknown): boolean {
  // Quick equality check for primitives or same reference
  if (value1 === value2) return true

  // Specifically check for NaN
  if (typeof value1 === 'number' && isNaN(value1)) return value1 !== value1 && value2 !== value2

  // Check for null or non-objects
  if (value1 == null || value2 == null || typeof value1 !== 'object' || typeof value2 !== 'object') {
    return value1 === value2
  }

  // Check if constructors are the same
  if (value1.constructor !== value2.constructor) return false

  // Special handling for Date objects
  if (value1 instanceof Date) {
    return (value2 instanceof Date) && value1.getTime() === value2.getTime()
  }

  // Handle arrays
  if (Array.isArray(value1)) {
    if (!Array.isArray(value2) || value1.length !== value2.length) return false
    for (let i = 0; i < value1.length; i++) {
      if (!fastDeepEqual(value1[i], value2[i])) return false
    }
    return true
  }

  // Handle objects
  const v1 = value1 as Record<string, unknown>
  const v2 = value2 as Record<string, unknown>
  for (const key in v1) {
    if (!fastDeepEqual(v1[key], v2[key])) return false
  }

  for (const key in v2) {
    if (!(key in v1)) return false
  }

  return true
}
