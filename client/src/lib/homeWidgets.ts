export const HOME_WIDGETS_STORAGE_KEY = 'betaHub_v1_homeWidgets';

export type HomeWidgetKind = 'search' | 'time' | 'calendar' | 'image';

export type HomeWidget = {
  id: string;
  kind: HomeWidgetKind;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  /** For `image` kind only — data URL or https URL */
  imageSrc?: string;
};

const DEFAULT_VW = 1280;
const DEFAULT_VH = 720;

export function defaultSearchWidget(vw = DEFAULT_VW, vh = DEFAULT_VH): HomeWidget {
  const nav = Math.round(vh * 0.08);
  const w = Math.min(520, vw - 48);
  const h = 52;
  const x = Math.max(24, Math.floor((vw - w) / 2));
  const y = nav + 10;
  return {
    id: crypto.randomUUID(),
    kind: 'search',
    x,
    y,
    w,
    h,
    z: 1,
  };
}

function normalizeWidget(raw: unknown): HomeWidget | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : crypto.randomUUID();
  const kind = o.kind as HomeWidgetKind;
  if (!['search', 'time', 'calendar', 'image'].includes(kind)) return null;
  const x = Number(o.x);
  const y = Number(o.y);
  const w = Number(o.w);
  const h = Number(o.h);
  const z = Number(o.z);
  if (![x, y, w, h, z].every((n) => Number.isFinite(n))) return null;
  const imageSrc = typeof o.imageSrc === 'string' ? o.imageSrc : undefined;
  return { id, kind, x, y, w, h, z, imageSrc };
}

export function loadHomeWidgets(): HomeWidget[] {
  if (typeof window === 'undefined') {
    return [defaultSearchWidget()];
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  try {
    const raw = localStorage.getItem(HOME_WIDGETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const list = parsed.map(normalizeWidget).filter((w): w is HomeWidget => w !== null);
        if (list.length > 0) {
          if (!list.some((w) => w.kind === 'search')) {
            list.unshift(defaultSearchWidget(vw, vh));
          }
          return list;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [defaultSearchWidget(vw, vh)];
}

export function persistHomeWidgets(widgets: HomeWidget[]) {
  try {
    localStorage.setItem(HOME_WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  } catch {
    /* ignore */
  }
}

export type Rect = { x: number; y: number; w: number; h: number };

const GAP = 6;

export function rectsOverlap(a: Rect, b: Rect, pad = GAP): boolean {
  return (
    a.x + a.w + pad > b.x &&
    b.x + b.w + pad > a.x &&
    a.y + a.h + pad > b.y &&
    b.y + b.h + pad > a.y
  );
}

export function clampRect(r: Rect, vw: number, vh: number, topMin: number): Rect {
  const w = Math.max(100, Math.min(r.w, vw - 8));
  const h = Math.max(40, Math.min(r.h, vh - topMin - 8));
  const x = Math.min(Math.max(4, r.x), vw - w - 4);
  const y = Math.min(Math.max(topMin + 4, r.y), vh - h - 4);
  return { x, y, w, h };
}

/** Push `moving` out of overlaps with other widgets (iterative). */
export function resolveNonOverlap(
  movingId: string,
  rect: Rect,
  others: HomeWidget[],
  vw: number,
  vh: number,
  topMin: number,
): Rect {
  let r = clampRect(rect, vw, vh, topMin);
  for (let iter = 0; iter < 48; iter++) {
    let hit: HomeWidget | null = null;
    for (const o of others) {
      if (o.id === movingId) continue;
      const orect: Rect = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (rectsOverlap(r, orect)) {
        hit = o;
        break;
      }
    }
    if (!hit) break;
    const orect: Rect = { x: hit.x, y: hit.y, w: hit.w, h: hit.h };
    const mcx = r.x + r.w / 2;
    const mcy = r.y + r.h / 2;
    const ocx = orect.x + orect.w / 2;
    const ocy = orect.y + orect.h / 2;
    let dx = mcx - ocx;
    let dy = mcy - ocy;
    const len = Math.hypot(dx, dy) || 1;
    dx = (dx / len) * 10;
    dy = (dy / len) * 10;
    r = clampRect({ ...r, x: r.x + dx, y: r.y + dy }, vw, vh, topMin);
  }
  return r;
}

export function defaultSizeForKind(kind: HomeWidgetKind): { w: number; h: number } {
  switch (kind) {
    case 'search':
      return { w: 520, h: 52 };
    case 'time':
      return { w: 300, h: 140 };
    case 'calendar':
      return { w: 320, h: 300 };
    case 'image':
      return { w: 280, h: 220 };
    default:
      return { w: 280, h: 160 };
  }
}

export function minSizeForKind(kind: HomeWidgetKind): { w: number; h: number } {
  switch (kind) {
    case 'search':
      return { w: 220, h: 44 };
    case 'time':
      return { w: 200, h: 100 };
    case 'calendar':
      return { w: 260, h: 220 };
    case 'image':
      return { w: 120, h: 100 };
    default:
      return { w: 120, h: 80 };
  }
}
