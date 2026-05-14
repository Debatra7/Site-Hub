'use client';

import React from 'react';
import { Plus, NotebookPen } from 'lucide-react';

export interface DashboardPageTab {
  id: string;
  name: string;
}

interface BookNavbarProps {
  pages: DashboardPageTab[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  themeColor: string;
  createPage: () => void;
  setActiveModal: (modal: string | null) => void;
  children: React.ReactNode;
}

export function BookNavbar({
  pages,
  activePageId,
  setActivePageId,
  themeColor,
  createPage,
  setActiveModal,
  children,
}: BookNavbarProps) {
  return (
    <nav className="pointer-events-none absolute inset-0 z-50 flex flex-col">
      <div className="pointer-events-auto flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/35 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              data-ctx="nav-tab"
              data-page-id={page.id}
              data-page-name={page.name}
              onClick={() => setActivePageId(page.id)}
              style={{
                backgroundColor: page.id === activePageId ? themeColor : 'rgba(255,255,255,0.08)',
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all sm:px-4 ${
                page.id === activePageId
                  ? 'text-white shadow-md shadow-black/25'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={createPage}
            className="rounded-lg border border-white/10 bg-white/10 p-2 text-white/70 transition-all hover:bg-white/20 hover:text-white"
            title="New tab"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('notepad')}
            className="rounded-lg border border-white/10 bg-white/10 p-2 text-white/70 transition-all hover:bg-white/20 hover:text-white"
            title="Notepad"
            aria-label="Open notepad"
          >
            <NotebookPen size={18} />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </nav>
  );
}
