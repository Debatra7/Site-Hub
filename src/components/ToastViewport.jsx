import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiInformationLine,
} from '@remixicon/react'

const toneClassByType = {
  success: 'toast-tone-success',
  error: 'toast-tone-error',
  info: 'toast-tone-info',
  delete: 'toast-tone-delete',
}

const iconByType = {
  success: RiCheckLine,
  error: RiErrorWarningLine,
  info: RiInformationLine,
  delete: RiDeleteBinLine,
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) {
    return null
  }

  return (
    <section
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-3 top-14 z-[80] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:top-16"
    >
      {toasts.map((toast) => {
        const Icon = iconByType[toast.type] || RiInformationLine
        const toneClass = toneClassByType[toast.type] || toneClassByType.info

        return (
          <article
            key={toast.id}
            className={`toast-enter toast-glass pointer-events-auto rounded-xl border px-3 py-2.5 ${toneClass}`}
            role="status"
          >
            <div className="flex items-start gap-2.5">
              <span className="toast-icon-pop toast-icon-wrap mt-[0.1rem] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-slate-200/85">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="focus-ring rounded-md p-1 text-slate-200/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <RiCloseLine className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        )
      })}
    </section>
  )
}
