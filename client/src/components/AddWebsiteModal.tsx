import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { defaultBookmarkNameFromUrl, normalizeUserWebsiteUrl } from '@/lib/websiteUrl';

interface AddWebsiteModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
}

const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({ open, onClose, categoryId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    const normalized = normalizeUserWebsiteUrl(url);
    if (!normalized) return;
    const websites = await db.websites.where('categoryId').equals(categoryId).sortBy('orderIndex');
    const max = websites.at(-1);
    const nextIndex = max ? max.orderIndex + 1 : 0;
    const now = Date.now();
    const resolvedTitle = title.trim() || defaultBookmarkNameFromUrl(normalized);

    await db.websites.add({
      id: crypto.randomUUID(),
      categoryId,
      url: normalized,
      normalizedUrl: normalized.toLowerCase(),
      title: resolvedTitle,
      isPinned: false,
      orderIndex: nextIndex,
      syncStatus: 'DIRTY',
      version: 1,
      updatedAt: now,
    });
    // reset fields and close
    setUrl('');
    setTitle('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[#111] text-white rounded-2xl p-6 w-96 glass border-white/10 shadow-lg transform transition-all duration-200">
        <h2 className="text-lg font-semibold mb-4">Add New Website</h2>
        <div className="space-y-3 mb-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Website URL</label>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Name (optional)</label>
            <input
              type="text"
              placeholder="Shown on the tile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!normalizeUserWebsiteUrl(url)}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddWebsiteModal;
