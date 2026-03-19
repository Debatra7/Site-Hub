# Site Hub

A simple way to make life easier by organizing all your important websites and links in one place.

## 🚀 Live Demo

Check out the live version: [https://site-hub.netlify.app/](https://site-hub.netlify.app/)

## ✨ Features

- **Primary Home Tab**: A default primary tab always exists. It can be renamed, but cannot be deleted from the category editor.
- **Delete Everything Reset**: One-click full reset from Settings clears categories, websites, and settings, then recreates default app data.
- **Import / Export JSON**: Backup and restore category data with JSON payloads.
- **Drag and Drop Reordering**: Reorder categories and website cards using DnD interactions.
- **Theme Customization**: Accent color customization with presets and manual color input.
- **Offline-First**: IndexedDB persistence and service-worker-based app shell caching.
- **Validation & Duplicate Protection**: URL normalization and duplicate URL prevention within a category.

## Tech Stack

- React + Vite
- Tailwind CSS
- Zustand
- IndexedDB via `idb`
- `uuid` for unique IDs
- `@dnd-kit` for drag and drop
- GSAP for UI motion

## Run Locally

```bash
npm install
npm run dev
```

## Build + Lint

```bash
npm run lint
npm run build
```

## Usage

1. **Create / Rename Categories**: Manage tabs for organizing links.
2. **Add / Edit / Delete Websites**: Maintain website cards inside each category.
3. **Reorder Tabs and Cards**: Enable drag mode and rearrange categories/websites.
4. **Use Settings**:
   - change accent color
   - import JSON
   - export JSON
   - delete everything (full reset)
5. **Primary Tab Rule**: The primary Home tab cannot be deleted through normal category deletion.

## Architecture

- `src/services/storage/db.js`: low-level IndexedDB wrapper.
- `src/services/storage/storageService.js`: normalized storage CRUD, import/export, and business rules.
- `src/store/useSiteHubStore.js`: Zustand state and async orchestration.
- `src/components/*`: modular UI (tabs, grid, tiles, modals).
- `src/utils/url.js`: URL normalization/validation helpers.
- `src/services/offline/registerServiceWorker.js`: production service worker registration.
- `public/sw.js`: service worker for offline app shell caching.

## Persisted Data Shape

```json
{
  "schemaVersion": 1,
  "settings": {
    "accentColor": "#ef4444",
    "primaryCategoryId": "uuid"
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "websites": [
        {
          "id": "uuid",
          "name": "Website Name",
          "url": "https://example.com"
        }
      ]
    }
  ]
}
```

### Import Shape

Import supports either:

- `{ "categories": [...] }`
- `[...]` (categories array directly)

`id` values are optional on import. Missing IDs are generated during normalization before data is saved.

### Export Shape

Export returns compact JSON (`JSON.stringify`) with category data:

```json
{
  "categories": [
    /* ... */
  ]
}
```

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
