'use client';

import React from 'react';
import { Search, Image as ImageIcon, Layers, Download, Trash2, Eye, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  themeColor: string;
}

type SidebarItem = {
  id: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export function BookSidebar({
  sidebarOpen,
  setSidebarOpen,
  setActiveModal,
  themeColor,
}: BookSidebarProps) {
  const items: SidebarItem[] = [
    { id: 'search', icon: <Search size={20} /> },
    { id: 'wallpaper', icon: <ImageIcon size={20} /> },
    { id: 'theme', icon: <Layers size={20} /> },
    { id: 'download', icon: <Download size={20} /> },
    { id: 'trash', icon: <Trash2 size={20} /> },
    {
      id: 'visibility',
      icon: <Eye size={20} />,
      onClick: () => {
        window.open('https://duckduckgo.com', '_blank', 'noopener,noreferrer');
      },
    },
    {
      id: 'settings',
      icon: <Settings size={20} />,
      onClick: () => setActiveModal('settings'),
    },
  ];

  return (
    <div className="fixed right-8 bottom-8 z-50 flex flex-col items-center gap-4">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-center gap-2 rounded-full border border-white/5 bg-black/20 p-2 shadow-2xl backdrop-blur-3xl"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.id === 'search') setActiveModal('search');
                  else if (item.id === 'wallpaper') setActiveModal('wallpaper');
                  else if (item.id === 'theme') setActiveModal('theme');
                }}
                className="p-3 text-white/40 transition-all hover:scale-110 hover:text-white active:scale-95"
              >
                {item.icon}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ backgroundColor: themeColor }}
        className="z-10 rounded-full p-4 text-white shadow-lg shadow-black/20 transition-all hover:scale-110 active:scale-95"
      >
        <Settings
          size={22}
          className={`transition-transform duration-500 ${sidebarOpen ? 'rotate-90' : 'rotate-0'}`}
        />
      </button>
    </div>
  );
}
