import assert from 'node:assert/strict'
import test from 'node:test'
import { clamp, calculateThreshold, getNeededRoll, isHit, impliedThaco } from './thaco.js'

test('calculateThreshold returns THAC0 - AC - bonus', () => {
  assert.equal(calculateThreshold(18, 14, 2), 2)
  assert.equal(calculateThreshold(0, 10, 5), -15)
})

test('getNeededRoll clamps threshold between 1 and 20', () => {
  assert.equal(getNeededRoll(5, 20, 0), 1)
  assert.equal(getNeededRoll(25, 1, 0), 20)
  assert.equal(getNeededRoll(15, 10, 0), 5)
})

test('isHit handles natural 20 auto-hit and natural 1 auto-miss', () => {
  assert.equal(isHit(20, 20), true)
  assert.equal(isHit(1, 1), false)
  assert.equal(isHit(1, 20), false)
  assert.equal(isHit(19, 19), true)
  assert.equal(isHit(18, 19), false)
})

test('impliedThaco calculates the roll + AC + bonus', () => {
  assert.equal(impliedThaco(15, 12, 3), 30)
})
