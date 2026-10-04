/**
 * Rounds a height up to whole pixels and keeps it within the allowed range.
 * @param {number} height - The measured content height.
 * @param {number} min - The smallest popover height to request.
 * @param {number} max - The largest popover height to request.
 * @returns {number} The height to request.
 */
export function clampHeight(height, min = 200, max = 800) {
  return Math.min(Math.max(Math.ceil(height), min), max)
}

/**
 * Keeps the Owlbear popover as tall as the element's content. Does nothing
 * outside Owlbear. Requests are only sent once the SDK is ready and only when
 * the height actually changes.
 * @param {object} obr - The Owlbear SDK object (or a stand-in for tests).
 * @param {HTMLElement} element - The element whose height the popover follows.
 */
export function syncPopoverHeight(obr, element) {
  if (!obr.isAvailable) return

  let ready = false
  let wanted = null
  let sent = null

  function push() {
    if (!ready || wanted === null || wanted === sent) return
    sent = wanted
    obr.action.setHeight(wanted).catch(() => {})
  }

  obr.onReady(() => {
    ready = true
    push()
  })

  new ResizeObserver(() => {
    wanted = clampHeight(element.offsetHeight)
    push()
  }).observe(element)
}
