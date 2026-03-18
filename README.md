# Site Hub

Offline-first web app for saving and organizing website links in category-based tabs.

## 🚀 Live Demo

Check out the live version: [https://site-hub.netlify.app/](https://site-hub.netlify.app/)

## ✨ Features

- **Category for Different Type Websites**: Organize websites into categories based on their type or purpose.
- **Customizable Theme**: Personalize the app's appearance with customizable themes and accent colors.
- **Data Import Export Feature**: Easily import and export your website data as JSON for backup and migration.
- **Drag and Drop UI for Website Cards**: Intuitive drag-and-drop interface to reorder website cards within categories.
- **Responsive Design**: Optimized for all screen sizes, from mobile to desktop.
- **Data Validation**: Ensures URLs are valid and prevents duplicates within categories.

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

## Usage

1. **Add Categories**: Create new categories to organize your websites.
2. **Add Websites**: Within each category, add websites with names and URLs.
3. **Search**: Use the search bar to filter websites by name or URL.
4. **Reorder**: Drag and drop to rearrange categories and websites.
5. **Settings**: Customize the accent color and manage data import/export.
6. **Offline**: The app caches resources for offline use.

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
