import { useEffect } from 'react'

export default function ModalShell({ isOpen, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="w-full max-w-lg rounded-3xl border border-slate-700 bg-black p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg border border-slate-700 bg-black px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-500"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
