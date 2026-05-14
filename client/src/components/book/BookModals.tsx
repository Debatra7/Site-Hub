'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  FolderPlus,
  Image as ImageIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Type,
  Save,
  Layers,
  X,
} from 'lucide-react';
import { defaultBookmarkNameFromUrl, normalizeUserWebsiteUrl } from '@/lib/websiteUrl';
import type { BookmarkItemVM } from './BookmarkCard';
import { StickyNotesBoard } from './StickyNotesBoard';

export interface BgMediaState {
  src: string;
  type: 'video' | 'image' | 'gif';
}

export interface BookCategoryVM {
  id: string;
  title: string;
  slot: string;
  icon: React.ReactNode;
  items: BookmarkItemVM[];
}

interface BookModalsProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  themeColor: string;
  bgMedia: BgMediaState;
  updateWallpaper: (src: string) => void;
  blurAmount: number;
  setBlurAmount: (amount: number) => void;
  setThemeColor: (color: string) => void;
  addForm: { name: string; url: string; categoryId: string };
  setAddForm: React.Dispatch<React.SetStateAction<{ name: string; url: string; categoryId: string }>>;
  handleAddBookmark: (e: React.FormEvent) => void;
  flatCategories: BookCategoryVM[];
  getFavicon: (url: string) => string | null;
  selectedCategory: {
    id: string;
    title: string;
    items: BookmarkItemVM[];
    icon: React.ReactNode;
    slot: string;
  } | null;
  handleItemClick: (catId: string, itemId: string, url: string) => void;
  newPageName: string;
  setNewPageName: (name: string) => void;
  handleCreatePage: (e: React.FormEvent) => void;
  newCatName: string;
  setNewCatName: (name: string) => void;
  handleCreateCategory: (e: React.FormEvent) => void;
  renameHomeValue: string;
  setRenameHomeValue: (v: string) => void;
  handleRenameHomeSubmit: (e: React.FormEvent) => void;
  categoryOptions: { id: string; label: string }[];
  onOpenCreateCategoryFromSettings?: () => void;
  editGridSiteForm: { id: string; name: string; url: string } | null;
  setEditGridSiteForm: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; url: string } | null>
  >;
  handleSaveEditGridSite: (e: React.FormEvent) => void;
  gridSitePendingDelete: { id: string; title: string } | null;
  handleConfirmDeleteGridSite: () => void;
  /** Home “Add elements” picker */
  onPickHomeElement?: (choice: 'time' | 'calendar' | 'image') => void;
}

