/**
 * Turn user input (with or without scheme) into a canonical http(s) URL string.
 */
export function normalizeUserWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let candidate = t;
  if (candidate.startsWith('//')) {
    candidate = `https:${candidate}`;
  } else if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const u = new URL(candidate);
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Multi-segment public suffixes for naive registrable-domain extraction. */
const TWO_PART_PUBLIC_SUFFIXES = new Set([
  'co.uk',
  'com.au',
  'co.jp',
  'co.nz',
  'com.br',
  'com.mx',
  'co.in',
  'com.ar',
  'co.za',
  'com.sg',
  'com.tw',
  'com.hk',
]);

/**
 * Lowercase hostnames → display name (e.g. youtube watch URLs → "YouTube").
 * Keys should be registrable-style hosts (no leading www.).
 */
const KNOWN_HOST_BRAND: Record<string, string> = {
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'music.youtube.com': 'YouTube Music',
  'github.com': 'GitHub',
  'gist.github.com': 'GitHub',
  'google.com': 'Google',
  'mail.google.com': 'Gmail',
  'drive.google.com': 'Google Drive',
  'docs.google.com': 'Google Docs',
  'twitter.com': 'X',
  'x.com': 'X',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'reddit.com': 'Reddit',
  'linkedin.com': 'LinkedIn',
  'stackoverflow.com': 'Stack Overflow',
  'stackexchange.com': 'Stack Exchange',
  'npmjs.com': 'npm',
  'twitch.tv': 'Twitch',
  'discord.com': 'Discord',
  'openai.com': 'OpenAI',
  'chatgpt.com': 'ChatGPT',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'medium.com': 'Medium',
  'wikipedia.org': 'Wikipedia',
  'amazon.com': 'Amazon',
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'apple.com': 'Apple',
  'microsoft.com': 'Microsoft',
};

function stripWww(host: string): string {
  return host.replace(/^www\./i, '');
}

/** e.g. www.youtube.com → youtube.com ; foo.co.uk → foo.co.uk */
function naiveRegistrableDomain(host: string): string {
  const h = stripWww(host).toLowerCase();
  const parts = h.split('.').filter(Boolean);
  if (parts.length <= 1) return h;
  const lastTwo = parts.slice(-2).join('.');
  if (parts.length >= 3 && TWO_PART_PUBLIC_SUFFIXES.has(lastTwo)) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function primarySldFromRegistrable(registrable: string): string {
  const parts = registrable.split('.').filter(Boolean);
  if (parts.length < 2) return parts[0] ?? registrable;
  const lastTwo = parts.slice(-2).join('.');
  if (TWO_PART_PUBLIC_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts[parts.length - 3]!;
  }
  return parts[parts.length - 2]!;
}

/** Longest registered-host match (e.g. studio.youtube.com → YouTube). */
const KNOWN_HOST_KEYS_SORTED = Object.keys(KNOWN_HOST_BRAND).sort((a, b) => b.length - a.length);

function knownBrandForHostname(host: string): string | null {
  const h = host.toLowerCase();
  for (const key of KNOWN_HOST_KEYS_SORTED) {
    if (h === key || h.endsWith(`.${key}`)) {
      return KNOWN_HOST_BRAND[key] ?? null;
    }
  }
  return null;
}

function titleCaseBrandFromLabel(label: string): string {
  const cleaned = label.replace(/_/g, '-');
  return cleaned
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Friendly default bookmark title from a normalized URL (e.g. YouTube for youtube.com links).
 */
export function defaultBookmarkNameFromUrl(normalizedHref: string): string {
  try {
    const u = new URL(normalizedHref);
    const host = u.hostname.toLowerCase();
    if (!host) return normalizedHref;

    const fromKnown = knownBrandForHostname(stripWww(host)) ?? knownBrandForHostname(host);
    if (fromKnown) return fromKnown;

    const registrable = naiveRegistrableDomain(host);
    const sld = primarySldFromRegistrable(registrable);
    return titleCaseBrandFromLabel(sld) || registrable || host;
  } catch {
    const withoutScheme = normalizedHref.replace(/^https:\/\//i, '').replace(/^http:\/\//i, '');
    const trimmed = withoutScheme.replace(/\/$/, '');
    return trimmed || withoutScheme || normalizedHref;
  }
}
