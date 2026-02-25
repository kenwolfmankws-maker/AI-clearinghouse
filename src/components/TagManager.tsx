import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { chatHistoryService, ChatTag } from '@/lib/chatHistoryService';
import { TagBadge } from './TagBadge';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function TagManager() {
  const [tags, setTags] = useState<ChatTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<ChatTag | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const fetchedTags = await chatHistoryService.getTags();
    setTags(fetchedTags);
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    await chatHistoryService.createTag(newTagName.trim(), selectedColor);
    setNewTagName('');
    setSelectedColor(PRESET_COLORS[0]);
    loadTags();
  };

  const handleUpdate = async () => {
    if (!editingTag || !newTagName.trim()) return;
    await chatHistoryService.updateTag(editingTag.id, newTagName.trim(), selectedColor);
    setEditingTag(null);
    setNewTagName('');
    loadTags();
  };

  const handleDelete = async (tagId: string) => {
    await chatHistoryService.deleteTag(tagId);
    loadTags();
  };

  const startEdit = (tag: ChatTag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage Tags</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <Button onClick={editingTag ? handleUpdate : handleCreate} className="w-full">
              {editingTag ? <><Check className="h-4 w-4 mr-2" />Update</> : <><Plus className="h-4 w-4 mr-2" />Create</>}
            </Button>
            {editingTag && (
              <Button variant="outline" onClick={() => { setEditingTag(null); setNewTagName(''); }} className="w-full">
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                <TagBadge name={tag.name} color={tag.color} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tag)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
