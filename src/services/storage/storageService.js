import { v4 as uuidv4 } from 'uuid'
import { validateAndNormalizeUrl } from '../../utils/url'
import { readRootRecord, writeRootRecord } from './db'

const SCHEMA_VERSION = 1
const DEFAULT_CATEGORY_NAME = 'Home'
const DEFAULT_ACCENT_COLOR = '#ef4444'
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

const cleanName = (value) => value.trim().replace(/\s+/g, ' ')

const normalizeAccentColor = (value) =>
  HEX_COLOR_REGEX.test(value || '') ? value.toLowerCase() : DEFAULT_ACCENT_COLOR

const createDefaultSettings = (primaryCategoryId = '') => ({
  accentColor: DEFAULT_ACCENT_COLOR,
  primaryCategoryId,
})

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

const createCategory = (name = DEFAULT_CATEGORY_NAME) => {
  return {
    id: uuidv4(),
    name,
    websites: [],
  }
}

const createDefaultData = () => {
  const primaryCategory = createCategory()
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: createDefaultSettings(primaryCategory.id),
    categories: [primaryCategory],
  }
}

const normalizeWebsiteShape = (website) => {
  const normalized = validateAndNormalizeUrl(website?.url ?? '')
  const normalizedUrl = normalized.isValid
    ? normalized.normalizedUrl
    : (website?.url ?? '').trim()

  return {
    id: website?.id || uuidv4(),
    name: cleanName(website?.name || website?.url || 'Untitled website'),
    url: normalizedUrl,
  }
}

const normalizeCategoryShape = (category) => {
  const websites = Array.isArray(category?.websites) ? category.websites : []
  return {
    id: category?.id || uuidv4(),
    name: cleanName(category?.name || DEFAULT_CATEGORY_NAME),
    websites: websites.map((website) => normalizeWebsiteShape(website)),
  }
}

const ensureDataShape = (value) => {
  const categories = Array.isArray(value?.categories)
    ? value.categories.map((category) => normalizeCategoryShape(category))
    : []
  if (
    categories.length === 1 &&
    categories[0].name.toLowerCase() === 'inbox'
  ) {
    categories[0].name = DEFAULT_CATEGORY_NAME
  }

  const safeCategories = categories.length > 0 ? categories : [createCategory()]
  const requestedPrimaryId = value?.settings?.primaryCategoryId || ''
  const hasRequestedPrimary = safeCategories.some(
    (category) => category.id === requestedPrimaryId,
  )
  const primaryCategoryId = hasRequestedPrimary
    ? requestedPrimaryId
    : safeCategories[0].id

  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      ...createDefaultSettings(primaryCategoryId),
      ...(value?.settings || {}),
      accentColor: normalizeAccentColor(value?.settings?.accentColor),
      primaryCategoryId,
    },
    categories: safeCategories,
  }
}

const loadData = async () => {
  const current = await readRootRecord()
  if (!current) {
    const defaults = createDefaultData()
    await writeRootRecord(defaults)
    return defaults
  }

  const normalized = ensureDataShape(current)
  await writeRootRecord(normalized)
  return normalized
}

const saveData = async (data) => {
  const normalized = ensureDataShape(data)
  await writeRootRecord(normalized)
  return normalized
}

const mutate = async (updater) => {
  const current = await loadData()
  const draft = clone(current)
  const next = updater(draft) || draft
  const saved = await saveData(next)
  return saved
}

const getCategoryOrThrow = (data, categoryId) => {
  const category = data.categories.find((item) => item.id === categoryId)
  if (!category) {
    throw new Error('Category not found.')
  }
  return category
}

const findDuplicateWebsite = (category, normalizedUrl, ignoreWebsiteId) =>
  category.websites.some(
    (website) =>
      website.url === normalizedUrl &&
      (ignoreWebsiteId ? website.id !== ignoreWebsiteId : true),
  )

const parseWebsiteInput = (input) => {
  const name = cleanName(input.name || '')
  if (!name) {
    throw new Error('Website name is required.')
  }

  const urlResult = validateAndNormalizeUrl(input.url || '')
  if (!urlResult.isValid) {
    throw new Error(urlResult.errorMessage)
  }

  return {
    name,
    url: urlResult.normalizedUrl,
  }
}

const parseCategoryName = (value) => {
  const name = cleanName(value || '')
  if (!name) {
    throw new Error('Category name is required.')
  }
  return name
}

const reorderByIds = (items, orderedIds) => {
  const mapById = new Map(items.map((item) => [item.id, item]))
  const seen = new Set()
  const reordered = []

  orderedIds.forEach((id) => {
    const item = mapById.get(id)
    if (!item || seen.has(id)) {
      return
    }
    reordered.push(item)
    seen.add(id)
  })

  items.forEach((item) => {
    if (seen.has(item.id)) {
      return
    }
    reordered.push(item)
  })

  return reordered
}

const parseImportCategories = (value) => {
  if (Array.isArray(value)) {
    return value
  }
  if (value && Array.isArray(value.categories)) {
    return value.categories
  }
  throw new Error('Import JSON must contain a categories array.')
}

export const getAppData = async () => loadData()

