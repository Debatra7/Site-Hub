'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type SiteMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

type SiteContextMenuProps = {
  menu: { x: number; y: number; items: SiteMenuItem[] } | null;
  onClose: () => void;
};

export function SiteContextMenu({ menu, onClose }: SiteContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const runSelect = useCallback(
    async (item: SiteMenuItem) => {
      if (item.disabled) {
        onClose();
        return;
      }
      onClose();
      await item.onSelect();
    },
    [onClose],
  );

  useLayoutEffect(() => {
    if (!menu || !panelRef.current) return;
    const el = panelRef.current;
    const pad = 8;
    const rect = el.getBoundingClientRect();
    let left = menu.x;
    let top = menu.y;
    if (left + rect.width > window.innerWidth - pad) left = window.innerWidth - rect.width - pad;
    if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - rect.height - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [menu, onClose]);

  if (!menu || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[200] min-w-[12.5rem] rounded-xl border border-white/10 bg-[#141414]/95 py-1 shadow-2xl backdrop-blur-xl"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      aria-label="Context menu"
    >
      {menu.items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => void runSelect(item)}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
            item.danger
              ? 'text-red-400 hover:bg-red-500/15 disabled:text-red-400/40'
              : 'text-white/90 hover:bg-white/10 disabled:text-white/30'
          }`}
        >
          {item.icon ? (
            <span className="flex shrink-0 items-center justify-center text-current [&>svg]:h-3.5 [&>svg]:w-3.5">
              {item.icon}
            </span>
          ) : null}
          <span className="min-w-0 flex-1">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
