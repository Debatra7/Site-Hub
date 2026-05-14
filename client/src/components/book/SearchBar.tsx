'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  /** Narrow layout inside a home widget */
  embedded?: boolean;
  /** Full rounded pill (Home search widget) */
  pill?: boolean;
  /** Override input id (avoid duplicate ids when multiple search UIs exist) */
  inputId?: string;
}

function SearchBarInner({
  searchQuery,
  setSearchQuery,
  handleSearch,
  embedded,
  pill,
  inputId = 'site-dashboard-search',
}: SearchBarProps) {
  if (pill && embedded) {
    return (
      <form
        onSubmit={handleSearch}
        className="group relative flex h-full min-h-[44px] w-full items-center"
        data-ctx="search-form"
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.04] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.18] backdrop-blur-xl" />
        <div className="pointer-events-none absolute inset-[1px] rounded-full bg-black/25" />
        <div className="relative flex h-full w-full min-w-0 items-center gap-2 px-4 py-2">
          <Search size={17} className="shrink-0 text-white/35 transition-colors group-focus-within:text-white/55" />
          <input
            id={inputId}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the web…"
            data-ctx="search-input"
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] font-light tracking-wide text-white/95 outline-none placeholder:text-white/30"
          />
        </div>
      </form>
    );
  }

  const inputClass = embedded
    ? 'flex-1 border-none bg-transparent px-2 py-1.5 text-sm font-light tracking-wide text-white outline-none placeholder:text-white/25'
    : 'flex-1 border-none bg-transparent px-2 py-2 text-lg font-light tracking-wide text-white outline-none placeholder:text-white/5';
  const iconBox = embedded ? 'h-9 w-9' : 'h-12 w-12';

  return (
    <form onSubmit={handleSearch} className="group relative" data-ctx="search-form">
      <div className="absolute inset-0 rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all duration-700 group-hover:border-white/20" />

      <div className="relative flex items-center p-2">
        <div
          className={`flex ${iconBox} shrink-0 items-center justify-center text-white/10 transition-colors group-focus-within:text-white/40`}
        >
          <Search size={embedded ? 16 : 20} />
        </div>

        <input
          id={inputId}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="What are we building today?"
          data-ctx="search-input"
          className={inputClass}
        />
      </div>
    </form>
  );
}

export function SearchBar(props: SearchBarProps) {
  const { embedded, pill } = props;
  if (embedded && pill) {
    return (
      <div className="pointer-events-auto h-full w-full max-w-none" data-ctx="search-shell">
        <SearchBarInner {...props} />
      </div>
    );
  }
  if (embedded) {
    return (
      <div className="pointer-events-auto w-full max-w-none" data-ctx="search-shell">
        <SearchBarInner {...props} />
      </div>
    );
  }
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="pointer-events-auto w-full max-w-2xl"
      data-ctx="search-shell"
    >
      <SearchBarInner {...props} />
    </motion.div>
  );
}