export function BookModals({
  activeModal,
  setActiveModal,
  searchQuery,
  setSearchQuery,
  handleSearch,
  themeColor,
  bgMedia,
  updateWallpaper,
  blurAmount,
  setBlurAmount,
  setThemeColor,
  addForm,
  setAddForm,
  handleAddBookmark,
  flatCategories,
  getFavicon,
  selectedCategory,
  handleItemClick,
  newPageName,
  setNewPageName,
  handleCreatePage,
  newCatName,
  setNewCatName,
  handleCreateCategory,
  renameHomeValue,
  setRenameHomeValue,
  handleRenameHomeSubmit,
  categoryOptions,
  onOpenCreateCategoryFromSettings,
  editGridSiteForm,
  setEditGridSiteForm,
  handleSaveEditGridSite,
  gridSitePendingDelete,
  handleConfirmDeleteGridSite,
  onPickHomeElement,
}: BookModalsProps) {
  const currentCat =
    selectedCategory &&
    (flatCategories.find((c) => c.id === selectedCategory.id) ?? selectedCategory);

  const derivedBookmarkName = useMemo(() => {
    const n = normalizeUserWebsiteUrl(addForm.url);
    return n ? defaultBookmarkNameFromUrl(n) : null;
  }, [addForm.url]);

  const canSubmitAddBookmark = derivedBookmarkName !== null;

  const derivedEditGridName = useMemo(() => {
    if (!editGridSiteForm) return null;
    const n = normalizeUserWebsiteUrl(editGridSiteForm.url);
    return n ? defaultBookmarkNameFromUrl(n) : null;
  }, [editGridSiteForm]);

  const canSubmitEditGridSite = derivedEditGridName !== null;

  const colorPickerValue =
    themeColor.startsWith('#') && themeColor.length === 7 ? themeColor : '#000000';

  return (
    <AnimatePresence>
      {activeModal && (
        <div
          className={
            activeModal === 'notepad'
              ? 'absolute inset-0 z-[100]'
              : 'absolute inset-0 z-[100] flex items-center justify-center p-6'
          }
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
            className="absolute inset-0 bg-black/60"
          />

          {activeModal === 'rename_home' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-10 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-xl font-bold text-white">Rename Home</h2>
              <form onSubmit={handleRenameHomeSubmit} className="space-y-6">
                <div>
                  <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Tab name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={renameHomeValue}
                    onChange={(e) => setRenameHomeValue(e.target.value)}
                    placeholder="Home"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-white/10 transition-all focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor }}
                  className="w-full rounded-2xl py-4 font-bold text-white shadow-xl transition-all active:scale-95"
                >
                  Save
                </button>
              </form>
            </motion.div>
          )}

          {activeModal === 'create_page' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-10 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-xl font-bold text-white">Create New Page</h2>
              <form onSubmit={handleCreatePage} className="space-y-6">
                <div>
                  <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Page Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="e.g. Work, Entertainment..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-white/10 transition-all focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor }}
                  className="w-full rounded-2xl py-4 font-bold text-white shadow-xl transition-all active:scale-95"
                >
                  Create Page
                </button>
              </form>
            </motion.div>
          )}

          {activeModal === 'create_category' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-10 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-xl font-bold text-white">Create New Group</h2>
              <form onSubmit={handleCreateCategory} className="space-y-6">
                <div>
                  <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Group Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Streaming, Social..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-white/10 transition-all focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor }}
                  className="w-full rounded-2xl py-4 font-bold text-white shadow-xl transition-all active:scale-95"
                >
                  Create Group
                </button>
              </form>
            </motion.div>
          )}

          {activeModal === 'add_home_element' && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#121212]/95 p-8 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-xl font-bold text-white">Add element</h2>
              <p className="mb-6 text-sm text-white/45">
                Home starts with only the search bar. Add a group (bookmark column), time, calendar, or an image.
                Drag and resize blocks; they stay separated.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('create_category')}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-5 text-white/90 transition hover:border-white/25 hover:bg-white/10"
                >
                  <FolderPlus className="h-7 w-7 text-white/50" aria-hidden />
                  <span className="text-xs font-semibold">Create group</span>
                  <span className="text-center text-[10px] text-white/35">Empty group you can fill later</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPickHomeElement?.('time');
                    setActiveModal(null);
                  }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-5 text-white/90 transition hover:border-white/25 hover:bg-white/10"
                >
                  <Clock className="h-7 w-7 text-white/50" aria-hidden />
                  <span className="text-xs font-semibold">Time</span>
                  <span className="text-center text-[10px] text-white/35">Resizable clock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPickHomeElement?.('calendar');
                    setActiveModal(null);
                  }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-5 text-white/90 transition hover:border-white/25 hover:bg-white/10"
                >
                  <CalendarDays className="h-7 w-7 text-white/50" aria-hidden />
                  <span className="text-xs font-semibold">Calendar</span>
                  <span className="text-center text-[10px] text-white/35">Month view</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPickHomeElement?.('image');
                    setActiveModal(null);
                  }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-5 text-white/90 transition hover:border-white/25 hover:bg-white/10"
                >
                  <ImageIcon className="h-7 w-7 text-white/50" aria-hidden />
                  <span className="text-xs font-semibold">Image</span>
                  <span className="text-center text-[10px] text-white/35">Pick a picture</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {activeModal === 'category' && currentCat && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/90 p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-[0.05] blur-[100px]"
                style={{ backgroundColor: themeColor }}
              />

              <div className="relative">
                <div className="mb-12 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40">
                      {currentCat.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-white">{currentCat.title}</h2>
                      <p className="mt-1 text-xs font-bold tracking-[0.3em] text-white/20 uppercase">
                        {currentCat.items.length} bookmarks
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full bg-white/5 p-3 text-white/20 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                </div>

                <div className="no-scrollbar grid max-h-[500px] grid-cols-6 gap-3 overflow-y-auto pr-4">
                  {currentCat.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e: React.DragEvent) => {
                        e.dataTransfer.setData(
                          'itemData',
                          JSON.stringify({ itemId: item.id, fromCatId: currentCat.id }),
                        );
                        setActiveModal(null);
                      }}
                      onClick={() => handleItemClick(currentCat.id, item.id, item.url)}
                      className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:scale-105 hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFavicon(item.url) || ''}
                        alt=""
                        className="h-4 w-4 flex-shrink-0 rounded-md object-contain opacity-40 transition-opacity group-hover:opacity-100"
                        onError={(ev) => {
                          (ev.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                        <span className="truncate text-[11px] font-medium text-white">{item.name}</span>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setAddForm({ name: '', url: '', categoryId: currentCat.id });
                      setActiveModal('add');
                    }}
                    className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-3 transition-all hover:border-white/30 hover:bg-white/5"
                  >
                    <Plus size={12} className="text-white/20 group-hover:text-white/40" />
                    <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Add</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeModal === 'search' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#121212] p-10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white">Search Workspace</h2>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="-mr-2 p-2 text-white/20 transition-colors hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <div className="absolute top-1/2 left-6 -translate-y-1/2 text-white/20">
                    <Search size={22} />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bookmarks or Google..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-5 pr-32 pl-16 text-lg text-white transition-all placeholder:text-white/10 focus:outline-none"
                    onFocus={(e) => {
                      e.target.style.borderColor = themeColor;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <button
                      type="submit"
                      style={{ backgroundColor: themeColor }}
                      className="rounded-xl px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all active:scale-95"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>

              <div className="no-scrollbar mt-8 max-h-[400px] space-y-2 overflow-y-auto">
                {searchQuery.trim() !== '' &&
                  flatCategories
                    .flatMap((c) => c.items.map((i) => ({ ...i, catId: c.id })))
                    .filter(
                      (item) =>
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.url.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          window.open(item.url, '_blank');
                          setActiveModal(null);
                          setSearchQuery('');
                        }}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.05]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getFavicon(item.url) || ''}
                            alt=""
                            className="h-5 w-5 rounded-md object-contain opacity-60"
                            onError={(ev) => {
                              (ev.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-sm font-medium text-white">{item.name}</h4>
                          <p className="max-w-[300px] truncate text-[10px] text-white/20">{item.url}</p>
                        </div>
                      </button>
                    ))}
              </div>
            </motion.div>
          )}

          {activeModal === 'wallpaper' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white">Wallpaper</h2>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="-mr-2 p-2 text-white/20 transition-colors hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Media URL
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={bgMedia.src}
                    onChange={(e) => updateWallpaper(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all focus:outline-none"
                    onFocus={(e) => {
                      e.target.style.borderColor = themeColor;
                    }}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ backgroundColor: themeColor }}
                  className="w-full rounded-xl py-3.5 text-xs font-bold tracking-[0.2em] text-white uppercase transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeModal === 'theme' && (
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] p-10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-8 text-2xl font-bold text-white">Personalize</h2>

              <div className="space-y-8">
                <div>
                  <label className="mb-4 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Presets
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      '#dc2626',
                      '#2563eb',
                      '#16a34a',
                      '#9333ea',
                      '#ea580c',
                      '#0891b2',
                      '#be185d',
                      '#4d7c0f',
                      '#4338ca',
                      '#000000',
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setThemeColor(color)}
                        style={{ backgroundColor: color }}
                        className={`aspect-square rounded-full border-2 transition-all ${
                          themeColor === color
                            ? 'scale-110 border-white shadow-lg shadow-white/20'
                            : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-4 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Custom Color
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all focus:outline-none"
                        style={{ borderColor: `${themeColor}40` }}
                      />
                    </div>
                    <input
                      type="color"
                      value={colorPickerValue}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-11 w-12 cursor-pointer overflow-hidden rounded-xl border-none bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-4 block text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                    Glass Blur
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(parseFloat(e.target.value))}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/5 accent-white/20"
                      style={{ accentColor: themeColor }}
                    />
                    <span className="w-8 text-right font-mono text-[10px] text-white/40">{blurAmount}px</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ backgroundColor: themeColor }}
                  className="rounded-full px-8 py-3 text-xs font-bold tracking-widest text-white uppercase"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}

          {activeModal === 'add' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-white">
                  <Plus className="h-6 w-6 shrink-0 text-white/50" aria-hidden />
                  Add Bookmark
                </h2>

                <form onSubmit={handleAddBookmark} className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                      <Link2 className="h-3 w-3 text-white/35" aria-hidden />
                      Website URL
                    </label>
                    <input
                      autoFocus
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={addForm.url}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="example.com or path.example.com/docs"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/10 transition-all focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                      <Type className="h-3 w-3 text-white/35" aria-hidden />
                      Name <span className="font-normal text-white/25">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Shown on the tile"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/10 transition-all focus:outline-none"
                    />
                    {derivedBookmarkName && (
                      <p className="mt-2 text-[11px] text-white/35">
                        If you leave the name empty, we use:{' '}
                        <span className="font-medium text-white/55">{derivedBookmarkName}</span>
                      </p>
                    )}
                  </div>
                  {categoryOptions.length > 0 && (
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                        <Layers className="h-3 w-3 text-white/35" aria-hidden />
                        Category (Home)
                      </label>
                      <select
                        value={addForm.categoryId}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
                      >
                        {categoryOptions.map((o) => (
                          <option key={o.id} value={o.id} className="bg-neutral-900">
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmitAddBookmark}
                    style={{ backgroundColor: themeColor }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-xl transition-all enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Save Bookmark
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeModal === 'edit_grid_site' && editGridSiteForm && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-white">
                  <Pencil className="h-6 w-6 shrink-0 text-white/50" aria-hidden />
                  Edit website
                </h2>

                <form onSubmit={handleSaveEditGridSite} className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                      <Link2 className="h-3 w-3 text-white/35" aria-hidden />
                      Website URL
                    </label>
                    <input
                      autoFocus
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={editGridSiteForm.url}
                      onChange={(e) =>
                        setEditGridSiteForm((prev) =>
                          prev ? { ...prev, url: e.target.value } : prev,
                        )
                      }
                      placeholder="example.com or path.example.com/docs"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/10 transition-all focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                      <Type className="h-3 w-3 text-white/35" aria-hidden />
                      Name <span className="font-normal text-white/25">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editGridSiteForm.name}
                      onChange={(e) =>
                        setEditGridSiteForm((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev,
                        )
                      }
                      placeholder="Shown on the tile"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/10 transition-all focus:outline-none"
                    />
                    {derivedEditGridName && (
                      <p className="mt-2 text-[11px] text-white/35">
                        If you leave the name empty, we use:{' '}
                        <span className="font-medium text-white/55">{derivedEditGridName}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!canSubmitEditGridSite}
                    style={{ backgroundColor: themeColor }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-xl transition-all enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Save changes
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeModal === 'confirm_delete_grid_site' && gridSitePendingDelete && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 flex items-center gap-2.5 text-xl font-bold text-white">
                <Trash2 className="h-6 w-6 shrink-0 text-red-400/90" aria-hidden />
                Remove website?
              </h2>
              <p className="mb-6 text-sm text-white/55">
                Remove <span className="font-medium text-white/85">&ldquo;{gridSitePendingDelete.title}&rdquo;</span>{' '}
                from this tab? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteGridSite()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600/90 py-3 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  Remove
                </button>
              </div>
            </motion.div>
          )}

          {activeModal === 'notepad' && (
            <StickyNotesBoard themeColor={themeColor} onClose={() => setActiveModal(null)} />
          )}

          {activeModal === 'settings' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#121212]/95 p-8 text-center shadow-2xl backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-lg font-bold text-white">Settings</h2>
              <p className="mb-4 text-sm text-white/50">
                Open the floating sidebar for search, wallpaper, and theme. Home categories can be extended from here.
              </p>
              {onOpenCreateCategoryFromSettings && (
                <button
                  type="button"
                  onClick={() => onOpenCreateCategoryFromSettings()}
                  className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  New category (Home)
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ backgroundColor: themeColor }}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
