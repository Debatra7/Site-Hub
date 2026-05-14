'use client';

import React from 'react';
import { Search, Image as ImageIcon, Layers, Download, Trash2, Eye, Settings } from 'lucide-react';
import { Button } from './ui/button';

export const RightActionBar = () => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 glass p-2 rounded-2xl z-40">
      <ActionButton icon={<Search size={20} />} label="Search" />
      <ActionButton icon={<ImageIcon size={20} />} label="Wallpaper" />
      <ActionButton icon={<Layers size={20} />} label="Layout" />
      <ActionButton icon={<Download size={20} />} label="Export" />
      <ActionButton icon={<Trash2 size={20} />} label="Delete" />
      <ActionButton icon={<Eye size={20} />} label="View" />
      <div className="my-2 border-t border-white/10" />
      <Button size="icon" className="rounded-full red-button w-12 h-12">
        <Settings size={22} />
      </Button>
    </div>
  );
};

const ActionButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 w-12 h-12" title={label}>
    {icon}
  </Button>
);
