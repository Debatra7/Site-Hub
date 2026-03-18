import { useState } from 'react'
import ModalShell from './ModalShell'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onClose,
  onConfirm,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) {
    return null
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setErrorMessage('')

    const result = await onConfirm()
    if (!result?.ok) {
      setErrorMessage(result?.error || 'Action failed.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onClose()
  }

  return (
    <ModalShell isOpen={isOpen} title={title} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-slate-300">{message}</p>

        {errorMessage ? (
          <p className="rounded-xl border border-rose-900/60 bg-rose-950/35 px-3 py-2 text-sm text-rose-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="focus-ring rounded-xl border border-rose-900 bg-rose-800/85 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
