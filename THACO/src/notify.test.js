import assert from 'node:assert/strict'
import test from 'node:test'
import { createNotifier } from './notify.js'

function fakeObr({ isAvailable = true, show = async () => 'id' } = {}) {
  const shown = []
  let readyCallback = null
  return {
    shown,
    becomeReady: () => readyCallback && readyCallback(),
    obr: {
      isAvailable,
      onReady: (callback) => {
        readyCallback = callback
      },
      notification: {
        show: (message) => {
          shown.push(message)
          return show(message)
        },
      },
    },
  }
}

test('notify calls OBR.notification.show with the message once ready', () => {
  const { obr, shown, becomeReady } = fakeObr()
  const notify = createNotifier(obr)
  becomeReady()
  notify('Rolled 14: HIT')
  assert.deepEqual(shown, ['Rolled 14: HIT'])
})

test('notify does nothing before the SDK is ready', () => {
  const { obr, shown } = fakeObr()
  const notify = createNotifier(obr)
  notify('too early')
  assert.deepEqual(shown, [])
})

test('notify does nothing outside Owlbear', () => {
  const { obr, shown, becomeReady } = fakeObr({ isAvailable: false })
  const notify = createNotifier(obr)
  becomeReady()
  notify('standalone')
  assert.deepEqual(shown, [])
})

test('notify swallows a rejected notification', async () => {
  const { obr, shown, becomeReady } = fakeObr({
    show: async () => {
      throw new Error('boom')
    },
  })
  const notify = createNotifier(obr)
  becomeReady()
  assert.doesNotThrow(() => notify('will reject'))
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(shown, ['will reject'])
})
