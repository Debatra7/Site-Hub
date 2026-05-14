'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { WebsiteCard } from './WebsiteCard';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import AddWebsiteModal from './AddWebsiteModal';

interface CategoryGridViewProps {
  categoryId: string;
}

export const CategoryGridView = ({ categoryId }: CategoryGridViewProps) => {
  const category = useLiveQuery(() => db.categories.get(categoryId));
  const websites = useLiveQuery(() => 
    db.websites.where('categoryId').equals(categoryId).sortBy('orderIndex')
  );
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  if (!category) return null;

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
            <span className="text-xs text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
              {websites?.length || 0} ITEMS
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <Button variant="outline" className="glass border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider px-6 h-10 hover:bg-white/10">
               Drag
             </Button>
             <Button variant="outline" className="glass border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider px-6 h-10 hover:bg-white/10">
               Open Notes
             </Button>
             <Button variant="outline" className="glass border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider px-6 h-10 hover:bg-white/10" onClick={() => setAddModalOpen(true)}>
               Add Website
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
          {websites?.map((w) => (
            <WebsiteCard key={w.id} website={w} />
          ))}
          
          <Button 
            variant="ghost" 
            className="aspect-square glass border-2 border-dashed border-white/5 hover:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 h-auto"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="text-white/20" size={24} />
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Add</span>
          </Button>
        </div>
      </div>

      <AddWebsiteModal open={isAddModalOpen} onClose={() => setAddModalOpen(false)} categoryId={categoryId} />
    </>
  );
};
