import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

interface AddWebsiteModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
}

const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({ open, onClose, categoryId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    if (!url) return;
    // Determine next order index for this category
    const websites = await db.websites.where('categoryId').equals(categoryId).sortBy('orderIndex');
    const max = websites.at(-1);
    const nextIndex = max ? max.orderIndex + 1 : 0;
    const now = Date.now();
    const normalizedUrl = url.trim().toLowerCase();

    await db.websites.add({
      id: crypto.randomUUID(),
      categoryId,
      url,
      normalizedUrl,
      title: title || undefined,
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
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>
    </div>
  );
};

export default AddWebsiteModal;
