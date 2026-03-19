import { create } from 'zustand'
import {
  addWebsiteEntry,
  createCategoryEntry,
  deleteCategoryEntry,
  deleteWebsiteEntry,
  exportAppDataAsJson,
  getAppData,
  importAppDataFromJson,
  reorderCategoriesEntry,
  reorderWebsitesEntry,
  renameCategoryEntry,
  resetAllAppData,
  updateAccentColorSetting,
  updateWebsiteEntry,
} from '../services/storage/storageService'

const EMPTY_OBJECT = {}
const DEFAULT_ACCENT_COLOR = '#ef4444'

const normalizeError = (error) =>
  error instanceof Error ? error.message : 'Something went wrong.'

const resolveActiveCategoryId = (currentId, categories) => {
  if (categories.some((category) => category.id === currentId)) {
    return currentId
  }
  return categories[0]?.id || null
}

const applyData = (state, data) => ({
  categories: data.categories,
  accentColor: data.settings?.accentColor || DEFAULT_ACCENT_COLOR,
  primaryCategoryId: data.settings?.primaryCategoryId || data.categories[0]?.id || null,
  activeCategoryId: resolveActiveCategoryId(state.activeCategoryId, data.categories),
})

const runMutation = async (set, get, operation, onAfterSuccess) => {
  set({ isSaving: true, errorMessage: '' })
  try {
    const result = await operation()
    const data = result.data || result

    set((state) => ({
      ...applyData(state, data),
      ...(onAfterSuccess ? onAfterSuccess(state, result, data) : EMPTY_OBJECT),
      isSaving: false,
    }))

    return { ok: true, data, result }
  } catch (error) {
    const errorMessage = normalizeError(error)
    set({ isSaving: false, errorMessage })
    return { ok: false, error: errorMessage }
  }
}

export const useSiteHubStore = create((set, get) => ({
  categories: [],
  primaryCategoryId: null,
  activeCategoryId: null,
  searchQuery: '',
  accentColor: DEFAULT_ACCENT_COLOR,
  isBootstrapping: false,
  initialized: false,
  isSaving: false,
  showSettings: false,
  errorMessage: '',

  bootstrap: async () => {
    if (get().initialized || get().isBootstrapping) {
      return
    }

    set({ isBootstrapping: true, errorMessage: '' })
    try {
      const data = await getAppData()
      set((state) => ({
        ...applyData(state, data),
        isBootstrapping: false,
        initialized: true,
      }))
    } catch (error) {
      set({
        isBootstrapping: false,
        initialized: false,
        errorMessage: normalizeError(error),
      })
    }
  },

  clearError: () => set({ errorMessage: '' }),

  setSearchQuery: (value) => set({ searchQuery: value }),

  setAccentColor: (accentColor) =>
    runMutation(set, get, () => updateAccentColorSetting(accentColor)),

  exportData: async () => {
    set({ errorMessage: '' })
    try {
      const json = await exportAppDataAsJson()
      return { ok: true, json }
    } catch (error) {
      const errorMessage = normalizeError(error)
      set({ errorMessage })
      return { ok: false, error: errorMessage, json: '' }
    }
  },

  importData: (rawJson) =>
    runMutation(set, get, () => importAppDataFromJson(rawJson)),

  resetData: () =>
    runMutation(set, get, () => resetAllAppData()),

  reorderCategories: (orderedCategoryIds) =>
    runMutation(set, get, () => reorderCategoriesEntry(orderedCategoryIds)),

  reorderWebsites: (categoryId, orderedWebsiteIds) =>
    runMutation(set, get, () =>
      reorderWebsitesEntry(categoryId, orderedWebsiteIds),
    ),

  selectCategory: (categoryId) =>
    set((state) => {
      const exists = state.categories.some((category) => category.id === categoryId)
      return exists ? { activeCategoryId: categoryId } : EMPTY_OBJECT
    }),

  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),

  createCategory: (name) =>
    runMutation(set, get, () => createCategoryEntry(name), (_, result) => ({
      activeCategoryId: result.categoryId,
    })),

  renameCategory: (categoryId, name) =>
    runMutation(set, get, () => renameCategoryEntry(categoryId, name)),

  deleteCategory: (categoryId) =>
    runMutation(set, get, () => deleteCategoryEntry(categoryId)),

  addWebsite: (categoryId, input) =>
    runMutation(set, get, () => addWebsiteEntry(categoryId, input)),

  updateWebsite: (categoryId, websiteId, input) =>
    runMutation(set, get, () => updateWebsiteEntry(categoryId, websiteId, input)),

  deleteWebsite: (categoryId, websiteId) =>
    runMutation(set, get, () => deleteWebsiteEntry(categoryId, websiteId)),
}))

