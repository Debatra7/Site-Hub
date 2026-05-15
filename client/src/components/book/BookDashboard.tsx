'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRightToLine,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Clock as ClockMenuIcon,
  Copy,
  ExternalLink,
  FolderPlus,
  Gamepad2,
  Layers,
  LayoutGrid,
  Link2,
  Monitor,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Category, type Website } from '@/lib/db';
import { defaultBookmarkNameFromUrl, normalizeUserWebsiteUrl } from '@/lib/websiteUrl';
import { loadHomeWidgets, persistHomeWidgets, type HomeWidget } from '@/lib/homeWidgets';
import { Background } from './Background';
import { BookNavbarClassic } from './BookNavbarClassic';
import { BookSidebar } from './BookSidebar';
import { BookmarkCard, type BookmarkItemVM } from './BookmarkCard';
import { BookModals, type BgMediaState, type BookCategoryVM } from './BookModals';
import { HomeWidgetsLayer, createWidget } from './HomeWidgetsLayer';
import { TabWebsiteGrid, type TabGridSite } from './TabWebsiteGrid';
import { SiteContextMenu, type SiteMenuItem } from '@/components/site-context-menu/SiteContextMenu';
import { useSiteContextMenu } from '@/components/site-context-menu/useSiteContextMenu';

const HOME_ID = 'home';
const HOME_TAB_STORAGE_KEY = 'betaHub_v1_homeTabName';

/** Lucide size for context menu rows */
const CTX_IC = 'h-3.5 w-3.5 shrink-0 opacity-75';

const SLOT_ORDER = ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'] as const;

interface LocalPage {
  id: string;
  name: string;
  websites: TabGridSite[];
  /** Site ids pinned to the start of the grid, in display order. */
  pinnedWebsiteIds?: string[];
}

function orderedWorkspaceSites(page: LocalPage): TabGridSite[] {
  const pinned = page.pinnedWebsiteIds ?? [];
  const pinnedSet = new Set(pinned);
  const byId = new Map(page.websites.map((s) => [s.id, s]));
  const pinnedOrdered: TabGridSite[] = [];
  for (const id of pinned) {
    const s = byId.get(id);
    if (s) pinnedOrdered.push(s);
  }
  const rest = page.websites.filter((s) => !pinnedSet.has(s.id));
  return [...pinnedOrdered, ...rest];
}

function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('stream') || n.includes('video')) return <Monitor size={16} />;
  if (n.includes('game')) return <Gamepad2 size={16} />;
  return <Layers size={16} />;
}

function buildHomeBookmarks(categories: Category[], websites: Website[]): BookCategoryVM[] {
  const sorted = [...categories].sort((a, b) => a.orderIndex - b.orderIndex);
  return sorted.slice(0, 6).map((cat, i) => ({
    id: cat.id,
    title: cat.name,
    slot: SLOT_ORDER[i],
    icon: categoryIcon(cat.name),
    items: websites
      .filter((w) => w.categoryId === cat.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((w) => ({
        id: w.id,
        name: w.title || w.url,
        url: w.url,
        clicks: 0,
      })),
  }));
}

function getMediaType(src: string): BgMediaState['type'] {
  try {
    const url = new URL(src);
    const extension = url.pathname.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension || '')) return 'video';
    if (extension === 'gif') return 'gif';
  } catch {
    if (src.includes('.mp4') || src.includes('.webm') || src.includes('.mov')) return 'video';
    if (src.includes('.gif')) return 'gif';
  }
  return 'image';
}

const EMPTY_ARRAY: any[] = [];

