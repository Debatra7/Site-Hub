const HAS_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/i

const trimTrailingSlash = (value) =>
  value.endsWith('/') ? value.slice(0, -1) : value

export const normalizeUrl = (rawValue) => {
  const value = rawValue.trim()
  if (!value) {
    throw new Error('URL is required.')
  }

  const urlValue = HAS_PROTOCOL_REGEX.test(value) ? value : `https://${value}`
  const parsed = new URL(urlValue)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.')
  }

  parsed.hash = ''
  parsed.hostname = parsed.hostname.toLowerCase()

  if (parsed.protocol === 'https:' && parsed.port === '443') {
    parsed.port = ''
  }
  if (parsed.protocol === 'http:' && parsed.port === '80') {
    parsed.port = ''
  }

  const normalized = parsed.toString()
  const isRootPath = parsed.pathname === '/' && !parsed.search
  if (isRootPath) {
    return `${parsed.protocol}//${parsed.host}`
  }

  return trimTrailingSlash(normalized)
}

export const validateAndNormalizeUrl = (rawValue) => {
  try {
    return {
      isValid: true,
      normalizedUrl: normalizeUrl(rawValue),
      errorMessage: '',
    }
  } catch (error) {
    return {
      isValid: false,
      normalizedUrl: '',
      errorMessage: error instanceof Error ? error.message : 'Invalid URL.',
    }
  }
}

export const buildFaviconCandidates = (rawUrl, preferredFaviconUrl = '') => {
  const candidates = []
  const addCandidate = (value) => {
    if (!value || candidates.includes(value)) {
      return
    }
    candidates.push(value)
  }

  addCandidate(preferredFaviconUrl)

  const normalized = validateAndNormalizeUrl(rawUrl || '')
  if (!normalized.isValid) {
    return candidates
  }

  const parsed = new URL(normalized.normalizedUrl)
  const hostname = parsed.hostname

  addCandidate(`${parsed.origin}/favicon.ico`)
  addCandidate(`https://www.google.com/s2/favicons?sz=64&domain=${hostname}`)
  addCandidate(`https://icons.duckduckgo.com/ip3/${hostname}.ico`)

  return candidates
}

export const toDisplayUrl = (value) => value.replace(/^https?:\/\//i, '')

export const toHostname = (value) => {
  try {
    return new URL(value).hostname.replace(/^www\./i, '')
  } catch {
    return value
  }
}
