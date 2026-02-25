import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function TagBadge({ name, color, onRemove, size = 'md' }: TagBadgeProps) {
  return (
    <Badge
      className={`${size === 'sm' ? 'text-xs px-2 py-0' : 'text-sm px-2 py-1'} gap-1 cursor-default`}
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
