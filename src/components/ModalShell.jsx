import { useEffect } from 'react'

export default function ModalShell({
  isOpen,
  title,
  onClose,
  children,
  panelClassName = '',
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(2_6_12/0.62)] p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className={`glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl ${panelClassName}`.trim()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring glass-button rounded-lg px-3 py-1 text-xs font-semibold text-slate-300"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
