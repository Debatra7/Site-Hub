import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 3600

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, description = '', type = 'info', durationMs = DEFAULT_DURATION_MS }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((current) => {
        const next = [...current, { id, title, description, type }]
        return next.slice(-5)
      })

      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(id)
        }, durationMs)
        timeoutsRef.current.set(id, timeoutId)
      }

      return id
    },
    [dismissToast],
  )

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutsRef.current.clear()
    },
    [],
  )

  return {
    toasts,
    pushToast,
    dismissToast,
  }
}
