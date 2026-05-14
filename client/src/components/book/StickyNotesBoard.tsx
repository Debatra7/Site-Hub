'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  ImagePlus,
  MoveDiagonal2,
  NotebookPen,
  Palette,
  Plus,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'betaHub_v1_stickyNotes';
const LEGACY_NOTEPAD_KEY = 'betaHub_v1_notepad';
const MAX_STICKY_IMAGE_BYTES = Math.floor(1.4 * 1024 * 1024);
const INLINE_IMG_CLASS = 'sticky-inline-img';

export const STICKY_FRAME_PRESETS = ['#a8e6cf', '#9dd4ff', '#ffc2d4', '#fff4a3', '#e0c3fc', '#ffd4a3', '#c4f0f5'];

export type StickyNoteModel = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  frameColor: string;
  /** Sanitized HTML fragment (inline text + images). */
  text: string;
  /** Legacy only; cleared on load after merging into `text`. */
  images: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function plainTextToHtml(plain: string): string {
  if (!plain) return '<br>';
  return plain
    .split(/\r?\n/)
    .map((line) => `<div>${escapeHtml(line) || '<br>'}</div>`)
    .join('');
}

function looksLikeRichStickyBody(s: string): boolean {
  return /<\s*(img|div|p|br|span|b|strong|i|em|ul|ol|li|a)\b/i.test(s);
}

