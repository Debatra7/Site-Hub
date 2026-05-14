'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteMenuItem } from './SiteContextMenu';

const LONG_MS = 520;
const MOVE_CANCEL_PX = 12;

type MenuState = { x: number; y: number; items: SiteMenuItem[] };

type UseSiteContextMenuOptions = {
  /** When true, close any open menu (e.g. modal opened). */
  closeSignal?: unknown;
};

export function useSiteContextMenu(
  buildItems: (target: HTMLElement) => SiteMenuItem[] | null | undefined,
  options?: UseSiteContextMenuOptions,
) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const longRef = useRef<{
    pointerId: number;
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
    el: HTMLElement;
  } | null>(null);
  const lastOpenRef = useRef(0);

  const closeMenu = useCallback(() => setMenu(null), []);

  const openAt = useCallback(
    (clientX: number, clientY: number, el: HTMLElement) => {
      const items = buildItems(el);
      if (!items?.length) return;
      const now = Date.now();
      if (now - lastOpenRef.current < 280) return;
      lastOpenRef.current = now;
      setMenu({ x: clientX, y: clientY, items });
    },
    [buildItems],
  );

  useEffect(() => {
    queueMicrotask(() => setMenu(null));
  }, [options?.closeSignal]);

  const clearLong = useCallback(() => {
    const lp = longRef.current;
    if (lp) {
      clearTimeout(lp.timer);
      longRef.current = null;
    }
  }, []);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-ctx]') as HTMLElement | null;
      if (!el) return;
      const items = buildItems(el);
      if (!items?.length) return;
      e.preventDefault();
      e.stopPropagation();
      openAt(e.clientX, e.clientY, el);
    },
    [buildItems, openAt],
  );

  const onPointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const el = (e.target as HTMLElement | null)?.closest?.('[data-ctx]') as HTMLElement | null;
      if (!el) return;
      clearLong();
      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      const timer = setTimeout(() => {
        if (longRef.current?.pointerId !== pointerId) return;
        longRef.current = null;
        if (navigator.vibrate) navigator.vibrate(12);
        openAt(startX, startY, el);
      }, LONG_MS);
      longRef.current = { pointerId, timer, x: startX, y: startY, el };
    },
    [clearLong, openAt],
  );

  const onPointerMoveCapture = useCallback(
    (e: React.PointerEvent) => {
      const lp = longRef.current;
      if (!lp || e.pointerId !== lp.pointerId) return;
      const dx = e.clientX - lp.x;
      const dy = e.clientY - lp.y;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) clearLong();
    },
    [clearLong],
  );

  const onPointerEndCapture = useCallback(
    (e: React.PointerEvent) => {
      const lp = longRef.current;
      if (!lp || e.pointerId !== lp.pointerId) return;
      clearLong();
    },
    [clearLong],
  );

  useEffect(() => {
    const onScroll = () => clearLong();
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, [clearLong]);

  const rootHandlers = {
    onContextMenu,
    onPointerDownCapture,
    onPointerMoveCapture,
    onPointerUpCapture: onPointerEndCapture,
    onPointerCancelCapture: onPointerEndCapture,
  };

  return { menu, closeMenu, rootHandlers };
}
