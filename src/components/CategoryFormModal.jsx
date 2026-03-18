import { useState } from 'react'
import ModalShell from './ModalShell'

export default function CategoryFormModal({
  isOpen,
  mode,
  initialName,
  onClose,
  onSubmit,
  onRequestDelete,
}) {
  const [name, setName] = useState(() => initialName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const title = mode === 'edit' ? 'Rename Category' : 'Create Category'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const result = await onSubmit({ name })
    if (!result?.ok) {
      setErrorMessage(result?.error || 'Unable to save category.')
      setIsSubmitting(false)
      return
    }

    onClose()
  }

  return (
    <ModalShell isOpen={isOpen} title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-200">Category Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
            maxLength={60}
            className="focus-ring w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Example: Work Tools"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-xl border border-rose-900/60 bg-rose-950/35 px-3 py-2 text-sm text-rose-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={onRequestDelete}
              className="focus-ring rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-700"
            >
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring accent-bg accent-border rounded-xl border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Name' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
