# Frontend Architecture

Stack: Next.js App Router, React, TypeScript, Zustand, Dexie/IndexedDB, Tailwind CSS, ShadCN UI, dnd-kit, Workbox.

## 1. Folder Structure

Recommended structure:

```text
client/src
  app/
    layout.tsx
    page.tsx
    (auth)/
    (dashboard)/
    shared/[token]/
    settings/
    admin/
  components/
    ui/
    layout/
    feedback/
  features/
    auth/
    categories/
    websites/
    sticky-notes/
    tags/
    sync/
    sharing/
    personalization/
    import-export/
    analytics/
  hooks/
  lib/
    db.ts
    api-client.ts
    sync-client.ts
    service-worker.ts
    utils.ts
  store/
    useStore.ts
    slices/
  styles/
```

Current code already has `app`, `components`, `components/ui`, `lib`, and `store`. New product work should move domain-specific UI and hooks into `features/*` while keeping reusable primitives in `components/ui`.

## 2. State Architecture

- Zustand owns ephemeral UI state:
  - active category
  - sidebar and panel visibility
  - selected cards/notes
  - active drag state
  - modal state
  - theme preference mirror
  - sync status banner state
- Dexie owns durable product state:
  - categories
  - websites
  - sticky notes
  - tags
  - preferences
  - sync queue
  - version snapshots
  - conflicts
  - device cursors
- React component state owns short-lived form inputs.
- Server state should not use a separate heavy cache for MVP. Local Dexie is the read model; API calls update Dexie through repositories.

Pattern:

```text
UI event -> feature action -> Dexie transaction -> syncQueue append -> live query updates UI -> background sync pushes remote
```

## 3. Offline-first UI Patterns

- Read from Dexie first with `useLiveQuery`.
- Apply optimistic writes by committing to IndexedDB immediately.
- Show per-entity sync status only when useful:
  - subtle pending indicator for dirty cards/notes
  - conflict marker for blocked entities
  - global offline/sync banner
- Disable only actions that truly require the network, such as OAuth login, share-link creation, or server export generation.
- Use tombstones for deletes so offline deletion can sync later.
- Route-level loading states should be local and fast; avoid blocking the dashboard on network fetches.
- Conflict resolution should be a focused modal or side panel with local, remote, merge, and rollback choices.

## 4. Dashboard Rendering Strategy

- App Router provides route shells and server-rendered static chrome where possible.
- Interactive dashboard surfaces remain client components because they depend on IndexedDB, drag/drop, and live local state.
- Render hierarchy:
  - `app/layout.tsx`: providers, global styles, metadata.
  - dashboard route: shell, sidebar, top bar, action bar.
  - category view: virtualized or paginated card grid for large collections.
  - card/note components: memoized and keyed by stable IDs.
- Use Dexie compound indexes for category-scoped queries and sorted rendering.
- For MVP, render grids directly. Add virtualization once categories regularly exceed 200-300 visible items.

## 5. Drag/drop Strategy

Use dnd-kit for:

- category reorder
- website reorder within a category
- website move across categories
- sticky note positioning
- future tag assignment gestures

Implementation rules:

- `DndContext` lives at the feature surface, not the whole app.
- `SortableContext` wraps ordered lists/grids.
- Persist only the final drop result, not every pointer movement.
- During drag, Zustand stores transient drag state; Dexie updates only on drop.
- Use fractional or normalized `orderIndex` values to avoid rewriting every row on small moves.
- Cross-category moves enqueue one sync operation for the website update and a version snapshot.
- Keyboard drag sensors must be enabled for accessibility.

## 6. Theme Engine

- Tailwind CSS variables provide the design tokens.
- Zustand stores the active UI theme immediately.
- Dexie `preferences` stores durable theme, accent color, layout, and privacy defaults.
- Sync engine propagates preference changes across devices.
- Theme application order:
  1. system preference
  2. local account preference from Dexie
  3. explicit in-session Zustand override
- Wallpapers and media backgrounds reference `MediaAsset` records and must have offline fallbacks.
- Keep high-contrast mode and reduced-motion support independent from decorative themes.

## 7. Performance Optimization

- Keep dashboard reads local-first and index-backed.
- Batch Dexie writes in transactions.
- Debounce drag, resize, search, and note editing writes.
- Split feature bundles by route using App Router boundaries.
- Lazy-load heavy panels: import/export, analytics, conflict resolver, media picker.
- Memoize card/note rows and avoid passing unstable object props through large grids.
- Use Workbox for:
  - app shell caching
  - static asset caching
  - offline fallback page
  - background sync registration where supported
- Keep media outside sync payloads; cache thumbnails separately.
- Use `next/image` only for remote/served assets that fit its constraints; favicons and local object URLs can stay as plain images.

## 8. Accessibility

- All ShadCN primitives must keep visible focus states.
- Drag/drop must support keyboard controls and screen-reader announcements.
- Icon-only controls need accessible labels and tooltips.
- Cards require descriptive link text, not only favicon imagery.
- Color tags and sync states need text or shape indicators, not color alone.
- Modals must trap focus and restore focus on close.
- Offline/conflict banners should use polite live regions.
- Respect `prefers-reduced-motion` for transitions, wallpaper video, and drag animations.
- Dashboard and settings should be fully usable at mobile widths and with zoomed text.
