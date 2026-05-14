'use client';

import React from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export const HomeView = () => {
  const categories = useLiveQuery(() => db.categories.orderBy('orderIndex').toArray());
  const websites = useLiveQuery(() => db.websites.toArray());

  // Simple grouping logic for MVP based on category names
  const streamingCat = categories?.find(c => c.name.toLowerCase().includes('streaming'));
  const gamingCat = categories?.find(c => c.name.toLowerCase().includes('gaming'));

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <GroupSection 
        title="STREAMING" 
        category={streamingCat} 
        websites={websites?.filter(w => w.categoryId === streamingCat?.id)} 
      />
      <GroupSection 
        title="GAMING" 
        category={gamingCat} 
        websites={websites?.filter(w => w.categoryId === gamingCat?.id)} 
      />
      
      {/* Empty slot for new group */}
      <div className="border-2 border-dashed border-white/5 rounded-3xl h-64 flex items-center justify-center hover:border-white/20 transition-colors cursor-pointer group">
        <Plus className="text-white/20 group-hover:text-white/50" size={48} />
      </div>
    </div>
  );
};

const GroupSection = ({ title, category, websites }: { title: string, category: any, websites: any[] | undefined }) => (
  <Card className="glass border-none rounded-3xl p-6 flex flex-col gap-4 min-h-64 shadow-2xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
        <h2 className="font-bold text-sm tracking-widest text-white/90">{title}</h2>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
        <Plus size={16} />
      </Button>
    </div>
    
    <div className="flex flex-col gap-3">
      {websites?.map(w => (
        <a 
          key={w.id} 
          href={w.url} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
              {w.faviconUrl ? <img src={w.faviconUrl} alt="" className="w-5 h-5" /> : <div className="w-5 h-5 bg-white/20 rounded" />}
            </div>
            <span className="text-sm font-medium text-white/70 group-hover:text-white">{w.title || w.url}</span>
          </div>
          <MoreHorizontal size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
      
      {(!websites || websites.length === 0) && (
        <div className="text-xs text-white/20 italic py-4">No websites added yet.</div>
      )}
    </div>
  </Card>
);
