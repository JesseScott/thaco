/**
 * Clamps a number between min and max values.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculates the roll threshold needed to hit a target AC.
 * @param {number} thaco - The THAC0 value.
 * @param {number} ac - The Armor Class of the target.
 * @param {number} bonus - The attack bonus.
 * @returns {number} The threshold roll (before clamping).
 */
export function calculateThreshold(thaco, ac, bonus) {
  return thaco - ac - bonus
}

/**
 * Gets the needed roll, clamped between 1 and 20.
 * @param {number} thaco - The THAC0 value.
 * @param {number} ac - The Armor Class.
 * @param {number} bonus - The attack bonus.
 * @returns {number} The needed roll (1-20).
 */
export function getNeededRoll(thaco, ac, bonus) {
  const threshold = calculateThreshold(thaco, ac, bonus)
  return clamp(threshold, 1, 20)
}

/**
 * Determines if a roll hits based on the needed roll.
 * Natural 20 always hits, natural 1 always misses.
 * @param {number} roll - The d20 roll (1-20).
 * @param {number} needed - The needed roll to hit.
 * @returns {boolean} True if the roll hits.
 */
export function isHit(roll, needed) {
  const autoHit = roll === 20
  const autoMiss = roll === 1
  return autoHit || (!autoMiss && roll >= needed)
}

/**
 * Calculates the implied THAC0 from a roll, AC, and bonus.
 * @param {number} roll - The d20 roll.
 * @param {number} ac - The Armor Class.
 * @param {number} bonus - The attack bonus.
 * @returns {number} The implied THAC0.
 */
export function impliedThaco(roll, ac, bonus) {
  return roll + ac + bonus
}
