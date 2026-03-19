import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import CategoryTabs from './components/CategoryTabs'
import CategoryFormModal from './components/CategoryFormModal'
import ConfirmModal from './components/ConfirmModal'
import LoadingState from './components/LoadingState'
import SettingsModal from './components/SettingsModal'
import ToastViewport from './components/ToastViewport'
import WebsiteFormModal from './components/WebsiteFormModal'
import WebsiteGrid from './components/WebsiteGrid'
import { useToast } from './hooks/useToast'
import { useSiteHubStore } from './store/useSiteHubStore'

const WEBSITE_MODAL_DEFAULT = {
  isOpen: false,
  mode: 'create',
  categoryId: null,
  website: null,
  sessionKey: '0',
}

const CATEGORY_MODAL_DEFAULT = {
  isOpen: false,
  mode: 'create',
  category: null,
  sessionKey: '0',
}

const DELETE_MODAL_DEFAULT = {
  isOpen: false,
  type: '',
  payload: null,
  sessionKey: '0',
}

const nextSessionKey = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i
const BOOT_OVERLAY_FADE_MS = 420

const toRgb = (hexColor) => {
  if (!HEX_COLOR_REGEX.test(hexColor || '')) {
    return null
  }

  const value = hexColor.slice(1)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function App() {
  const {
    categories,
    primaryCategoryId,
    activeCategoryId,
    accentColor,
    isBootstrapping,
    initialized,
    errorMessage,
    showSettings,
    bootstrap,
    clearError,
    setAccentColor,
    exportData,
    importData,
    resetData,
    selectCategory,
    openSettings,
    closeSettings,
    createCategory,
    renameCategory,
    deleteCategory,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    reorderCategories,
    reorderWebsites,
  } = useSiteHubStore(
    useShallow((state) => ({
      categories: state.categories,
      primaryCategoryId: state.primaryCategoryId,
      activeCategoryId: state.activeCategoryId,
      accentColor: state.accentColor,
      isBootstrapping: state.isBootstrapping,
      initialized: state.initialized,
      errorMessage: state.errorMessage,
      showSettings: state.showSettings,
      bootstrap: state.bootstrap,
      clearError: state.clearError,
      setAccentColor: state.setAccentColor,
      exportData: state.exportData,
      importData: state.importData,
      resetData: state.resetData,
      selectCategory: state.selectCategory,
      openSettings: state.openSettings,
      closeSettings: state.closeSettings,
      createCategory: state.createCategory,
      renameCategory: state.renameCategory,
      deleteCategory: state.deleteCategory,
      addWebsite: state.addWebsite,
      updateWebsite: state.updateWebsite,
      deleteWebsite: state.deleteWebsite,
      reorderCategories: state.reorderCategories,
      reorderWebsites: state.reorderWebsites,
    })),
  )

  const [websiteModal, setWebsiteModal] = useState(WEBSITE_MODAL_DEFAULT)
  const [categoryModal, setCategoryModal] = useState(CATEGORY_MODAL_DEFAULT)
  const [deleteModal, setDeleteModal] = useState(DELETE_MODAL_DEFAULT)
  const [dragMode, setDragMode] = useState(false)
  const [bootOverlayState, setBootOverlayState] = useState('visible')
  const [hasBootResolved, setHasBootResolved] = useState(false)
  const { toasts, pushToast, dismissToast } = useToast()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (hasBootResolved) {
      return
    }

    if (initialized || (!isBootstrapping && Boolean(errorMessage))) {
      setHasBootResolved(true)
    }
  }, [hasBootResolved, initialized, isBootstrapping, errorMessage])

  useEffect(() => {
    const root = document.documentElement
    const rgb = toRgb(accentColor)
    if (!rgb) {
      return
    }

    root.style.setProperty('--accent-color', accentColor)
    root.style.setProperty('--accent-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`)
  }, [accentColor])

  const isBooting = !hasBootResolved

  useEffect(() => {
    if (isBooting) {
      setBootOverlayState('visible')
      return undefined
    }

    setBootOverlayState('fading')
    const timeoutId = window.setTimeout(() => {
      setBootOverlayState('hidden')
    }, BOOT_OVERLAY_FADE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isBooting])

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) || null,
    [categories, activeCategoryId],
  )

  const filteredWebsites = useMemo(
    () => activeCategory?.websites || [],
    [activeCategory],
  )

  const closeWebsiteModal = () => setWebsiteModal(WEBSITE_MODAL_DEFAULT)
  const closeCategoryModal = () => setCategoryModal(CATEGORY_MODAL_DEFAULT)
  const closeDeleteModal = () => setDeleteModal(DELETE_MODAL_DEFAULT)
  const notify = (payload) => pushToast(payload)

  const handleOpenCreateWebsite = () => {
    if (!activeCategory) {
      return
    }

    setWebsiteModal({
      isOpen: true,
      mode: 'create',
      categoryId: activeCategory.id,
      website: null,
      sessionKey: nextSessionKey(),
    })
  }

  const handleReorderCategories = async (orderedCategoryIds) =>
    reorderCategories(orderedCategoryIds)

  const handleReorderWebsites = async (orderedWebsiteIds) => {
    if (!activeCategory) {
      return { ok: false, error: 'No active category selected.' }
    }
    return reorderWebsites(activeCategory.id, orderedWebsiteIds)
  }

  const handleOpenEditWebsite = (website) => {
    if (!activeCategory) {
      return
    }

    setWebsiteModal({
      isOpen: true,
      mode: 'edit',
      categoryId: activeCategory.id,
      website,
      sessionKey: nextSessionKey(),
    })
  }

  const handleWebsiteSubmit = async (values) => {
    if (!websiteModal.categoryId) {
      return { ok: false, error: 'Select a category first.' }
    }

    if (websiteModal.mode === 'edit' && websiteModal.website) {
      return updateWebsite(
        websiteModal.categoryId,
        websiteModal.website.id,
        values,
      )
    }

    return addWebsite(websiteModal.categoryId, values)
  }

  const handleRequestDeleteFromEditor = () => {
    if (websiteModal.mode !== 'edit' || !websiteModal.website || !websiteModal.categoryId) {
      return
    }

    const selectedWebsite = websiteModal.website
    const selectedCategoryId = websiteModal.categoryId
    closeWebsiteModal()
    handleOpenDeleteWebsite(selectedWebsite, selectedCategoryId)
  }

  const handleOpenCreateCategory = () => {
    setCategoryModal({
      isOpen: true,
      mode: 'create',
      category: null,
      sessionKey: nextSessionKey(),
    })
  }

  const handleOpenRenameCategory = (category) => {
    setCategoryModal({
      isOpen: true,
      mode: 'edit',
      category,
      sessionKey: nextSessionKey(),
    })
  }

  const handleCategorySubmit = async ({ name }) => {
    if (categoryModal.mode === 'edit' && categoryModal.category) {
      return renameCategory(categoryModal.category.id, name)
    }

    return createCategory(name)
  }

  const handleOpenDeleteCategory = (category) => {
    setDeleteModal({
      isOpen: true,
      type: 'category',
      payload: { categoryId: category.id, categoryName: category.name },
      sessionKey: nextSessionKey(),
    })
  }

  const handleRequestDeleteCategoryFromEditor = () => {
    if (categoryModal.mode !== 'edit' || !categoryModal.category) {
      return
    }
    if (categoryModal.category.id === primaryCategoryId) {
      return
    }

    const selectedCategory = categoryModal.category
    closeCategoryModal()
    handleOpenDeleteCategory(selectedCategory)
  }

  const handleOpenDeleteWebsite = (website, categoryId = activeCategory?.id) => {
    if (!categoryId) {
      return
    }

    setDeleteModal({
      isOpen: true,
      type: 'website',
      payload: {
        categoryId,
        websiteId: website.id,
        websiteName: website.name,
      },
      sessionKey: nextSessionKey(),
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteModal.type === 'website') {
      const payload = deleteModal.payload
      if (!payload?.categoryId || !payload?.websiteId) {
        return { ok: false, error: 'Invalid website selection.' }
      }

      return deleteWebsite(payload.categoryId, payload.websiteId)
    }

    if (deleteModal.type === 'category') {
      const payload = deleteModal.payload
      if (!payload?.categoryId) {
        return { ok: false, error: 'Invalid category selection.' }
      }

      return deleteCategory(payload.categoryId)
    }

    return { ok: false, error: 'Nothing to delete.' }
  }

  const deleteTitle =
    deleteModal.type === 'category' ? 'Delete Category' : 'Delete Website'

  const deleteMessage =
    deleteModal.type === 'category'
      ? `Delete "${deleteModal.payload?.categoryName}" and all website tiles inside it?`
      : `Delete "${deleteModal.payload?.websiteName}" from this category?`

  const shouldRenderBootOverlay = bootOverlayState !== 'hidden'

  return (
    <>
      <div
        className={`app-shell min-h-screen transition-opacity duration-500 ${
          isBooting ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="accent-bubble-layer" aria-hidden="true">
          <span className="accent-bubble accent-bubble-1" />
          <span className="accent-bubble accent-bubble-2" />
          <span className="accent-bubble accent-bubble-3" />
          <span className="accent-bubble accent-bubble-4" />
        </div>

        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          dragMode={dragMode}
          onToggleDragMode={() => setDragMode((value) => !value)}
          onReorderCategories={handleReorderCategories}
          onSelectCategory={selectCategory}
          onCreateCategory={handleOpenCreateCategory}
          onRenameCategory={handleOpenRenameCategory}
          onOpenSettings={openSettings}
          onAddWebsite={handleOpenCreateWebsite}
          canAddWebsite={Boolean(activeCategory)}
        />

        <main className="flex min-h-screen w-full flex-col pt-11 sm:pt-12">
          {errorMessage ? (
            <section className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 backdrop-blur-md sm:mx-6">
              <p className="text-sm font-medium text-rose-200">{errorMessage}</p>
              <button
                type="button"
                onClick={clearError}
                className="focus-ring rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
              >
                Dismiss
              </button>
            </section>
          ) : null}

          <section className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <WebsiteGrid
              hasCategory={Boolean(activeCategory)}
              websites={filteredWebsites}
              onEdit={handleOpenEditWebsite}
              onReorderWebsites={handleReorderWebsites}
              dragMode={dragMode}
            />
          </section>
        </main>

        <WebsiteFormModal
          key={websiteModal.sessionKey}
          isOpen={websiteModal.isOpen}
          mode={websiteModal.mode}
          initialValues={websiteModal.website}
          onClose={closeWebsiteModal}
          onSubmit={handleWebsiteSubmit}
          onRequestDelete={handleRequestDeleteFromEditor}
          onResult={(result, context) => {
            if (!result?.ok) {
              notify({
                type: 'error',
                title: 'Unable to save website',
                description: result?.error || 'Please review website details.',
              })
              return
            }

            notify({
              type: context?.mode === 'edit' ? 'info' : 'success',
              title: context?.mode === 'edit' ? 'Website updated' : 'Website added',
              description: context?.values?.name || '',
            })
          }}
        />

        <CategoryFormModal
          key={categoryModal.sessionKey}
          isOpen={categoryModal.isOpen}
          mode={categoryModal.mode}
          initialName={categoryModal.category?.name || ''}
          canDelete={categoryModal.category?.id !== primaryCategoryId}
          onClose={closeCategoryModal}
          onSubmit={handleCategorySubmit}
          onRequestDelete={handleRequestDeleteCategoryFromEditor}
          onResult={(result, context) => {
            if (!result?.ok) {
              notify({
                type: 'error',
                title: 'Unable to save category',
                description: result?.error || 'Please try a different name.',
              })
              return
            }

            notify({
              type: context?.mode === 'edit' ? 'info' : 'success',
              title: context?.mode === 'edit' ? 'Category renamed' : 'Category created',
              description: context?.name || '',
            })
          }}
        />

        <ConfirmModal
          key={deleteModal.sessionKey}
          isOpen={deleteModal.isOpen}
          title={deleteTitle}
          message={deleteMessage}
          confirmLabel="Delete"
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          onResult={(result) => {
            if (!result?.ok) {
              notify({
                type: 'error',
                title: 'Delete failed',
                description: result?.error || 'Try again in a moment.',
              })
              return
            }

            notify({
              type: 'delete',
              title: deleteModal.type === 'category' ? 'Category deleted' : 'Website deleted',
            })
          }}
        />

      <SettingsModal
        isOpen={showSettings}
        onClose={closeSettings}
        categories={categories}
        accentColor={accentColor}
        onAccentColorChange={(value) => {
          void setAccentColor(value)
        }}
          onExportJson={exportData}
          onImportJson={importData}
          onResetData={resetData}
          onNotify={notify}
        />
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      {shouldRenderBootOverlay ? (
        <div
          className={`boot-overlay fixed inset-0 z-[90] transition-opacity duration-500 ${
            bootOverlayState === 'fading'
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
          }`}
        >
          <LoadingState />
        </div>
      ) : null}
    </>
  )
}

export default App
