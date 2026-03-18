import { memo, useMemo, useState } from 'react'
import { RiPencilLine } from '@remixicon/react'
import { toHostname } from '../utils/url'

const WebsiteTile = memo(function WebsiteTile({
  website,
  onEdit,
  className = '',
  isDragging = false,
  dragMode = false,
  shouldSuppressNavigation,
}) {
  const [faviconMissing, setFaviconMissing] = useState(false)
  const hostname = useMemo(() => toHostname(website.url), [website.url])
  const fallbackLetter = website.name?.charAt(0)?.toUpperCase() || '?'
  const tooltip = `${website.name} - ${hostname}`

  return (
    <article
      className={`group relative aspect-square ${className} ${
        isDragging ? 'z-20' : ''
      }`}
    >
      <a
        href={website.url}
        target="_blank"
        rel="noopener noreferrer"
        title={tooltip}
        onClick={(event) => {
          if (!shouldSuppressNavigation?.()) {
            return
          }
          event.preventDefault()
          event.stopPropagation()
        }}
        className={`focus-ring flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-black/95 p-1.5 transition duration-200 hover:-translate-y-0.5 hover:border-[color:rgb(var(--accent-rgb)/0.65)] ${
          dragMode ? 'pointer-events-none' : ''
        }`}
      >
        {website.faviconUrl && !faviconMissing ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-1 shadow-[0_0_20px_-8px_rgb(var(--accent-rgb)/0.85)] transition group-hover:shadow-[0_0_30px_-8px_rgb(var(--accent-rgb)/1)]">
            <img
              src={website.faviconUrl}
              alt=""
              loading="lazy"
              className="h-12 w-12 rounded-lg bg-slate-800 object-cover"
              onError={() => setFaviconMissing(true)}
            />
          </div>
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-base font-bold text-slate-300 shadow-[0_0_20px_-10px_rgb(var(--accent-rgb)/0.85)]">
            {fallbackLetter}
          </div>
        )}

        <span className="w-full truncate px-1 text-center text-[10px] font-medium leading-tight text-slate-200">
          {website.name}
        </span>
      </a>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (dragMode) {
            return
          }
          onEdit(website)
        }}
        className={`focus-ring absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md border border-slate-700 bg-black text-xs text-slate-300 opacity-0 transition hover:text-[var(--accent-color)] group-hover:opacity-100 ${
          dragMode ? 'pointer-events-none opacity-0' : ''
        }`}
        title={`Edit ${website.name}`}
      >
        <RiPencilLine className="h-3 w-3" aria-hidden="true" />
      </button>
    </article>
  )
})

export default WebsiteTile
