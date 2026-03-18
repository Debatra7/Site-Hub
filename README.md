# Site Hub

Offline-first web app for saving and organizing website links in category-based tabs.

## Tech Stack

- React + Vite
- Tailwind CSS
- Zustand
- IndexedDB via `idb`
- `uuid` for unique IDs
- `dayjs` for timestamps

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

## Architecture

- `src/services/storage/db.js`: low-level IndexedDB wrapper.
- `src/services/storage/storageService.js`: storage CRUD and data validation.
- `src/store/useSiteHubStore.js`: Zustand state and async orchestration.
- `src/components/*`: modular UI (tabs, grid, tiles, modals).
- `src/utils/url.js`: URL normalization/validation helpers.
- `public/sw.js`: service worker for offline app shell caching.

## Data Shape

```json
{
  "schemaVersion": 1,
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "websites": [
        {
          "id": "uuid",
          "name": "Website Name",
          "url": "https://example.com",
          "faviconUrl": "https://example.com/favicon.ico",
          "createdAt": "ISO timestamp",
          "updatedAt": "ISO timestamp"
        }
      ]
    }
  ]
}
```

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
