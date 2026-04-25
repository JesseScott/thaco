export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function calculateThreshold(thaco, ac, bonus) {
  return thaco - ac - bonus
}

export function getNeededRoll(thaco, ac, bonus) {
  const threshold = calculateThreshold(thaco, ac, bonus)
  return clamp(threshold, 1, 20)
}

export function isHit(roll, needed) {
  const autoHit = roll === 20
  const autoMiss = roll === 1
  return autoHit || (!autoMiss && roll >= needed)
}

export function impliedThaco(roll, ac, bonus) {
  return roll + ac + bonus
}
