import { useState } from 'react'
import ModalShell from './ModalShell'

const itemButtonClass =
  'focus-ring w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-left text-sm font-semibold text-slate-300 transition hover:border-slate-500'

const subItemButtonClass =
  'focus-ring w-full rounded-lg border border-slate-800 bg-black px-3 py-2 text-left text-sm text-slate-400 transition hover:border-slate-600 hover:text-slate-200'

export default function SettingsModal({
  isOpen,
  onClose,
  accentColor,
  onAccentColorChange,
  onImportJson,
  onExportJson,
  onResetData,
}) {
  const [showDataControl, setShowDataControl] = useState(false)
  const [activePopup, setActivePopup] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [exportJson, setExportJson] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const openPopup = (name) => {
    setActivePopup(name)
  }

  const closePopup = () => {
    setActivePopup('')
  }

  const handleCloseSettings = () => {
    setActivePopup('')
    setShowDataControl(false)
    onClose()
  }

  const handleImport = async () => {
    if (!importJson.trim()) {
      setImportError('Paste JSON data first.')
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
    setExportMessage('Export generated. You can copy or download it.')
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
    anchor.download = 'site-hub-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
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

  return (
    <>
      <ModalShell isOpen={isOpen} title="Settings" onClose={handleCloseSettings}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => openPopup('theme')}
            className={itemButtonClass}
          >
            Theme
          </button>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowDataControl((value) => !value)}
              className={itemButtonClass}
            >
              Data Control
            </button>

            {showDataControl ? (
              <div className="space-y-2 pl-3">
                <button
                  type="button"
                  onClick={() => openPopup('import')}
                  className={subItemButtonClass}
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => openPopup('export')}
                  className={subItemButtonClass}
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => openPopup('reset')}
                  className={subItemButtonClass}
                >
                  Reset / Delete everything
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => openPopup('login')}
            className={itemButtonClass}
          >
            Login (Coming soon)
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleCloseSettings}
            className="focus-ring rounded-xl border border-slate-700 bg-black px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Close
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && activePopup === 'theme'}
        title="Theme"
        onClose={closePopup}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Click the color wheel to choose your accent color.
          </p>
          <div className="flex items-center gap-4">
            <label
              htmlFor="accent-color-wheel"
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-black"
            >
              <input
                id="accent-color-wheel"
                type="color"
                value={accentColor}
                onChange={(event) => onAccentColorChange(event.target.value)}
                className="h-16 w-16 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </label>
            <code className="rounded-md border border-slate-700 bg-black px-2 py-1 text-sm text-slate-300">
              {accentColor.toUpperCase()}
            </code>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && activePopup === 'import'}
        title="Import JSON"
        onClose={closePopup}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Paste exported JSON to replace current categories and website cards.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasteImport}
              className="focus-ring rounded-lg border border-slate-700 bg-black px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Paste
            </button>
          </div>
          <textarea
            value={importJson}
            onChange={(event) => setImportJson(event.target.value)}
            rows={8}
            placeholder='{"categories":[...]}'
            className="focus-ring w-full rounded-xl border border-slate-700 bg-black px-3 py-2 text-xs text-slate-200"
          />
          {importError ? (
            <p className="text-xs font-semibold text-rose-300">{importError}</p>
          ) : null}
          {importMessage ? (
            <p className="text-xs font-semibold text-emerald-300">{importMessage}</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="focus-ring accent-bg accent-border rounded-lg border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && activePopup === 'export'}
        title="Export JSON"
        onClose={closePopup}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Export current categories and website cards to JSON.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateExport}
              disabled={isExporting}
              className="focus-ring accent-bg accent-border rounded-lg border px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isExporting ? 'Generating...' : 'Generate Export'}
            </button>
            <button
              type="button"
              onClick={handleCopyExport}
              disabled={!exportJson}
              className="focus-ring rounded-lg border border-slate-700 bg-black px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handleDownloadExport}
              disabled={!exportJson}
              className="focus-ring rounded-lg border border-slate-700 bg-black px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download
            </button>
          </div>
          {exportMessage ? (
            <p className="text-xs font-semibold text-slate-300">{exportMessage}</p>
          ) : null}
          <textarea
            value={exportJson}
            readOnly
            rows={8}
            placeholder="Click Generate Export to view JSON."
            className="w-full rounded-xl border border-slate-700 bg-black px-3 py-2 text-xs text-slate-200"
          />
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && activePopup === 'reset'}
        title="Reset / Delete everything"
        onClose={closePopup}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            This will remove all categories and website cards, then recreate a fresh
            default workspace.
          </p>
          {resetMessage ? (
            <p className="text-xs font-semibold text-rose-300">{resetMessage}</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetAll}
              disabled={isResetting}
              className="focus-ring rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResetting ? 'Resetting...' : 'Reset Everything'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isOpen && activePopup === 'login'}
        title="Login (Coming soon)"
        onClose={closePopup}
      >
        <p className="text-sm text-slate-400">This feature is coming soon.</p>
      </ModalShell>
    </>
  )
}
