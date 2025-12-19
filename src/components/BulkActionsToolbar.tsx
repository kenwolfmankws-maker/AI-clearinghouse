import { Tag, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatTag } from '@/lib/chatHistoryService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { TagBadge } from './TagBadge';

interface BulkActionsToolbarProps {
  selectedCount: number;
  allTags: ChatTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  allTags,
  onAddTag,
  onRemoveTag,
  onDelete,
  onClear,
}: BulkActionsToolbarProps) {
  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-medium">{selectedCount} selected</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allTags.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => onAddTag(tag.id)}>
                <TagBadge name={tag.name} color={tag.color} size="sm" />
              </DropdownMenuItem>
            ))}
            {allTags.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-slate-500">No tags available</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Remove Tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allTags.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => onRemoveTag(tag.id)}>
                <TagBadge name={tag.name} color={tag.color} size="sm" />
              </DropdownMenuItem>
            ))}
            {allTags.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-slate-500">No tags available</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onClear} className="text-white hover:bg-blue-700">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
