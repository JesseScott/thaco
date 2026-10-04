import assert from 'node:assert/strict'
import test from 'node:test'
import { clampHeight } from './popover.js'

test('clampHeight rounds up to a whole number of pixels', () => {
  assert.equal(clampHeight(333.2), 334)
})

test('clampHeight keeps the height within the min and max', () => {
  assert.equal(clampHeight(50, 200, 800), 200)
  assert.equal(clampHeight(1200, 200, 800), 800)
  assert.equal(clampHeight(421, 200, 800), 421)
})
