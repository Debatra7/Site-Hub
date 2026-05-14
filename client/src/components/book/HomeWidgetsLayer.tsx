'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Clock } from './Clock';
import type { HomeWidget, HomeWidgetKind } from '@/lib/homeWidgets';
import {
  clampRect,
  defaultSizeForKind,
  minSizeForKind,
  resolveNonOverlap,
  rectsOverlap,
  type Rect,
} from '@/lib/homeWidgets';

type HomeWidgetsLayerProps = {
  widgets: HomeWidget[];
  onWidgetsChange: React.Dispatch<React.SetStateAction<HomeWidget[]>>;
  themeColor: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
};

function isSafeImageSrc(src: string): boolean {
  return /^data:image\//i.test(src) || /^https:\/\//i.test(src);
}

function CalendarBody() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const today = now.getDate();
  const isToday = (d: number | null) =>
    d !== null && d === today && now.getMonth() === m && now.getFullYear() === y;

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2 text-white">
      <div className="text-center text-xs font-bold tracking-widest text-white/50 uppercase">{label}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-white/35">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`h-${i}`}>{d}</div>
        ))}
      </div>
      <div className="no-scrollbar grid flex-1 grid-cols-7 gap-0.5 overflow-y-auto text-center text-xs">
        {cells.map((d, i) => (
          <div
            key={`c-${i}`}
            className={`flex min-h-[1.4rem] items-center justify-center rounded ${
              d === null ? 'text-transparent' : isToday(d) ? 'bg-white/15 font-bold text-white' : 'text-white/70'
            }`}
          >
            {d ?? '·'}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeWidgetsLayer({
  widgets,
  onWidgetsChange,
  themeColor,
  searchQuery,
  setSearchQuery,
  handleSearch,
}: HomeWidgetsLayerProps) {
  const topNavPx = () => (typeof window !== 'undefined' ? window.innerHeight * 0.08 : 64);

  const raise = useCallback(
    (id: string) => {
      onWidgetsChange((prev) => {
        const maxZ = prev.reduce((m, w) => Math.max(m, w.z), 0);
        const next = maxZ + 1;
        return prev.map((w) => (w.id === id ? { ...w, z: next } : w));
      });
    },
    [onWidgetsChange],
  );

  const removeWidget = useCallback(
    (id: string) => {
      onWidgetsChange((prev) => {
        const target = prev.find((w) => w.id === id);
        if (target?.kind === 'search') return prev;
        return prev.filter((w) => w.id !== id);
      });
    },
    [onWidgetsChange],
  );

  const patchWidget = useCallback(
    (id: string, patch: Partial<HomeWidget>, resolve = true) => {
      onWidgetsChange((prev) => {
        const cur = prev.find((w) => w.id === id);
        if (!cur) return prev;
        const merged = { ...cur, ...patch };
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nav = topNavPx();
        const mins = minSizeForKind(merged.kind);
        let rect: Rect = {
          x: merged.x,
          y: merged.y,
          w: Math.max(mins.w, merged.w),
          h: Math.max(mins.h, merged.h),
        };
        rect = clampRect(rect, vw, vh, nav);
        if (resolve) {
          rect = resolveNonOverlap(id, rect, prev, vw, vh, nav);
        }
        return prev.map((w) => (w.id === id ? { ...merged, ...rect } : w));
      });
    },
    [onWidgetsChange],
  );

  return (
    <div className="pointer-events-none absolute inset-0 top-[8vh] z-[32]">
      {widgets.map((w) => (
        <HomeWidgetCard
          key={w.id}
          widget={w}
          all={widgets}
          themeColor={themeColor}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          onRaise={() => raise(w.id)}
          onRemove={() => removeWidget(w.id)}
          onPatch={(patch, resolve) => patchWidget(w.id, patch, resolve)}
        />
      ))}
    </div>
  );
}

type CardProps = {
  widget: HomeWidget;
  all: HomeWidget[];
  themeColor: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  onRaise: () => void;
  onRemove: () => void;
  onPatch: (patch: Partial<HomeWidget>, resolve?: boolean) => void;
};

function HomeWidgetCard({
  widget,
  all,
  themeColor,
  searchQuery,
  setSearchQuery,
  handleSearch,
  onRaise,
  onRemove,
  onPatch,
}: CardProps) {
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    ow: number;
    oh: number;
  } | null>(null);
  const widgetRef = useRef(widget);
  const allRef = useRef(all);
  const onPatchRef = useRef(onPatch);

  useLayoutEffect(() => {
    widgetRef.current = widget;
    allRef.current = all;
    onPatchRef.current = onPatch;
  });

  const topNavPx = () => (typeof window !== 'undefined' ? window.innerHeight * 0.08 : 64);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const w = widgetRef.current;
      const list = allRef.current;
      const patch = onPatchRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nav = topNavPx();
      if (dragRef.current) {
        const d = dragRef.current;
        const nx = d.ox + e.clientX - d.sx;
        const ny = d.oy + e.clientY - d.sy;
        let rect: Rect = { x: nx, y: ny, w: w.w, h: w.h };
        rect = clampRect(rect, vw, vh, nav);
        for (const o of list) {
          if (o.id === w.id) continue;
          if (rectsOverlap(rect, { x: o.x, y: o.y, w: o.w, h: o.h })) {
            rect = resolveNonOverlap(w.id, rect, list, vw, vh, nav);
            break;
          }
        }
        patch({ x: rect.x, y: rect.y, w: rect.w, h: rect.h }, false);
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const mins = minSizeForKind(w.kind);
        const nw = Math.max(mins.w, r.ow + e.clientX - r.sx);
        const nh = w.kind === 'search' ? w.h : Math.max(mins.h, r.oh + e.clientY - r.sy);
        let rect: Rect = { x: w.x, y: w.y, w: nw, h: nh };
        rect = clampRect(rect, vw, vh, nav);
        patch({ w: rect.w, h: rect.h }, false);
      }
    };
    const onUp = () => {
      if (!dragRef.current && !resizeRef.current) return;
      dragRef.current = null;
      resizeRef.current = null;
      const w = widgetRef.current;
      const list = allRef.current;
      const patch = onPatchRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nav = topNavPx();
      const cur = list.find((x) => x.id === w.id);
      if (cur) {
        const rect = resolveNonOverlap(cur.id, { x: cur.x, y: cur.y, w: cur.w, h: cur.h }, list, vw, vh, nav);
        patch({ x: rect.x, y: rect.y, w: rect.w, h: rect.h }, false);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [widget.id]);

  if (widget.kind === 'search') {
    return (
      <div
        className="pointer-events-auto absolute overflow-visible"
        style={{
          left: widget.x,
          top: widget.y,
          width: widget.w,
          height: widget.h,
          zIndex: widget.z,
        }}
        onPointerDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest('[data-home-widget-stop]') || t.closest('input')) return;
          onRaise();
        }}
      >
        {/* DRAG HANDLE AT TOP */}
        <div
          className="group/search-drag absolute -top-1.5 left-6 right-6 z-[2] h-4 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest('[data-home-widget-stop]') || t.closest('input')) return;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            const cur = widgetRef.current;
            dragRef.current = {
              sx: e.clientX,
              sy: e.clientY,
              ox: cur.x,
              oy: cur.y,
            };
            onRaise();
          }}
        >
          <div className="mx-auto mt-1 h-1 w-12 rounded-full bg-white/0 transition-colors group-hover/search-drag:bg-white/20 group-active/search-drag:bg-white/40" />
        </div>

        <div className="relative h-full w-full">
          <div className="h-full w-full min-h-[44px]" data-home-widget-stop>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              embedded
              pill
              inputId={`home-search-${widget.id}`}
            />
          </div>
        </div>

        {/* RESIZE HANDLE - ONLY WIDTH */}
        <button
          type="button"
          aria-label="Resize search width"
          data-home-widget-stop
          className="absolute -right-1 top-2 bottom-2 z-[2] w-2 cursor-ew-resize touch-none opacity-0 hover:opacity-100"
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            const cur = widgetRef.current;
            resizeRef.current = {
              sx: e.clientX,
              sy: e.clientY,
              ow: cur.w,
              oh: cur.h,
            };
            onRaise();
          }}
        >
          <div className="mx-auto h-full w-0.5 rounded-full bg-white/30" />
        </button>
      </div>
    );
  }

  const headerStyle = { backgroundColor: themeColor };

  return (
    <div
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/35 shadow-2xl ring-1 ring-black/30 backdrop-blur-md"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        zIndex: widget.z,
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-home-widget-stop]')) return;
        onRaise();
      }}
    >
      <div
        className="relative flex shrink-0 cursor-grab items-center justify-center border-b border-white/10 px-2 py-1 active:cursor-grabbing"
        style={headerStyle}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[data-home-widget-stop]')) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const cur = widgetRef.current;
          dragRef.current = {
            sx: e.clientX,
            sy: e.clientY,
            ox: cur.x,
            oy: cur.y,
          };
          onRaise();
        }}
      >
        <span className="flex-1 text-center text-[10px] font-bold tracking-widest text-white/90 uppercase">
          {widget.kind === 'time' && 'Time'}
          {widget.kind === 'calendar' && 'Calendar'}
          {widget.kind === 'image' && 'Image'}
        </span>
        <button
          type="button"
          data-home-widget-stop
          className="absolute right-1 rounded p-0.5 text-white/60 transition hover:bg-white/15 hover:text-white"
          title="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {widget.kind === 'time' && (
          <div className="h-full min-h-0" data-home-widget-stop>
            <Clock themeColor={themeColor} compact />
          </div>
        )}
        {widget.kind === 'calendar' && (
          <div className="h-full min-h-0" data-home-widget-stop>
            <CalendarBody />
          </div>
        )}
        {widget.kind === 'image' && widget.imageSrc && isSafeImageSrc(widget.imageSrc) && (
          <div className="flex h-full items-center justify-center p-1" data-home-widget-stop>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={widget.imageSrc} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          </div>
        )}
        {widget.kind === 'image' && (!widget.imageSrc || !isSafeImageSrc(widget.imageSrc)) && (
          <div className="flex h-full items-center justify-center text-xs text-white/40">No image</div>
        )}
      </div>

      <button
        type="button"
        aria-label="Resize"
        data-home-widget-stop
        className="absolute right-0.5 bottom-0.5 z-[1] h-6 w-6 cursor-nwse-resize touch-none opacity-0"
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const cur = widgetRef.current;
          resizeRef.current = {
            sx: e.clientX,
            sy: e.clientY,
            ow: cur.w,
            oh: cur.h,
          };
          onRaise();
        }}
      />
    </div>
  );
}

export function createWidget(kind: HomeWidgetKind, all: HomeWidget[], imageSrc?: string): HomeWidget {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
  const nav = Math.round(vh * 0.08);
  const { w, h } = defaultSizeForKind(kind);
  const maxZ = all.reduce((m, x) => Math.max(m, x.z), 0);
  const i = all.length;
  const x = 48 + (i % 5) * 20;
  const y = nav + 24 + (i % 4) * 18;
  let rect: Rect = { x, y, w, h };
  rect = clampRect(rect, vw, vh, nav);
  rect = resolveNonOverlap('__new__', rect, all, vw, vh, nav);
  return {
    id: crypto.randomUUID(),
    kind,
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    z: maxZ + 1,
    imageSrc: kind === 'image' ? imageSrc : undefined,
  };
}
