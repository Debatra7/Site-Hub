'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export interface BookmarkItemVM {
  id: string;
  name: string;
  url: string;
  clicks?: number;
}

interface BookmarkCardProps {
  id: string;
  title: string;
  items: BookmarkItemVM[];
  icon: React.ReactNode;
  slot: string;
  expandedCats: string[];
  toggleExpand: (id: string) => void;
  setAddForm: React.Dispatch<
    React.SetStateAction<{ name: string; url: string; categoryId: string }>
  >;
  setActiveModal: (modal: string | null) => void;
  handleItemClick: (catId: string, itemId: string, url: string) => void;
  handleMoveItem: (itemId: string, fromCatId: string, toCatId: string, targetIndex?: number) => void;
  handleDropToSlot: (itemId: string, targetSlot: string) => void;
  getFavicon: (url: string) => string | null;
  setSelectedCategory: (category: {
    id: string;
    title: string;
    items: BookmarkItemVM[];
    icon: React.ReactNode;
    slot: string;
  }) => void;
}

export function BookmarkCard({
  id,
  title,
  items,
  icon,
  slot,
  expandedCats,
  toggleExpand,
  setAddForm,
  setActiveModal,
  handleItemClick,
  handleMoveItem,
  handleDropToSlot,
  getFavicon,
  setSelectedCategory,
}: BookmarkCardProps) {
  const isExpanded = expandedCats.includes(id);
  const sortedItems = [...items].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  const displayItems = isExpanded ? sortedItems : sortedItems.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div
      draggable
      data-ctx="bookmark-card"
      data-category-id={id}
      data-category-title={title}
      data-slot={slot}
      onDragStart={(e: React.DragEvent) => {
        if ((e.target as HTMLElement).closest('.bookmark-item')) return;
        e.dataTransfer.setData('cardId', id);
      }}
      className={`w-64 cursor-grab rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 active:cursor-grabbing ${
        isExpanded ? 'h-auto ring-1 ring-white/10' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const itemDataStr = e.dataTransfer.getData('itemData');
        if (itemDataStr) {
          const { itemId, fromCatId } = JSON.parse(itemDataStr) as {
            itemId: string;
            fromCatId: string;
          };
          handleMoveItem(itemId, fromCatId, id);
          return;
        }
        const cardId = e.dataTransfer.getData('cardId');
        if (cardId) handleDropToSlot(cardId, slot);
      }}
    >
      <div className="pointer-events-none mb-5 flex items-center justify-between">
        <button
          type="button"
          className="pointer-events-auto group flex cursor-pointer items-center gap-2"
          onClick={() => {
            setSelectedCategory({ id, title, items, icon, slot });
            setActiveModal('category');
          }}
        >
          <span className="text-white/40 transition-colors group-hover:text-white">{icon}</span>
          <h3 className="text-xs font-semibold tracking-widest text-white uppercase transition-all group-hover:tracking-[0.15em]">
            {title}
          </h3>
        </button>
        <button
          type="button"
          onClick={() => {
            setAddForm({ name: '', url: '', categoryId: id });
            setActiveModal('add');
          }}
          className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className={`space-y-1 ${isExpanded ? 'no-scrollbar max-h-[300px] overflow-y-auto pr-1' : ''}`}>
        <AnimatePresence>
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              data-ctx="bookmark-item"
              data-item-id={item.id}
              data-url={item.url}
              data-title={item.name}
              data-category-id={id}
              onDragStart={(e: React.DragEvent) => {
                e.stopPropagation();
                e.dataTransfer.setData('itemData', JSON.stringify({ itemId: item.id, fromCatId: id }));
              }}
              onDrop={(e: React.DragEvent) => {
                e.stopPropagation();
                const itemDataStr = e.dataTransfer.getData('itemData');
                if (itemDataStr) {
                  const { itemId, fromCatId } = JSON.parse(itemDataStr) as {
                    itemId: string;
                    fromCatId: string;
                  };
                  handleMoveItem(itemId, fromCatId, id, index);
                }
              }}
              className="bookmark-item pointer-events-auto group flex cursor-grab items-center gap-2 p-2 transition-all hover:translate-x-1 active:cursor-grabbing"
              onClick={() => handleItemClick(id, item.id, item.url)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Google favicon helper */}
              <img
                src={getFavicon(item.url) || ''}
                alt=""
                className="h-3 w-3 rounded-md object-contain opacity-90"
                onError={(ev) => {
                  (ev.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="truncate text-xs font-medium text-white/70 group-hover:text-white">{item.name}</span>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button
          type="button"
          data-ctx="bookmark-expand"
          data-category-id={id}
          onClick={() => toggleExpand(id)}
          className="mt-2 w-full rounded-lg border border-dashed border-white/5 py-1.5 text-[10px] font-bold tracking-widest text-white/20 uppercase transition-all hover:border-white/20 hover:text-white/50"
        >
          {isExpanded ? 'Show Less' : `See ${items.length - 5} More`}
        </button>
      )}

      {items.length === 0 && (
        <div
          className="rounded-xl border-2 border-dashed border-white/10 py-8 text-center"
          data-ctx="bookmark-empty"
          data-category-id={id}
        >
          <span className="text-[10px] tracking-tighter text-white/20 uppercase">Drop links here</span>
        </div>
      )}
    </div>
  );
}
