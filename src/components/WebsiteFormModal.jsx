import { useState } from 'react'
import ModalShell from './ModalShell'

export default function WebsiteFormModal({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
  onRequestDelete,
  onResult,
}) {
  const [values, setValues] = useState(() => ({
    name: initialValues?.name || '',
    url: initialValues?.url || '',
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const title = mode === 'edit' ? 'Edit Website' : 'Add Website'

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const result = await onSubmit(values)
    onResult?.(result, { mode, values })
    if (!result?.ok) {
      setErrorMessage(result?.error || 'Unable to save website.')
      setIsSubmitting(false)
      return
    }

    onClose()
  }

  return (
    <ModalShell isOpen={isOpen} title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-200">Website Name</span>
          <input
            name="name"
            value={values.name}
            onChange={handleFieldChange}
            autoFocus
            required
            maxLength={80}
            className="focus-ring glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-100"
            placeholder="Example: Docs Portal"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-200">Website URL</span>
          <input
            name="url"
            value={values.url}
            onChange={handleFieldChange}
            required
            maxLength={500}
            className="focus-ring glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-100"
            placeholder="https://example.com"
          />
          <p className="text-xs text-slate-400">
            You can type with or without protocol. HTTP/HTTPS only.
          </p>
        </label>

        {errorMessage ? (
          <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 backdrop-blur-md">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={onRequestDelete}
              className="focus-ring rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18"
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
              className="focus-ring glass-button rounded-xl px-4 py-2 text-sm font-semibold text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring accent-bg accent-border accent-shadow rounded-xl border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Website'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