export const createCategoryEntry = async (rawName) => {
  const name = parseCategoryName(rawName)
  let categoryId = ''

  const data = await mutate((draft) => {
    const alreadyExists = draft.categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    )
    if (alreadyExists) {
      throw new Error('Category name already exists.')
    }

    const created = createCategory(name)
    categoryId = created.id
    draft.categories.push(created)
    return draft
  })

  return { data, categoryId }
}

export const renameCategoryEntry = async (categoryId, rawName) => {
  const name = parseCategoryName(rawName)
  const data = await mutate((draft) => {
    const category = getCategoryOrThrow(draft, categoryId)
    const alreadyExists = draft.categories.some(
      (item) =>
        item.id !== categoryId && item.name.toLowerCase() === name.toLowerCase(),
    )
    if (alreadyExists) {
      throw new Error('Category name already exists.')
    }

    category.name = name
    return draft
  })

  return { data }
}

export const deleteCategoryEntry = async (categoryId) => {
  const data = await mutate((draft) => {
    if (draft.settings?.primaryCategoryId === categoryId) {
      throw new Error('Primary category cannot be deleted.')
    }

    const nextCategories = draft.categories.filter(
      (category) => category.id !== categoryId,
    )
    if (nextCategories.length === draft.categories.length) {
      throw new Error('Category not found.')
    }

    draft.categories = nextCategories.length > 0 ? nextCategories : [createCategory()]
    return draft
  })

  return { data }
}

export const addWebsiteEntry = async (categoryId, input) => {
  const websiteInput = parseWebsiteInput(input)
  let websiteId = ''
  const data = await mutate((draft) => {
    const category = getCategoryOrThrow(draft, categoryId)
    if (findDuplicateWebsite(category, websiteInput.url)) {
      throw new Error('This URL already exists in the selected category.')
    }

    const website = {
      id: uuidv4(),
      name: websiteInput.name,
      url: websiteInput.url,
    }
    websiteId = website.id
    category.websites.push(website)
    return draft
  })

  return { data, websiteId }
}

export const updateWebsiteEntry = async (categoryId, websiteId, input) => {
  const websiteInput = parseWebsiteInput(input)
  const data = await mutate((draft) => {
    const category = getCategoryOrThrow(draft, categoryId)
    const website = category.websites.find((item) => item.id === websiteId)
    if (!website) {
      throw new Error('Website not found.')
    }
    if (findDuplicateWebsite(category, websiteInput.url, websiteId)) {
      throw new Error('Another website already uses this URL.')
    }

    website.name = websiteInput.name
    website.url = websiteInput.url
    return draft
  })

  return { data }
}

export const deleteWebsiteEntry = async (categoryId, websiteId) => {
  const data = await mutate((draft) => {
    const category = getCategoryOrThrow(draft, categoryId)
    const nextWebsites = category.websites.filter((item) => item.id !== websiteId)
    if (nextWebsites.length === category.websites.length) {
      throw new Error('Website not found.')
    }

    category.websites = nextWebsites
    return draft
  })

  return { data }
}

export const updateAccentColorSetting = async (rawColor) => {
  const accentColor = normalizeAccentColor(rawColor)
  const data = await mutate((draft) => {
    draft.settings = {
      ...createDefaultSettings(),
      ...(draft.settings || {}),
      accentColor,
    }
    return draft
  })

  return { data }
}

export const reorderCategoriesEntry = async (orderedCategoryIds) => {
  if (!Array.isArray(orderedCategoryIds) || orderedCategoryIds.length === 0) {
    throw new Error('Category order is required.')
  }

  const data = await mutate((draft) => {
    let reordered = reorderByIds(draft.categories, orderedCategoryIds)
    if (reordered.length !== draft.categories.length) {
      throw new Error('Invalid category order.')
    }

    const primaryCategoryId = draft.settings?.primaryCategoryId
    if (primaryCategoryId) {
      const primaryIndex = reordered.findIndex(
        (category) => category.id === primaryCategoryId,
      )
      if (primaryIndex > 0) {
        reordered = [reordered[primaryIndex], ...reordered.slice(0, primaryIndex), ...reordered.slice(primaryIndex + 1)]
      }
    }

    draft.categories = reordered
    return draft
  })

  return { data }
}

export const reorderWebsitesEntry = async (categoryId, orderedWebsiteIds) => {
  if (!Array.isArray(orderedWebsiteIds) || orderedWebsiteIds.length === 0) {
    throw new Error('Website order is required.')
  }

  const data = await mutate((draft) => {
    const category = getCategoryOrThrow(draft, categoryId)
    const reordered = reorderByIds(category.websites, orderedWebsiteIds)
    if (reordered.length !== category.websites.length) {
      throw new Error('Invalid website order.')
    }

    category.websites = reordered
    return draft
  })

  return { data }
}

export const exportAppDataAsJson = async () => {
  const data = await loadData()
  const payload = {
    categories: data.categories,
  }

  return JSON.stringify(payload)
}

export const importAppDataFromJson = async (rawJson) => {
  let parsed
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    throw new Error('Invalid JSON. Please paste a valid JSON payload.')
  }

  const categories = parseImportCategories(parsed)
  if (!categories.length) {
    throw new Error('Import JSON must include at least one category.')
  }

  const current = await loadData()
  const data = await saveData({
    ...current,
    categories,
  })

  return { data }
}

export const resetAllAppData = async () => {
  const defaults = createDefaultData()
  const data = await saveData(defaults)
  return { data }
}

