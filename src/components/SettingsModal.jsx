import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RiAiGenerateText,
  RiArrowLeftLine,
  RiClipboardLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiFileDownloadLine,
  RiFileUploadLine,
  RiPaletteLine,
  RiRefreshLine,
  RiUpload2Line,
} from '@remixicon/react'
import ModalShell from './ModalShell'

const DEFAULT_ACCENT_COLOR = '#ef4444'
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

const ACCENT_PRESETS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
]

const PANEL_ROOT = 'root'
const PANEL_THEME = 'theme'
const PANEL_DATA = 'data'
const PANEL_IMPORT = 'import'
const PANEL_EXPORT = 'export'
const PANEL_RESET = 'reset'

const cardButtonClass =
  'focus-ring glass-button w-full rounded-2xl border px-4 py-4 text-left transition hover:border-slate-300/45'

const actionButtonClass =
  'focus-ring glass-button rounded-lg px-4 py-2 text-sm font-semibold text-slate-200'

const buildExportFileName = () => {
  const dateStamp = new Date().toISOString().slice(0, 10)
  return `site-hub-export-${dateStamp}.json`
}

export default function SettingsModal({
  isOpen,
  onClose,
  accentColor,
  onAccentColorChange,
  onImportJson,
  onExportJson,
  onResetData,
  onDuplicateAllWebsites,
  categories = [],
}) {
  const [panel, setPanel] = useState(PANEL_ROOT)
  const [accentDraft, setAccentDraft] = useState(accentColor)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState('')

  const [importJson, setImportJson] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const [exportJson, setExportJson] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const fileInputRef = useRef(null)

  const websiteCount = useMemo(
    () =>
      categories.reduce(
        (total, category) => total + (category.websites?.length || 0),
        0,
      ),
    [categories],
  )

  useEffect(() => {
    setAccentDraft(accentColor)
  }, [accentColor])

  useEffect(() => {
    if (!isOpen) {
      setPanel(PANEL_ROOT)
    }
  }, [isOpen])

  const closeAll = () => {
    setPanel(PANEL_ROOT)
    onClose()
  }

  const goBack = () => {
    if (panel === PANEL_THEME || panel === PANEL_DATA) {
      setPanel(PANEL_ROOT)
      return
    }
    if (panel === PANEL_IMPORT || panel === PANEL_EXPORT || panel === PANEL_RESET) {
      setPanel(PANEL_DATA)
    }
  }

  const handleAccentChange = (value) => {
    const normalized = value.toLowerCase()
    setAccentDraft(normalized)
    void onAccentColorChange(normalized)
  }

  const handleAccentInputChange = (event) => {
    const value = event.target.value
    setAccentDraft(value)

    if (HEX_COLOR_REGEX.test(value)) {
      void onAccentColorChange(value.toLowerCase())
    }
  }

  const handleAccentInputBlur = () => {
    if (!HEX_COLOR_REGEX.test(accentDraft)) {
      setAccentDraft(accentColor)
      return
    }

    const normalized = accentDraft.toLowerCase()
    setAccentDraft(normalized)
    if (normalized !== accentColor) {
      void onAccentColorChange(normalized)
    }
  }

  const handlePasteImport = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText.trim()) {
        setImportError('Clipboard is empty.')
        setImportMessage('')
        return
      }

      setImportJson(clipboardText)
      setImportError('')
      setImportMessage('Pasted from clipboard.')
    } catch {
      setImportError('Clipboard access was blocked. Paste manually.')
      setImportMessage('')
    }
  }

  const handlePickImportFile = () => {
    fileInputRef.current?.click()
  }

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const contents = await file.text()
      if (!contents.trim()) {
        setImportError('Selected file is empty.')
        setImportMessage('')
        return
      }

      setImportJson(contents)
      setImportError('')
      setImportMessage(`Loaded ${file.name}.`)
    } catch {
      setImportError('Unable to read selected file.')
      setImportMessage('')
    }
  }

  const handleImport = async () => {
    if (!importJson.trim()) {
      setImportError('Paste or load JSON data first.')
      setImportMessage('')
      return
    }

    setIsImporting(true)
    setImportMessage('')
    setImportError('')
    const result = await onImportJson(importJson)
    setIsImporting(false)

    if (!result?.ok) {
      setImportError(result?.error || 'Import failed.')
      return
    }

    setImportMessage('Import completed successfully.')
    setImportError('')
  }

  const handleGenerateExport = async () => {
    setIsExporting(true)
    setExportMessage('')
    const result = await onExportJson()
    setIsExporting(false)

    if (!result?.ok) {
      setExportMessage(result?.error || 'Export failed.')
      return
    }

    setExportJson(result.json)
    setExportMessage('Export generated. Copy or download it.')
  }

  const handleCopyExport = async () => {
    if (!exportJson) {
      return
    }

    try {
      await navigator.clipboard.writeText(exportJson)
      setExportMessage('Export JSON copied to clipboard.')
    } catch {
      setExportMessage('Unable to copy automatically. Please copy manually.')
    }
  }

  const handleDownloadExport = () => {
    if (!exportJson) {
      return
    }

    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = buildExportFileName()
    anchor.click()
    URL.revokeObjectURL(url)
    setExportMessage('Export downloaded.')
  }

  const handleResetAll = async () => {
    const shouldReset = window.confirm(
      'Delete all categories and website cards and reset settings to default?',
    )
    if (!shouldReset) {
      return
    }

    setIsResetting(true)
    setResetMessage('')
    const result = await onResetData()
    setIsResetting(false)

    if (!result?.ok) {
      setResetMessage(result?.error || 'Reset failed.')
      return
    }

    setResetMessage('All data has been reset.')
  }

  const handleDuplicateAllWebsites = async () => {
    if (typeof onDuplicateAllWebsites !== 'function') {
      setDuplicateMessage('Feature not available.')
      return
    }

    const raw = window.prompt(
      'Duplicate all website cards how many times? Enter an integer >= 2.',
      '2',
    )
    if (raw === null) {
      return
    }

    const multiplier = Number(raw)
    if (!Number.isInteger(multiplier) || multiplier < 2) {
      setDuplicateMessage('Please enter a whole number greater than or equal to 2.')
      return
    }

    setIsDuplicating(true)
    setDuplicateMessage('')

    const result = await onDuplicateAllWebsites(multiplier)
    setIsDuplicating(false)

    if (!result?.ok) {
      setDuplicateMessage(result?.error || 'Duplication failed.')
      return
    }

    setDuplicateMessage(`Duplicated all websites ${multiplier}x in each category.`)
  }

  const BackButton = (
    <button
      type="button"
      onClick={goBack}
      className="focus-ring glass-button inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-slate-200"
    >
      <RiArrowLeftLine className="h-3.5 w-3.5" aria-hidden="true" />
      Back
    </button>
  )

  return (
    <>
      <ModalShell isOpen={isOpen && panel === PANEL_ROOT} title="Settings" onClose={closeAll}>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setPanel(PANEL_THEME)}
            className={cardButtonClass}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <RiPaletteLine className="h-4 w-4" aria-hidden="true" />
              Theme
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              Accent color and visual style.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPanel(PANEL_DATA)}
            className={cardButtonClass}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <RiDatabase2Line className="h-4 w-4" aria-hidden="true" />
              Data
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              Import, export, and reset workspace data.
            </span>
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && panel === PANEL_THEME}
        title="Theme"
        onClose={closeAll}
      >
        <div className="space-y-4">
          <div>{BackButton}</div>
          <section className="glass-panel-soft space-y-4 rounded-2xl border p-4">
            <p className="text-sm text-slate-400">
              Pick an accent color for highlights, focus rings, and active states.
            </p>

            <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-start">
              <label
                htmlFor="accent-color-wheel"
                className="glass-panel-soft flex h-24 w-24 cursor-pointer items-center justify-center rounded-full"
              >
                <input
                  id="accent-color-wheel"
                  type="color"
                  value={accentColor}
                  onChange={(event) => handleAccentChange(event.target.value)}
                  className="h-20 w-20 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
              </label>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={accentDraft}
                    onChange={handleAccentInputChange}
                    onBlur={handleAccentInputBlur}
                    maxLength={7}
                    className="focus-ring glass-input w-full rounded-xl px-3 py-2 text-sm text-slate-100 sm:max-w-[11rem]"
                    placeholder="#EF4444"
                  />
                  <button
                    type="button"
                    onClick={() => handleAccentChange(DEFAULT_ACCENT_COLOR)}
                    className={actionButtonClass}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RiRefreshLine className="h-4 w-4" aria-hidden="true" />
                      Reset Default
                    </span>
                  </button>
                </div>

                <div>
                  <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <RiPaletteLine className="h-3.5 w-3.5" aria-hidden="true" />
                    Quick Presets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleAccentChange(color)}
                        className={`focus-ring h-7 w-7 rounded-full border transition ${
                          accentColor.toLowerCase() === color.toLowerCase()
                            ? 'border-slate-50'
                            : 'border-slate-500/40 hover:border-slate-300/75'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color.toUpperCase()}
                        aria-label={`Set accent to ${color.toUpperCase()}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && panel === PANEL_DATA}
        title="Data"
        onClose={closeAll}
      >
        <div className="space-y-4">
          <div>{BackButton}</div>

          <section className="glass-panel-soft grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-500/25 bg-slate-900/30 px-3 py-2">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
                <RiFileUploadLine className="h-3.5 w-3.5" aria-hidden="true" />
                Categories
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {categories.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-500/25 bg-slate-900/30 px-3 py-2">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
                <RiDatabase2Line className="h-3.5 w-3.5" aria-hidden="true" />
                Website Cards
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {websiteCount}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setPanel(PANEL_IMPORT)}
              className={cardButtonClass}
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                <RiFileUploadLine className="h-4 w-4" aria-hidden="true" />
                Import JSON
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                Load data from clipboard or JSON file.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPanel(PANEL_EXPORT)}
              className={cardButtonClass}
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                <RiFileDownloadLine className="h-4 w-4" aria-hidden="true" />
                Export JSON
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                Generate and save a full backup.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPanel(PANEL_RESET)}
              className="focus-ring w-full rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-4 text-left transition hover:bg-rose-500/18"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-100">
                <RiDeleteBinLine className="h-4 w-4" aria-hidden="true" />
                Delete Everything
              </span>
              <span className="mt-1 block text-xs text-rose-200/80">
                Permanently clears all categories, websites, and settings.
              </span>
            </button>
          </section>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && panel === PANEL_IMPORT}
        title="Import JSON"
        onClose={closeAll}
      >
        <div className="space-y-4">
          <div>{BackButton}</div>

          <section className="glass-panel-soft space-y-3 rounded-2xl border p-4">
            <p className="text-sm text-slate-400">
              Replaces current categories and website cards with imported data.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePasteImport}
                className={actionButtonClass}
              >
                <span className="inline-flex items-center gap-2">
                  <RiClipboardLine className="h-4 w-4" aria-hidden="true" />
                  Paste
                </span>
              </button>
              <button
                type="button"
                onClick={handlePickImportFile}
                className={actionButtonClass}
              >
                <span className="inline-flex items-center gap-2">
                  <RiFileUploadLine className="h-4 w-4" aria-hidden="true" />
                  Load File
                </span>
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="focus-ring accent-bg accent-border accent-shadow rounded-lg border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  <RiUpload2Line className="h-4 w-4" aria-hidden="true" />
                  {isImporting ? 'Importing...' : 'Import'}
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFileChange}
            />

            <textarea
              value={importJson}
              onChange={(event) => setImportJson(event.target.value)}
              rows={7}
              placeholder='{"categories":[...]}'
              className="focus-ring glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-200"
            />

            {importError ? (
              <p className="text-xs font-semibold text-rose-300">{importError}</p>
            ) : null}
            {importMessage ? (
              <p className="text-xs font-semibold text-emerald-300">
                {importMessage}
              </p>
            ) : null}
          </section>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && panel === PANEL_EXPORT}
        title="Export JSON"
        onClose={closeAll}
      >
        <div className="space-y-4">
          <div>{BackButton}</div>

          <section className="glass-panel-soft space-y-3 rounded-2xl border p-4">
            <p className="text-sm text-slate-400">
              Generate a backup of all categories and website cards.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateExport}
                disabled={isExporting}
                className="focus-ring accent-bg accent-border accent-shadow rounded-lg border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  <RiAiGenerateText className="h-4 w-4" aria-hidden="true" />
                  {isExporting ? 'Generating...' : 'Generate'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleCopyExport}
                disabled={!exportJson}
                className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="inline-flex items-center gap-2">
                  <RiFileCopyLine className="h-4 w-4" aria-hidden="true" />
                  Copy
                </span>
              </button>
              <button
                type="button"
                onClick={handleDownloadExport}
                disabled={!exportJson}
                className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="inline-flex items-center gap-2">
                  <RiFileDownloadLine className="h-4 w-4" aria-hidden="true" />
                  Download
                </span>
              </button>
            </div>

            {exportMessage ? (
              <p className="text-xs font-semibold text-slate-300">{exportMessage}</p>
            ) : null}

            <textarea
              value={exportJson}
              readOnly
              rows={7}
              placeholder="Click Generate to preview JSON."
              className="glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-200"
            />
          </section>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && panel === PANEL_RESET}
        title="Delete Everything"
        onClose={closeAll}
      >
        <div className="space-y-4">
          <div>{BackButton}</div>

          <section className="space-y-3 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-100">
              Deletes all categories, website cards, and settings data.
            </p>
            <p className="text-xs text-rose-200/85">
              This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={handleResetAll}
              disabled={isResetting}
              className="focus-ring rounded-lg border border-rose-400/35 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/24 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <RiDeleteBinLine className="h-4 w-4" aria-hidden="true" />
                {isResetting ? 'Deleting...' : 'Delete Everything'}
              </span>
            </button>

            {resetMessage ? (
              <p className="text-xs font-semibold text-rose-100">{resetMessage}</p>
            ) : null}
          </section>
        </div>
      </ModalShell>
    </>
  )
}