function mergeLegacyImagesIntoBody(text: string, images: string[]): string {
  let body = text?.trim() ? text : '';
  if (!looksLikeRichStickyBody(body) && body) body = plainTextToHtml(body);
  else if (!body) body = '<br>';
  const imgs = images
    .filter((src) => typeof src === 'string' && /^data:image\//i.test(src))
    .map(
      (src) =>
        `<img src="${escapeAttr(src)}" alt="" class="${INLINE_IMG_CLASS}" contenteditable="false" draggable="false" />`,
    )
    .join('');
  return body + imgs;
}

function sanitizeStickyBodyHtml(input: string): string {
  if (typeof window === 'undefined') return '<br>';
  try {
    const doc = new DOMParser().parseFromString(
      `<div id="sticky-sanitize-root">${input}</div>`,
      'text/html',
    );
    const root = doc.getElementById('sticky-sanitize-root');
    if (!root) return '<br>';

    doc.querySelectorAll('script,style,svg,iframe,object,embed,form,input,button,textarea').forEach((el) => {
      el.remove();
    });

    const allowed = new Set([
      'DIV',
      'BR',
      'P',
      'SPAN',
      'B',
      'STRONG',
      'I',
      'EM',
      'IMG',
      'UL',
      'OL',
      'LI',
      'A',
    ]);

    function scrubAttrs(el: Element) {
      const tag = el.tagName;
      [...el.attributes].forEach((a) => {
        const ln = a.name.toLowerCase();
        if (ln.startsWith('on')) {
          el.removeAttribute(a.name);
          return;
        }
        if (ln === 'style' || ln === 'id') {
          el.removeAttribute(a.name);
          return;
        }
        if (tag === 'A' && ln === 'href') {
          const v = a.value.trim();
          if (!/^https?:\/\//i.test(v)) el.removeAttribute(a.name);
          return;
        }
        if (tag === 'IMG' && ln === 'src') {
          const v = a.value.trim();
          if (!/^data:image\//i.test(v) && !/^https?:\/\//i.test(v)) el.removeAttribute(a.name);
          return;
        }
        if (tag === 'IMG' && ln === 'class') {
          if (!a.value.split(/\s+/).includes(INLINE_IMG_CLASS)) el.removeAttribute(a.name);
          return;
        }
        if (tag === 'IMG' && (ln === 'alt' || ln === 'contenteditable' || ln === 'draggable')) return;
        if (tag === 'IMG') {
          el.removeAttribute(a.name);
          return;
        }
        if (ln === 'class') el.removeAttribute(a.name);
      });
    }

    function clean(el: Element) {
      const children = [...el.children];
      for (const child of children) {
        if (!allowed.has(child.tagName)) {
          while (child.firstChild) el.insertBefore(child.firstChild, child);
          child.remove();
          clean(el);
          continue;
        }
        scrubAttrs(child);
        clean(child);
      }
    }

    clean(root);
    const out = root.innerHTML.trim();
    return out || '<br>';
  } catch {
    return '<br>';
  }
}

function normalizeLoadedNote(n: StickyNoteModel): StickyNoteModel {
  const images = Array.isArray(n.images) ? n.images : [];
  let text = n.text ?? '';
  if (images.length > 0) {
    text = mergeLegacyImagesIntoBody(text, images);
  } else if (text.trim() && !looksLikeRichStickyBody(text)) {
    text = plainTextToHtml(text);
  } else if (!text.trim()) {
    text = '<br>';
  }
  return { ...n, text: sanitizeStickyBodyHtml(text), images: [] };
}

function loadInitialNotes(): StickyNoteModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (parsed as StickyNoteModel[]).map(normalizeLoadedNote);
      }
    }
    const legacy = localStorage.getItem(LEGACY_NOTEPAD_KEY);
    if (legacy?.trim()) {
      return [
        normalizeLoadedNote({
          id: crypto.randomUUID(),
          x: 120,
          y: 96,
          w: 320,
          h: 320,
          z: 1,
          frameColor: STICKY_FRAME_PRESETS[0]!,
          text: legacy,
          images: [],
        }),
      ];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function persistNotes(notes: StickyNoteModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getEditorRange(editor: HTMLElement): Range {
  const sel = window.getSelection();
  if (sel?.rangeCount && editor.contains(sel.anchorNode)) {
    return sel.getRangeAt(0);
  }
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  return range;
}

function applyRange(range: Range) {
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

type StickyNotesBoardProps = {
  themeColor: string;
  onClose: () => void;
};

export function StickyNotesBoard({ themeColor, onClose }: StickyNotesBoardProps) {
  const [notes, setNotes] = useState<StickyNoteModel[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const nextZ = useRef(1);

  useEffect(() => {
    queueMicrotask(() => {
      const list = loadInitialNotes();
      const maxZ = list.reduce((m, n) => Math.max(m, n.z), 0);
      nextZ.current = maxZ + 1;
      setNotes(list);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistNotes(notes);
  }, [notes, hydrated]);

  const raise = useCallback((id: string) => {
    setNotes((prev) => {
      const maxZ = prev.reduce((m, n) => Math.max(m, n.z), 0);
      const next = maxZ + 1;
      nextZ.current = Math.max(nextZ.current, next + 1);
      return prev.map((n) => (n.id === id ? { ...n, z: next } : n));
    });
  }, []);

  const addNote = useCallback(() => {
    setNotes((prev) => {
      const maxZ = prev.reduce((m, n) => Math.max(m, n.z), 0);
      const z = maxZ + 1;
      nextZ.current = z + 1;
      const i = prev.length;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          x: 48 + (i % 6) * 28,
          y: 88 + (i % 4) * 32,
          w: 280,
          h: 280,
          z,
          frameColor: STICKY_FRAME_PRESETS[i % STICKY_FRAME_PRESETS.length]!,
          text: '<br>',
          images: [],
        },
      ];
    });
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setColorPickerId((c) => (c === id ? null : c));
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<StickyNoteModel>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const sorted = useMemo(() => [...notes].sort((a, b) => a.z - b.z), [notes]);

  useEffect(() => {
    if (!colorPickerId) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-sticky-color-picker]')) return;
      if (el.closest('[data-sticky-stop]')) return;
      setColorPickerId(null);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [colorPickerId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col"
    >
      <div className="pointer-events-auto flex shrink-0 items-center justify-between gap-4 px-4 py-3 pr-6 pl-4">
        <div className="flex items-center gap-2 text-white/90">
          <NotebookPen className="h-5 w-5 text-white/50" aria-hidden />
          <span className="text-sm font-semibold tracking-wide">Sticky notes</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-mono text-white/60">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addNote}
            style={{ backgroundColor: themeColor }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-lg transition hover:brightness-110 active:scale-95"
            title="New note"
            aria-label="New sticky note"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden pointer-events-none">
        {sorted.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            colorPickerOpen={colorPickerId === note.id}
            onTogglePalette={() => setColorPickerId((id) => (id === note.id ? null : note.id))}
            onPickColor={(hex) => {
              updateNote(note.id, { frameColor: hex });
              setColorPickerId(null);
            }}
            onRaise={() => raise(note.id)}
            onUpdate={(patch) => updateNote(note.id, patch)}
            onRemove={() => removeNote(note.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

type CardProps = {
  note: StickyNoteModel;
  colorPickerOpen: boolean;
  onTogglePalette: () => void;
  onPickColor: (hex: string) => void;
  onRaise: () => void;
  onUpdate: (patch: Partial<StickyNoteModel>) => void;
  onRemove: () => void;
};

function StickyNoteCard({
  note,
  colorPickerOpen,
  onTogglePalette,
  onPickColor,
  onRaise,
  onUpdate,
  onRemove,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedNoteIdRef = useRef<string | null>(null);

  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startClientX: number;
    startClientY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const flushHtml = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = sanitizeStickyBodyHtml(el.innerHTML);
    if (html !== note.text) onUpdate({ text: html });
  }, [note.text, onUpdate]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushHtml();
    }, 150);
  }, [flushHtml]);

  const flushNow = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushHtml();
  }, [flushHtml]);

  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (mountedNoteIdRef.current !== note.id) {
      mountedNoteIdRef.current = note.id;
      el.innerHTML = note.text?.trim() ? note.text : '<br>';
    }
  }, [note.id, note.text]);

  const insertImagesFromFiles = useCallback(
    async (files: readonly File[]) => {
      const editor = editorRef.current;
      if (!editor) return;
      const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_STICKY_IMAGE_BYTES);
      if (!valid.length) return;
      onRaise();
      for (const file of valid) {
        try {
          const src = await readFileAsDataUrl(file);
          const range = getEditorRange(editor);
          const img = document.createElement('img');
          img.src = src;
          img.alt = '';
          img.className = INLINE_IMG_CLASS;
          img.contentEditable = 'false';
          img.draggable = false;
          range.deleteContents();
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
          applyRange(range);
        } catch {
          /* skip file */
        }
      }
      editor.focus();
      flushNow();
    },
    [flushNow, onRaise],
  );

  const onEditorPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const cd = e.clipboardData;
      if (!cd) return;
      const imageFiles: File[] = [];
      const seen = new Set<string>();
      if (cd.files?.length) {
        for (const f of Array.from(cd.files)) {
          if (!f.type.startsWith('image/')) continue;
          const key = `${f.name}-${f.size}-${f.lastModified}`;
          if (seen.has(key)) continue;
          seen.add(key);
          imageFiles.push(f);
        }
      }
      for (const item of Array.from(cd.items)) {
        if (item.kind !== 'file') continue;
        const f = item.getAsFile();
        if (!f?.type.startsWith('image/')) continue;
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (seen.has(key)) continue;
        seen.add(key);
        imageFiles.push(f);
      }
      if (!imageFiles.length) {
        onRaise();
        requestAnimationFrame(() => {
          const el = editorRef.current;
          if (!el) return;
          el.innerHTML = sanitizeStickyBodyHtml(el.innerHTML);
          flushNow();
        });
        return;
      }

      e.preventDefault();
      onRaise();
      const editor = editorRef.current;
      if (!editor) return;
      const plain = cd.getData('text/plain');
      let range = getEditorRange(editor);
      if (plain) {
        range.deleteContents();
        range.insertNode(document.createTextNode(plain));
        range.collapse(false);
        applyRange(range);
      }
      void (async () => {
        for (const file of imageFiles) {
          if (!file.type.startsWith('image/') || file.size > MAX_STICKY_IMAGE_BYTES) continue;
          try {
            const src = await readFileAsDataUrl(file);
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.className = INLINE_IMG_CLASS;
            img.contentEditable = 'false';
            img.draggable = false;
            range = getEditorRange(editor);
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            applyRange(range);
          } catch {
            /* skip */
          }
        }
        editor.focus();
        flushNow();
      })();
    },
    [flushNow, onRaise],
  );

  const onFilesPicked = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files?.length) return;
      void insertImagesFromFiles(Array.from(files));
    },
    [insertImagesFromFiles],
  );

  const onPointerDownCard = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-sticky-stop]')) return;
    onRaise();
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const d = dragRef.current;
        const nx = d.origX + e.clientX - d.startClientX;
        const ny = d.origY + e.clientY - d.startClientY;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        onUpdate({
          x: clamp(nx, 0, Math.max(0, vw - note.w)),
          y: clamp(ny, 0, Math.max(0, vh - note.h)),
        });
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const dw = e.clientX - r.startClientX;
        const dh = e.clientY - r.startClientY;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        onUpdate({
          w: clamp(r.origW + dw, 180, Math.min(720, vw - note.x)),
          h: clamp(r.origH + dh, 140, Math.min(640, vh - note.y)),
        });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [note.w, note.h, note.x, note.y, onUpdate]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="pointer-events-auto absolute flex flex-col overflow-visible rounded-xl shadow-2xl ring-1 ring-black/20"
      style={{
        left: note.x,
        top: note.y,
        width: note.w,
        height: note.h,
        zIndex: note.z,
      }}
      onPointerDown={onPointerDownCard}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFilesPicked}
      />

      <div
        className="flex shrink-0 cursor-grab items-center justify-between gap-1 rounded-t-xl px-1.5 py-1.5 active:cursor-grabbing"
        style={{ backgroundColor: note.frameColor }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[data-sticky-stop]')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            origX: note.x,
            origY: note.y,
          };
          onRaise();
        }}
      >
        <span className="inline-flex p-1 text-black/55" title="Drag">
          <GripVertical className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            data-sticky-stop
            className="rounded-md p-1 text-black/55 transition hover:bg-black/10 hover:text-black/80"
            title="Note color"
            onClick={(e) => {
              e.stopPropagation();
              onRaise();
              onTogglePalette();
            }}
          >
            <Palette className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            data-sticky-stop
            className="rounded-md p-1 text-black/55 transition hover:bg-black/10 hover:text-black/80"
            title="Add image at cursor"
            onClick={(e) => {
              e.stopPropagation();
              onRaise();
              fileInputRef.current?.click();
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            data-sticky-stop
            className="rounded-md p-1 text-black/55 transition hover:bg-red-600/20 hover:text-red-700"
            title="Delete note"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {colorPickerOpen && (
        <div
          data-sticky-stop
          data-sticky-color-picker
          className="absolute top-10 left-1 z-[2] flex flex-wrap gap-1.5 rounded-xl border border-black/10 bg-white/95 p-2 shadow-xl"
        >
          {STICKY_FRAME_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className="h-7 w-7 rounded-md border border-black/10 shadow-sm transition hover:scale-110"
              style={{ backgroundColor: c }}
              title={c}
              onClick={() => onPickColor(c)}
            />
          ))}
          <label className="flex cursor-pointer items-center gap-1 pl-1 text-[10px] font-medium text-neutral-600">
            <span>Custom</span>
            <input
              type="color"
              value={note.frameColor}
              onChange={(e) => onPickColor(e.target.value)}
              className="h-6 w-8 cursor-pointer overflow-hidden rounded border border-black/15 bg-transparent p-0"
            />
          </label>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-b-xl bg-white p-2">
        <div
          ref={editorRef}
          role="textbox"
          tabIndex={0}
          aria-multiline
          data-sticky-stop
          title="Type or paste; images stay inline. Select an image and press Delete to remove."
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onPointerDown={() => onRaise()}
          onInput={scheduleFlush}
          onBlur={flushNow}
          onPaste={onEditorPaste}
          className="no-scrollbar sticky-editor min-h-[72px] w-full flex-1 overflow-y-auto rounded-lg border border-black/5 bg-white px-2 py-1.5 text-sm leading-relaxed text-neutral-800 outline-none focus:border-black/15 [&_.sticky-inline-img]:my-0.5 [&_.sticky-inline-img]:inline-block [&_.sticky-inline-img]:max-h-24 [&_.sticky-inline-img]:max-w-[min(100%,320px)] [&_.sticky-inline-img]:align-middle [&_.sticky-inline-img]:rounded-md [&_.sticky-inline-img]:object-contain"
        />
      </div>

      <button
        type="button"
        data-sticky-stop
        className="absolute right-1 bottom-1 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded text-neutral-400 transition hover:bg-black/5 hover:text-neutral-700"
        title="Resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          resizeRef.current = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            origW: note.w,
            origH: note.h,
          };
          onRaise();
        }}
      >
        <MoveDiagonal2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
