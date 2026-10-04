/**
 * Creates a notify function that shows an Owlbear notification when running
 * inside Owlbear Rodeo and is a no-op otherwise (standalone page, or before
 * the SDK handshake has completed).
 * @param {object} obr - The Owlbear SDK object (or a stand-in for tests).
 * @returns {(message: string) => void} The notify function.
 */
export function createNotifier(obr) {
  let ready = false
  if (obr.isAvailable) {
    obr.onReady(() => {
      ready = true
    })
  }

  return function notify(message) {
    if (!ready) return
    obr.notification.show(message).catch(() => {})
  }
}
