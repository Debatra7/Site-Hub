'use client';

import { Plus } from 'lucide-react';

export type TabGridSite = {
  id: string;
  title: string;
  url: string;
};

type TabWebsiteGridProps = {
  sites: TabGridSite[];
  getFavicon: (url: string) => string | null;
  onOpenSite: (site: TabGridSite) => void;
  onAddClick: () => void;
};

export function TabWebsiteGrid({ sites, getFavicon, onOpenSite, onAddClick }: TabWebsiteGridProps) {
  return (
    <div className="box-border grid min-w-0 w-full max-w-full grid-cols-[repeat(15,minmax(0,1fr))] gap-[clamp(0.25rem,0.8vw,0.75rem)] px-[clamp(0.25rem,1.2vw,1rem)] py-[clamp(0.35rem,1vw,1rem)]">
      {sites.map((site) => (
        <button
          key={site.id}
          type="button"
          data-ctx="grid-site"
          data-item-id={site.id}
          data-url={site.url}
          data-title={site.title}
          onClick={() => onOpenSite(site)}
          className="group flex aspect-square min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left shadow-sm transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
        >
          <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col items-center justify-center overflow-hidden p-[clamp(0.1rem,0.45vw,0.3rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- external favicons */}
            <img
              src={getFavicon(site.url) || ''}
              alt=""
              className="h-auto w-auto min-h-0 min-w-0 max-h-full max-w-full rounded-md object-contain opacity-90 transition group-hover:opacity-100"
              onError={(ev) => {
                (ev.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div className="flex w-full shrink-0 flex-col justify-center px-[clamp(0.12rem,0.45vw,0.4rem)] pb-[clamp(0.2rem,0.55vw,0.5rem)] pt-0">
            <span className="line-clamp-1 min-h-0 w-full min-w-0 text-center text-[clamp(11px,2.8vw,16px)] font-semibold leading-tight text-white/90">
              {site.title}
            </span>
          </div>
        </button>
      ))}

      <button
        type="button"
        data-ctx="grid-add"
        onClick={onAddClick}
        className="flex aspect-square min-h-0 min-w-0 flex-col items-stretch overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-white/50 transition hover:border-white/30 hover:bg-white/[0.05] hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:outline-none"
      >
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 items-center justify-center overflow-hidden">
          <Plus className="h-auto w-auto min-h-0 min-w-0 max-h-[55%] max-w-[55%] shrink-0 stroke-[1.25]" />
        </div>
        <span className="flex w-full shrink-0 flex-col items-center justify-center px-[clamp(0.12rem,0.45vw,0.35rem)] pb-[clamp(0.2rem,0.55vw,0.5rem)] pt-0 text-center text-[clamp(9px,2.2vw,13px)] font-bold leading-tight tracking-wide uppercase">
          Add website
        </span>
      </button>
    </div>
  );
}