export default function BookDashboard() {
  const categories = useLiveQuery(() => db.categories.orderBy('orderIndex').toArray(), []);
  const websites = useLiveQuery(() => db.websites.toArray(), []);

  const [themeColor, setThemeColor] = useState('#ffffff29');
  const [blurAmount, setBlurAmount] = useState(4);
  const [bgMedia, setBgMedia] = useState<BgMediaState>({
    src: 'https://i1-e.pinimg.com/736x/48/b3/69/48b3697aee18beb2e90b1595def940ce.jpg',
    type: 'image',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [renameHomeValue, setRenameHomeValue] = useState('Home');
  const [newPageName, setNewPageName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [addForm, setAddForm] = useState({ name: '', url: '', categoryId: '' });
  const [editGridSiteForm, setEditGridSiteForm] = useState<{ id: string; name: string; url: string } | null>(
    null,
  );
  const [gridSitePendingDelete, setGridSitePendingDelete] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [activePageId, setActivePageId] = useState(HOME_ID);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [localPages, setLocalPages] = useState<LocalPage[]>([]);
  const [homeTabLabel, setHomeTabLabel] = useState('Home');
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [homeWidgets, setHomeWidgets] = useState<HomeWidget[]>([]);
  const [homeWidgetsReady, setHomeWidgetsReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    title: string;
    items: BookmarkItemVM[];
    icon: React.ReactNode;
    slot: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const homeImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(HOME_TAB_STORAGE_KEY);
      if (v?.trim()) queueMicrotask(() => setHomeTabLabel(v.trim()));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setHomeWidgets(loadHomeWidgets());
      setHomeWidgetsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!homeWidgetsReady) return;
    persistHomeWidgets(homeWidgets);
  }, [homeWidgets, homeWidgetsReady]);

  useEffect(() => {
    if (!activeModal) {
      queueMicrotask(() => {
        setEditGridSiteForm(null);
        setGridSitePendingDelete(null);
      });
    }
  }, [activeModal]);

  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((c) => ({ id: c.id, label: c.name })),
    [categories],
  );

  const homeBookmarks = useMemo(
    () => buildHomeBookmarks(categories ?? [], websites ?? []),
    [categories, websites],
  );

  const bookmarks = useMemo(
    () => (activePageId === HOME_ID ? homeBookmarks : []),
    [activePageId, homeBookmarks],
  );

  const workspaceSites = useMemo(() => {
    const page = localPages.find((p) => p.id === activePageId);
    if (!page) return [];
    return orderedWorkspaceSites(page);
  }, [activePageId, localPages]);

  const flatCategoriesForSearch = useMemo((): BookCategoryVM[] => {
    if (activePageId === HOME_ID) return homeBookmarks;
    const items: BookmarkItemVM[] = workspaceSites.map((s) => ({
      id: s.id,
      name: s.title,
      url: s.url,
      clicks: 0,
    }));
    return [
      {
        id: 'current-tab',
        title: 'This tab',
        slot: 'grid',
        icon: <Layers size={16} />,
        items,
      },
    ];
  }, [activePageId, homeBookmarks, workspaceSites]);

  const navbarPages = useMemo(
    () => [{ id: HOME_ID, name: homeTabLabel }, ...localPages.map((p) => ({ id: p.id, name: p.name }))],
    [homeTabLabel, localPages],
  );

  const getFavicon = useCallback((url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  }, []);

  const updateWallpaper = useCallback((src: string) => {
    setBgMedia({ src, type: getMediaType(src) });
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
        setSearchQuery('');
        setActiveModal(null);
      }
    },
    [searchQuery],
  );

  const handlePickHomeElement = useCallback((choice: 'time' | 'calendar' | 'image') => {
    if (choice === 'image') {
      queueMicrotask(() => homeImageInputRef.current?.click());
      return;
    }
    setHomeWidgets((prev) => [...prev, createWidget(choice, prev)]);
  }, []);

  const onHomeWidgetImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file?.type.startsWith('image/')) return;
    const maxBytes = Math.floor(1.4 * 1024 * 1024);
    if (file.size > maxBytes) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setHomeWidgets((prev) => [...prev, createWidget('image', prev, url)]);
    };
    reader.readAsDataURL(file);
  }, []);

  const reorderHomeCategoryToSlot = useCallback(async (cardId: string, targetSlot: string) => {
    const slotIndex = SLOT_ORDER.indexOf(targetSlot as (typeof SLOT_ORDER)[number]);
    if (slotIndex < 0) return;
    const cats = await db.categories.orderBy('orderIndex').toArray();
    const fromIdx = cats.findIndex((c) => c.id === cardId);
    if (fromIdx < 0) return;
    const arr = [...cats];
    const [removed] = arr.splice(fromIdx, 1);
    const toIdx = Math.min(slotIndex, arr.length);
    arr.splice(toIdx, 0, removed);
    await db.transaction('rw', db.categories, async () => {
      for (let i = 0; i < arr.length; i++) {
        await db.categories.update(arr[i].id, { orderIndex: i, syncStatus: 'DIRTY' });
      }
    });
  }, []);

  const handleDropToSlot = useCallback(
    async (itemId: string, targetSlot: string) => {
      if (activePageId !== HOME_ID) return;
      await reorderHomeCategoryToSlot(itemId, targetSlot);
    },
    [activePageId, reorderHomeCategoryToSlot],
  );

  const handleCreatePageClick = useCallback(() => setActiveModal('create_page'), []);
  const handleOpenNotepadClick = useCallback(() => setActiveModal('notepad'), []);
  const handleCreateCategoryClick = useCallback(() => setActiveModal('create_category'), []);

  const handleOpenCreateCategoryFromSettings = useCallback(() => {
    setActiveModal('create_category');
  }, []);

  const handleOpenSite = useCallback((s: { url: string }) => {
    window.open(s.url, '_blank', 'noopener,noreferrer');
  }, []);

  const openAddWebsite = useCallback(() => {
    setAddForm({
      name: '',
      url: '',
      categoryId: activePageId === HOME_ID ? (categoryOptions[0]?.id ?? '') : '',
    });
    setActiveModal('add');
  }, [activePageId, categoryOptions]);

  const handleAddBookmark = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = normalizeUserWebsiteUrl(addForm.url);
      if (!normalized) return;
      const title = addForm.name.trim() || defaultBookmarkNameFromUrl(normalized);
      if (activePageId === HOME_ID) {
        if (!addForm.categoryId) return;
        const now = Date.now();
        const list = (websites ?? []).filter((w) => w.categoryId === addForm.categoryId);
        const maxOrder = list.reduce((m, w) => Math.max(m, w.orderIndex), -1);
        await db.websites.add({
          id: crypto.randomUUID(),
          categoryId: addForm.categoryId,
          url: normalized,
          normalizedUrl: normalized.toLowerCase(),
          title,
          isPinned: false,
          orderIndex: maxOrder + 1,
          syncStatus: 'DIRTY',
          version: 1,
          updatedAt: now,
        });
      } else {
        const site: TabGridSite = {
          id: crypto.randomUUID(),
          title,
          url: normalized,
        };
        setLocalPages((prev) =>
          prev.map((page) =>
            page.id === activePageId ? { ...page, websites: [...page.websites, site] } : page,
          ),
        );
      }
      setAddForm({ name: '', url: '', categoryId: '' });
      setActiveModal(null);
    },
    [addForm, activePageId, websites],
  );

  const handleCreatePage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPageName.trim()) return;
      const id = crypto.randomUUID();
      setLocalPages((prev) => [...prev, { id, name: newPageName.trim(), websites: [], pinnedWebsiteIds: [] }]);
      setActivePageId(id);
      setNewPageName('');
      setActiveModal(null);
    },
    [newPageName],
  );

  const handleCreateCategory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName.trim()) return;
      const now = Date.now();
      const maxOrder = (categories ?? []).reduce((m, c) => Math.max(m, c.orderIndex), -1);
      await db.categories.add({
        id: crypto.randomUUID(),
        name: newCatName.trim(),
        orderIndex: maxOrder + 1,
        visibility: 'PRIVATE',
        syncStatus: 'DIRTY',
        version: 1,
        updatedAt: now,
      });
      setNewCatName('');
      setActiveModal(null);
    },
    [categories, newCatName],
  );

  const handleRenameHomeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const next = renameHomeValue.trim() || 'Home';
      setHomeTabLabel(next);
      try {
        localStorage.setItem(HOME_TAB_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      setActiveModal(null);
    },
    [renameHomeValue],
  );

  const handleItemClick = useCallback((_catId: string, _itemId: string, url: string) => {
    window.open(url, '_blank');
  }, []);

  const pinGridSite = useCallback(
    (siteId: string) => {
      if (activePageId === HOME_ID) return;
      setLocalPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          if (!page.websites.some((w) => w.id === siteId)) return page;
          const pins = [...(page.pinnedWebsiteIds ?? [])];
          if (pins.includes(siteId)) return page;
          pins.push(siteId);
          return { ...page, pinnedWebsiteIds: pins };
        }),
      );
    },
    [activePageId],
  );

  const unpinGridSite = useCallback(
    (siteId: string) => {
      if (activePageId === HOME_ID) return;
      setLocalPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          const pins = page.pinnedWebsiteIds ?? [];
          if (!pins.includes(siteId)) return page;
          return { ...page, pinnedWebsiteIds: pins.filter((id) => id !== siteId) };
        }),
      );
    },
    [activePageId],
  );

  const handleSaveEditGridSite = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!editGridSiteForm || activePageId === HOME_ID) return;
      const normalized = normalizeUserWebsiteUrl(editGridSiteForm.url);
      if (!normalized) return;
      const finalTitle = editGridSiteForm.name.trim() || defaultBookmarkNameFromUrl(normalized);
      setLocalPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          return {
            ...page,
            websites: page.websites.map((w) =>
              w.id === editGridSiteForm.id ? { ...w, url: normalized, title: finalTitle } : w,
            ),
          };
        }),
      );
      setActiveModal(null);
    },
    [editGridSiteForm, activePageId],
  );

  const handleConfirmDeleteGridSite = useCallback(() => {
    if (!gridSitePendingDelete || activePageId === HOME_ID) return;
    const { id } = gridSitePendingDelete;
    setLocalPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) return page;
        const websites = page.websites.filter((w) => w.id !== id);
        const pinnedWebsiteIds = (page.pinnedWebsiteIds ?? []).filter((pid) => pid !== id);
        return { ...page, websites, pinnedWebsiteIds };
      }),
    );
    setActiveModal(null);
  }, [gridSitePendingDelete, activePageId]);

  const handleMoveItem = useCallback(
    async (itemId: string, fromCatId: string, toCatId: string, targetIndex?: number) => {
      if (activePageId !== HOME_ID) return;
      void targetIndex;
      const now = Date.now();
      const targetList = (websites ?? []).filter((w) => w.categoryId === toCatId && w.id !== itemId);
      const maxOrder = targetList.reduce((m, w) => Math.max(m, w.orderIndex), -1);
      await db.websites.update(itemId, {
        categoryId: toCatId,
        orderIndex: maxOrder + 1,
        syncStatus: 'DIRTY',
        updatedAt: now,
      });
    },
    [activePageId, websites],
  );

  const copyText = useCallback((text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
  }, []);

  const buildContextMenu = useCallback(
    (target: HTMLElement): SiteMenuItem[] | null => {
      const ctx = target.dataset.ctx;
      if (!ctx) return null;

      if (activePageId !== HOME_ID) {
        if (ctx === 'grid-site') {
          const url = target.dataset.url ?? '';
          const title = target.dataset.title ?? '';
          const itemId = target.dataset.itemId ?? '';
          const page = localPages.find((p) => p.id === activePageId);
          const pins = page?.pinnedWebsiteIds ?? [];
          const isPinned = pins.includes(itemId);
          return [
            isPinned
              ? {
                  id: 'unpin',
                  label: 'Unpin from start',
                  icon: <PinOff className={CTX_IC} aria-hidden />,
                  onSelect: () => unpinGridSite(itemId),
                }
              : {
                  id: 'pin',
                  label: 'Pin to start of grid',
                  icon: <Pin className={CTX_IC} aria-hidden />,
                  onSelect: () => pinGridSite(itemId),
                },
            {
              id: 'edit',
              label: 'Edit…',
              icon: <Pencil className={CTX_IC} aria-hidden />,
              onSelect: () => {
                setEditGridSiteForm({ id: itemId, name: title, url });
                setActiveModal('edit_grid_site');
              },
            },
            {
              id: 'remove',
              label: 'Remove…',
              icon: <Trash2 className={CTX_IC} aria-hidden />,
              danger: true,
              onSelect: () => {
                setGridSitePendingDelete({ id: itemId, title: title || url });
                setActiveModal('confirm_delete_grid_site');
              },
            },
          ];
        }
        if (ctx === 'grid-add') {
          return [
            {
              id: 'add',
              label: 'Add website',
              icon: <Plus className={CTX_IC} aria-hidden />,
              onSelect: () => openAddWebsite(),
            },
          ];
        }
      }

      if (activePageId === HOME_ID) {
        if (ctx === 'bookmark-item') {
          const url = target.dataset.url ?? '';
          const title = target.dataset.title ?? '';
          const itemId = target.dataset.itemId ?? '';
          return [
            {
              id: 'open',
              label: 'Open in new tab',
              icon: <ExternalLink className={CTX_IC} aria-hidden />,
              onSelect: () => window.open(url, '_blank', 'noopener,noreferrer'),
            },
            {
              id: 'copy-url',
              label: 'Copy URL',
              icon: <Link2 className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(url),
            },
            {
              id: 'copy-title',
              label: 'Copy title',
              icon: <Type className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(title),
            },
            {
              id: 'remove',
              label: 'Remove bookmark',
              icon: <Trash2 className={CTX_IC} aria-hidden />,
              danger: true,
              onSelect: async () => {
                await db.websites.delete(itemId);
              },
            },
          ];
        }

        if (ctx === 'bookmark-card') {
          const categoryId = target.dataset.categoryId ?? '';
          const title = target.dataset.categoryTitle ?? '';
          const cat = bookmarks.find((b) => b.id === categoryId);
          const items = cat?.items ?? [];
          const icon = cat ? categoryIcon(cat.title) : <Layers size={16} />;
          return [
            {
              id: 'view',
              label: 'View group',
              icon: <LayoutGrid className={CTX_IC} aria-hidden />,
              onSelect: () => {
                if (cat) {
                  setSelectedCategory({
                    id: cat.id,
                    title: cat.title,
                    items: cat.items,
                    icon,
                    slot: cat.slot,
                  });
                  setActiveModal('category');
                }
              },
            },
            {
              id: 'add',
              label: 'Add bookmark…',
              icon: <Plus className={CTX_IC} aria-hidden />,
              onSelect: () => {
                setAddForm({ name: '', url: '', categoryId });
                setActiveModal('add');
              },
            },
            {
              id: 'open-all',
              label: 'Open all links',
              icon: <ExternalLink className={CTX_IC} aria-hidden />,
              disabled: items.length === 0,
              onSelect: () => {
                for (const it of items) {
                  window.open(it.url, '_blank', 'noopener,noreferrer');
                }
              },
            },
            {
              id: 'copy-name',
              label: 'Copy group name',
              icon: <Copy className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(title),
            },
            {
              id: 'delete-group',
              label: 'Delete group',
              icon: <Trash2 className={CTX_IC} aria-hidden />,
              danger: true,
              onSelect: async () => {
                await db.transaction('rw', db.websites, db.categories, async () => {
                  await db.websites.where('categoryId').equals(categoryId).delete();
                  await db.categories.delete(categoryId);
                });
              },
            },
          ];
        }

        if (ctx === 'bookmark-expand') {
          const categoryId = target.dataset.categoryId ?? '';
          const expanded = expandedCats.includes(categoryId);
          return [
            {
              id: 'toggle',
              label: expanded ? 'Show fewer links' : 'Show all links',
              icon: expanded ? (
                <ChevronUp className={CTX_IC} aria-hidden />
              ) : (
                <ChevronDown className={CTX_IC} aria-hidden />
              ),
              onSelect: () =>
                setExpandedCats((prev) =>
                  prev.includes(categoryId) ? prev.filter((i) => i !== categoryId) : [...prev, categoryId],
                ),
            },
          ];
        }

        if (ctx === 'bookmark-empty') {
          const categoryId = target.dataset.categoryId ?? '';
          return [
            {
              id: 'add-here',
              label: 'Add bookmark…',
              icon: <Plus className={CTX_IC} aria-hidden />,
              onSelect: () => {
                setAddForm({ name: '', url: '', categoryId });
                setActiveModal('add');
              },
            },
          ];
        }

        if (ctx === 'slot-empty') {
          return [
            {
              id: 'new-group-slot',
              label: 'Add elements',
              icon: <FolderPlus className={CTX_IC} aria-hidden />,
              onSelect: () => setActiveModal('create_category'),
            },
          ];
        }

        if (ctx === 'search-input' || ctx === 'search-form' || ctx === 'search-shell') {
          return [
            {
              id: 'paste',
              label: 'Paste',
              icon: <ClipboardPaste className={CTX_IC} aria-hidden />,
              onSelect: async () => {
                try {
                  const t = await navigator.clipboard.readText();
                  setSearchQuery((q) => q + t);
                } catch {
                  /* ignore */
                }
              },
            },
            {
              id: 'clear',
              label: 'Clear',
              icon: <X className={CTX_IC} aria-hidden />,
              onSelect: () => setSearchQuery(''),
            },
            {
              id: 'select-all',
              label: 'Select all',
              icon: <Copy className={CTX_IC} aria-hidden />,
              onSelect: () => {
                const input = document.getElementById('site-dashboard-search') as HTMLInputElement | null;
                input?.focus();
                input?.select();
              },
            },
            {
              id: 'search-google',
              label: 'Search with Google',
              icon: <Search className={CTX_IC} aria-hidden />,
              disabled: !searchQuery.trim(),
              onSelect: () => {
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
                  '_blank',
                  'noopener,noreferrer',
                );
              },
            },
          ];
        }

        if (ctx === 'search-link') {
          const url = target.dataset.url ?? '';
          const label = target.dataset.label ?? '';
          return [
            {
              id: 'open',
              label: 'Open',
              icon: <ExternalLink className={CTX_IC} aria-hidden />,
              onSelect: () => window.open(url, '_blank', 'noopener,noreferrer'),
            },
            {
              id: 'copy',
              label: 'Copy link',
              icon: <Link2 className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(url),
            },
            {
              id: 'copy-label',
              label: 'Copy label',
              icon: <Type className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(label),
            },
          ];
        }

        if (ctx === 'clock') {
          const line = new Date().toLocaleString();
          return [
            {
              id: 'copy-time',
              label: 'Copy date & time',
              icon: <ClockMenuIcon className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(line),
            },
            {
              id: 'copy-iso',
              label: 'Copy ISO timestamp',
              icon: <CalendarClock className={CTX_IC} aria-hidden />,
              onSelect: () => copyText(new Date().toISOString()),
            },
          ];
        }

        if (ctx === 'add-elements-home') {
          return [
            {
              id: 'create',
              label: 'Add elements…',
              icon: <FolderPlus className={CTX_IC} aria-hidden />,
              onSelect: () => setActiveModal('add_home_element'),
            },
          ];
        }
      }

      if (ctx === 'nav-tab') {
        const pageId = target.dataset.pageId ?? '';
        const pageName = target.dataset.pageName ?? '';
        const items: SiteMenuItem[] = [];
        if (pageId === HOME_ID) {
          items.push({
            id: 'rename-home',
            label: 'Rename tab',
            icon: <Pencil className={CTX_IC} aria-hidden />,
            onSelect: () => {
              setRenameHomeValue(homeTabLabel);
              setActiveModal('rename_home');
            },
          });
          items.push({
            id: 'copy',
            label: 'Copy tab name',
            icon: <Copy className={CTX_IC} aria-hidden />,
            onSelect: () => copyText(pageName),
          });
        } else {
          items.push({
            id: 'focus',
            label: 'Switch to tab',
            icon: <ArrowRightToLine className={CTX_IC} aria-hidden />,
            onSelect: () => setActivePageId(pageId),
          });
          items.push({
            id: 'copy-tab',
            label: 'Copy tab name',
            icon: <Copy className={CTX_IC} aria-hidden />,
            onSelect: () => copyText(pageName),
          });
          items.push({
            id: 'close-tab',
            label: 'Close tab',
            icon: <X className={CTX_IC} aria-hidden />,
            danger: true,
            onSelect: () => {
              setLocalPages((p) => p.filter((x) => x.id !== pageId));
              setActivePageId((cur) => (cur === pageId ? HOME_ID : cur));
            },
          });
        }
        return items;
      }

      return null;
    },
    [
      activePageId,
      bookmarks,
      copyText,
      expandedCats,
      homeTabLabel,
      localPages,
      openAddWebsite,
      pinGridSite,
      unpinGridSite,
      searchQuery,
      setActiveModal,
      setActivePageId,
      setAddForm,
      setExpandedCats,
      setLocalPages,
      setSearchQuery,
      setSelectedCategory,
    ],
  );

  const { menu, closeMenu, rootHandlers } = useSiteContextMenu(buildContextMenu, {
    closeSignal: activeModal,
  });

  const homeBody = (
    <>
      <button
        type="button"
        data-ctx="add-elements-home"
        onClick={() => setActiveModal('add_home_element')}
        style={{ backgroundColor: themeColor }}
        className="absolute bottom-6 left-6 z-50 flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white shadow-2xl transition-all active:scale-95"
        aria-label="Add elements to Home"
      >
        <Plus size={16} aria-hidden />
        Add elements
      </button>

      {homeWidgetsReady && (
        <HomeWidgetsLayer
          widgets={homeWidgets}
          onWidgetsChange={setHomeWidgets}
          themeColor={themeColor}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between p-12 pt-24">
        {bookmarks.length > 0 ? (
          <>
            <div className="pointer-events-auto flex h-full flex-col gap-4">
          {(['L1', 'L2', 'L3'] as const).map((slotId) => {
            const category = bookmarks.find((b) => b.slot === slotId);
            return (
              <div
                key={slotId}
                data-ctx={!category ? 'slot-empty' : undefined}
                data-slot={!category ? slotId : undefined}
                className={`w-64 rounded-2xl transition-all ${
                  !category
                    ? 'min-h-[100px] border-2 border-dashed border-white/5 bg-white/2'
                    : 'h-auto'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const cardId = e.dataTransfer.getData('cardId');
                  if (cardId) void handleDropToSlot(cardId, slotId);
                }}
              >
                {category && (
                  <BookmarkCard
                    {...category}
                    expandedCats={expandedCats}
                    toggleExpand={(id) =>
                      setExpandedCats((prev) =>
                        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                      )
                    }
                    setAddForm={setAddForm}
                    setActiveModal={setActiveModal}
                    handleItemClick={handleItemClick}
                    handleMoveItem={handleMoveItem}
                    handleDropToSlot={handleDropToSlot}
                    getFavicon={getFavicon}
                    setSelectedCategory={setSelectedCategory}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none flex h-full min-w-0 flex-1 flex-col items-center justify-center px-8" />

        <div className="pointer-events-auto flex h-full flex-col gap-4">
          {(['R1', 'R2', 'R3'] as const).map((slotId) => {
            const category = bookmarks.find((b) => b.slot === slotId);
            return (
              <div
                key={slotId}
                data-ctx={!category ? 'slot-empty' : undefined}
                data-slot={!category ? slotId : undefined}
                className={`w-64 rounded-2xl transition-all ${
                  !category
                    ? 'min-h-[100px] border-2 border-dashed border-white/5 bg-white/2'
                    : 'h-auto'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const cardId = e.dataTransfer.getData('cardId');
                  if (cardId) void handleDropToSlot(cardId, slotId);
                }}
              >
                {category && (
                  <BookmarkCard
                    {...category}
                    expandedCats={expandedCats}
                    toggleExpand={(id) =>
                      setExpandedCats((prev) =>
                        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                      )
                    }
                    setAddForm={setAddForm}
                    setActiveModal={setActiveModal}
                    handleItemClick={handleItemClick}
                    handleMoveItem={handleMoveItem}
                    handleDropToSlot={handleDropToSlot}
                    getFavicon={getFavicon}
                    setSelectedCategory={setSelectedCategory}
                  />
                )}
              </div>
            );
          })}
        </div>
          </>
        ) : (
          <div className="h-full w-full shrink-0" aria-hidden />
        )}
      </div>
    </>
  );

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black [touch-callout:none]"
      {...rootHandlers}
    >
      <Background
        mediaType={bgMedia.type}
        mediaSrc={bgMedia.src}
        muted={muted}
        setMuted={setMuted}
        videoRef={videoRef}
        blurAmount={blurAmount}
      />

      <BookNavbarClassic
        pages={navbarPages}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        themeColor={themeColor}
        createPage={handleCreatePageClick}
        setActiveModal={setActiveModal}
      />

      {activePageId === HOME_ID ? (
        homeBody
      ) : (
        <div className="absolute inset-0 top-[8vh] z-30 min-h-0 overflow-y-auto overscroll-contain">
          <TabWebsiteGrid
            sites={workspaceSites}
            getFavicon={getFavicon}
            onOpenSite={handleOpenSite}
            onAddClick={openAddWebsite}
          />
        </div>
      )}

      <BookSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setActiveModal={setActiveModal}
        themeColor={themeColor}
      />

      <BookModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        themeColor={themeColor}
        bgMedia={bgMedia}
        updateWallpaper={updateWallpaper}
        blurAmount={blurAmount}
        setBlurAmount={setBlurAmount}
        setThemeColor={setThemeColor}
        addForm={addForm}
        setAddForm={setAddForm}
        handleAddBookmark={handleAddBookmark}
        flatCategories={flatCategoriesForSearch}
        getFavicon={getFavicon}
        selectedCategory={selectedCategory}
        handleItemClick={handleItemClick}
        newPageName={newPageName}
        setNewPageName={setNewPageName}
        handleCreatePage={handleCreatePage}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        handleCreateCategory={handleCreateCategory}
        renameHomeValue={renameHomeValue}
        setRenameHomeValue={setRenameHomeValue}
        handleRenameHomeSubmit={handleRenameHomeSubmit}
        categoryOptions={activePageId === HOME_ID ? categoryOptions : EMPTY_ARRAY}
        onOpenCreateCategoryFromSettings={
          activePageId === HOME_ID ? handleOpenCreateCategoryFromSettings : undefined
        }
        editGridSiteForm={editGridSiteForm}
        setEditGridSiteForm={setEditGridSiteForm}
        handleSaveEditGridSite={handleSaveEditGridSite}
        gridSitePendingDelete={gridSitePendingDelete}
        handleConfirmDeleteGridSite={handleConfirmDeleteGridSite}
        onPickHomeElement={activePageId === HOME_ID ? handlePickHomeElement : undefined}
      />

      <input
        ref={homeImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={onHomeWidgetImageFile}
      />

      <SiteContextMenu menu={menu} onClose={closeMenu} />
    </div>
  );
}
