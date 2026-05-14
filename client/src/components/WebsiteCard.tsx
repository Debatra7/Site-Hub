'use client';

import React from 'react';
import { Website } from '@/lib/db';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface WebsiteCardProps {
  website: Website;
}

export const WebsiteCard = ({ website }: WebsiteCardProps) => {
  return (
    <a 
      href={website.url} 
      target="_blank" 
      rel="noreferrer"
      className="group"
    >
      <Card className={cn(
        "aspect-square glass border-white/5 hover:border-red-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
      )}>
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
          {website.faviconUrl ? (
            <img src={website.faviconUrl} alt="" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-white/10 rounded-lg" />
          )}
        </div>
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest text-center px-2 truncate w-full group-hover:text-white/80">
          {website.title || 'Website'}
        </span>
      </Card>
    </a>
  );
};
