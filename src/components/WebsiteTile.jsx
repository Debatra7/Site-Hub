import { memo, useEffect, useMemo, useState } from 'react'
import { RiPencilLine } from '@remixicon/react'
import { buildFaviconCandidates, toHostname } from '../utils/url'

const WebsiteTile = memo(function WebsiteTile({
  website,
  onEdit,
  className = '',
  isDragging = false,
  dragMode = false,
  shouldSuppressNavigation,
}) {
  const [faviconIndex, setFaviconIndex] = useState(0)
  const [faviconMissing, setFaviconMissing] = useState(false)
  const hostname = useMemo(() => toHostname(website.url), [website.url])
  const faviconCandidates = useMemo(
    () => buildFaviconCandidates(website.url, website.faviconUrl),
    [website.url, website.faviconUrl],
  )
  const currentFaviconUrl = faviconCandidates[faviconIndex] || ''
  const fallbackLetter = website.name?.charAt(0)?.toUpperCase() || '?'
  const tooltip = `${website.name} - ${hostname}`

  useEffect(() => {
    setFaviconIndex(0)
    setFaviconMissing(false)
  }, [website.url, website.faviconUrl])

  const handleFaviconError = () => {
    if (faviconIndex < faviconCandidates.length - 1) {
      setFaviconIndex((index) => index + 1)
      return
    }

    setFaviconMissing(true)
  }

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
        className={`focus-ring glass-panel flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg p-1 transition duration-200 hover:-translate-y-0.5 hover:border-[color:rgb(var(--accent-rgb)/0.55)] ${
          dragMode ? 'pointer-events-none' : ''
        }`}
      >
        {currentFaviconUrl && !faviconMissing ? (
          <div className="glass-panel-soft rounded-lg p-0.5 transition group-hover:border-[color:rgb(var(--accent-rgb)/0.4)]">
            <img
              src={currentFaviconUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-md bg-slate-900/70 object-cover sm:h-10 sm:w-10"
              onError={handleFaviconError}
            />
          </div>
        ) : (
          <div className="glass-panel-soft grid h-10 w-10 place-items-center rounded-lg text-sm font-bold text-slate-300 sm:h-11 sm:w-11">
            {fallbackLetter}
          </div>
        )}

        <span className="w-full truncate px-0.5 text-center text-[9px] font-medium leading-tight text-slate-200">
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
        className={`focus-ring glass-button absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-md text-xs text-slate-300 opacity-0 transition hover:text-[var(--accent-color)] group-hover:opacity-100 ${
          dragMode ? 'pointer-events-none opacity-0' : ''
        }`}
        title={`Edit ${website.name}`}
      >
        <RiPencilLine className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </article>
  )
})

export default WebsiteTile
