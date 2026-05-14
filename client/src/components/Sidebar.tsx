'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Tv, Gamepad2, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const { activeCategoryId, setActiveCategoryId, isSidebarOpen } = useStore();
  
  const categories = useLiveQuery(() => db.categories.orderBy('orderIndex').toArray());

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen glass z-40 transition-all duration-300 flex flex-col",
      isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="font-bold text-xl tracking-tight">BETA HUB</h1>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Default Home Section */}
          <div className="space-y-2">
            <Button 
              variant={activeCategoryId === null ? "secondary" : "ghost"} 
              className="w-full justify-start gap-3"
              onClick={() => setActiveCategoryId(null)}
            >
              <LayoutDashboard size={18} />
              Home
            </Button>
          </div>

          {/* Grouped Categories would go here, for now list all */}
          <div className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspaces
            </h3>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategoryId === cat.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name.toLowerCase().includes('streaming') ? <Tv size={18} /> : 
                 cat.name.toLowerCase().includes('gaming') ? <Gamepad2 size={18} /> : 
                 <LayoutDashboard size={18} />}
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <Button className="w-full red-button gap-2 shadow-lg shadow-red-900/20">
          <Plus size={18} />
          New Group
        </Button>
      </div>
    </div>
  );
};
