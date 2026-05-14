'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, NotebookPen } from 'lucide-react';

export interface DashboardPageTab {
  id: string;
  name: string;
}

interface BookNavbarClassicProps {
  pages: DashboardPageTab[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  themeColor: string;
  createPage: () => void;
  setActiveModal: (modal: string | null) => void;
}

export function BookNavbarClassic({
  pages,
  activePageId,
  setActivePageId,
  themeColor,
  createPage,
  setActiveModal,
}: BookNavbarClassicProps) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = tabsScrollRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>(`[data-page-id="${CSS.escape(activePageId)}"]`);
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activePageId, pages]);

  const scrollTabs = (dir: -1 | 1) => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const delta = Math.max(120, Math.floor(el.clientWidth * 0.6)) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <nav className="absolute top-0 right-0 left-0 z-50 flex h-[8vh] items-center justify-center border-b border-white/5 bg-black/20 px-6 backdrop-blur-md">
      <div className="flex w-full max-w-6xl items-center gap-4">
        <button
          type="button"
          aria-label="Scroll tabs left"
          className="shrink-0 text-white/60 transition-colors hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollTabs(-1);
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={tabsScrollRef}
          className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2"
        >
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              data-ctx="nav-tab"
              data-page-id={page.id}
              data-page-name={page.name}
              onClick={() => setActivePageId(page.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setActivePageId(page.id);
              }}
              style={{
                backgroundColor: page.id === activePageId ? themeColor : 'rgba(255,255,255,0.1)',
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                page.id === activePageId
                  ? 'text-white shadow-lg shadow-black/20'
                  : 'text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <button
            type="button"
            aria-label="Scroll tabs right"
            className="shrink-0 text-white/60 transition-colors hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollTabs(1);
            }}
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={createPage}
            className="rounded-md border border-white/10 bg-white/10 p-1.5 text-white/60 transition-all hover:bg-white/20 hover:text-white"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            aria-label="Open notepad"
            title="Notepad"
            onClick={() => setActiveModal('notepad')}
            className="rounded-md border border-white/10 bg-white/10 p-1.5 text-white/60 transition-all hover:bg-white/20 hover:text-white"
          >
            <NotebookPen size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
