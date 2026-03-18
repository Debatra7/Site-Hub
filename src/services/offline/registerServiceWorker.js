export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep registration errors silent for offline-first local usage.
    })
  })
}
