'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RightActionBar } from '@/components/RightActionBar';
import { HomeView } from '@/components/HomeView';
import { CategoryGridView } from '@/components/CategoryGridView';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { activeCategoryId, isSidebarOpen, setSidebarOpen, activeWallpaper } = useStore();

  // Seed initial data if empty (for MVP demo)
  useEffect(() => {
    const seedData = async () => {
      const count = await db.categories.count();
      if (count === 0) {
        const cat1Id = crypto.randomUUID();
        const cat2Id = crypto.randomUUID();
        const now = Date.now();
        
        await db.categories.bulkAdd([
          {
            id: cat1Id,
            name: 'Streaming',
            orderIndex: 0,
            visibility: 'SHARED',
            syncStatus: 'DIRTY',
            version: 1,
            updatedAt: now
          },
          {
            id: cat2Id,
            name: 'Gaming',
            orderIndex: 1,
            visibility: 'SHARED',
            syncStatus: 'DIRTY',
            version: 1,
            updatedAt: now
          }
        ]);

        await db.websites.bulkAdd([
          { id: crypto.randomUUID(), categoryId: cat1Id, url: 'https://netflix.com', normalizedUrl: 'https://netflix.com', title: 'Netflix', isPinned: true, orderIndex: 0, syncStatus: 'DIRTY', version: 1, updatedAt: now },
          { id: crypto.randomUUID(), categoryId: cat1Id, url: 'https://youtube.com', normalizedUrl: 'https://youtube.com', title: 'YouTube', isPinned: true, orderIndex: 1, syncStatus: 'DIRTY', version: 1, updatedAt: now },
          { id: crypto.randomUUID(), categoryId: cat1Id, url: 'https://disneyplus.com', normalizedUrl: 'https://disneyplus.com', title: 'Disney+', isPinned: false, orderIndex: 2, syncStatus: 'DIRTY', version: 1, updatedAt: now },
          { id: crypto.randomUUID(), categoryId: cat2Id, url: 'https://steampowered.com', normalizedUrl: 'https://steampowered.com', title: 'Steam', isPinned: true, orderIndex: 0, syncStatus: 'DIRTY', version: 1, updatedAt: now },
          { id: crypto.randomUUID(), categoryId: cat2Id, url: 'https://epicgames.com', normalizedUrl: 'https://epicgames.com', title: 'Epic Games', isPinned: true, orderIndex: 1, syncStatus: 'DIRTY', version: 1, updatedAt: now },
        ]);
      }
    };
    seedData();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Wallpaper Area */}
      <div 
        className="fixed inset-0 z-0 opacity-40 grayscale-[0.2]"
        style={{ 
          backgroundImage: activeWallpaper ? `url(${activeWallpaper})` : 'none',
          backgroundColor: '#0a0a0a',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Animated Gradient Overlays */}
      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-r from-black/60 via-transparent to-black/60" />

      <Sidebar />

      <div className={cn(
        "relative z-10 transition-all duration-300 flex flex-col min-h-screen",
        isSidebarOpen ? "pl-64" : "pl-0"
      )}>
        {/* Top Navigation Bar */}
        <header className="h-16 px-8 flex items-center justify-between glass border-t-0 border-x-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-white/10"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </Button>
            
            <nav className="flex items-center gap-1">
              <Button variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20 border-none px-6">Home</Button>
              <Button variant="ghost" className="rounded-full hover:bg-white/10 border-none px-6 text-white/50">Daily</Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ChevronRight size={20} className="rotate-180" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <Plus size={20} />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeCategoryId === null ? <HomeView /> : (
            <CategoryGridView categoryId={activeCategoryId} />
          )}
        </div>
      </div>

      <RightActionBar />
    </main>
  );
}
