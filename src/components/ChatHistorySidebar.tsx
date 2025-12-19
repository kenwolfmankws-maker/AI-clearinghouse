import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Plus, Download, Search, X, Tag, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { chatHistoryService, ChatConversation, ChatTag } from '@/lib/chatHistoryService';
import { exportChatToPDF, exportChatToTXT, exportChatToJSON } from '@/lib/chatExportService';
import { TagBadge } from './TagBadge';
import { TagManager } from './TagManager';
import { BulkActionsToolbar } from './BulkActionsToolbar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';


interface ChatHistorySidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-slate-900">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export function ChatHistorySidebar({ 
  currentConversationId, 
  onSelectConversation, 
  onNewChat 
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [allTags, setAllTags] = useState<ChatTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagPopover, setShowTagPopover] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());




  const loadConversations = async () => {
    setLoading(true);
    const convs = await chatHistoryService.getConversationsWithTags();
    setConversations(convs);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    loadTags();
  }, []);


  useEffect(() => {
    if (selectedTagIds.length > 0) {
      filterByTags();
    } else {
      handleSearch();
    }
  }, [searchQuery, selectedTagIds]);

  const loadTags = async () => {
    const tags = await chatHistoryService.getTags();
    setAllTags(tags);
  };

  const filterByTags = async () => {
    setLoading(true);
    const filtered = await chatHistoryService.filterConversationsByTags(selectedTagIds);
    setConversations(filtered);
    setLoading(false);
  };


  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddTagToConversation = async (conversationId: string, tagId: string) => {
    await chatHistoryService.addTagToConversation(conversationId, tagId);
    const updatedConvs = await chatHistoryService.getConversationsWithTags();
    setConversations(updatedConvs);
    setShowTagPopover(null);
  };

  const handleRemoveTagFromConversation = async (conversationId: string, tagId: string) => {
    await chatHistoryService.removeTagFromConversation(conversationId, tagId);
    const updatedConvs = await chatHistoryService.getConversationsWithTags();
    setConversations(updatedConvs);
  };

  // Bulk selection handlers
  const handleToggleSelection = (conversationId: string) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedConversations.size === conversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(conversations.map(c => c.id)));
    }
  };

  const handleBulkAddTag = async (tagId: string) => {
    const convIds = Array.from(selectedConversations);
    await chatHistoryService.bulkAddTagToConversations(convIds, tagId);
    const updatedConvs = await chatHistoryService.getConversationsWithTags();
    setConversations(updatedConvs);
  };

  const handleBulkRemoveTag = async (tagId: string) => {
    const convIds = Array.from(selectedConversations);
    await chatHistoryService.bulkRemoveTagFromConversations(convIds, tagId);
    const updatedConvs = await chatHistoryService.getConversationsWithTags();
    setConversations(updatedConvs);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedConversations.size} conversations?`)) {
      const convIds = Array.from(selectedConversations);
      const success = await chatHistoryService.bulkDeleteConversations(convIds);
      if (success) {
        setConversations(prev => prev.filter(c => !selectedConversations.has(c.id)));
        setSelectedConversations(new Set());
        if (currentConversationId && selectedConversations.has(currentConversationId)) {
          onNewChat();
        }
      }
    }
  };



  const handleSearch = async () => {
    setSearching(true);
    const results = await chatHistoryService.searchConversations(searchQuery);
    setConversations(results);
    setSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      const success = await chatHistoryService.deleteConversation(conversationId);
      if (success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          onNewChat();
        }
      }
    }
  };

  const handleExport = async (e: React.MouseEvent, conversationId: string, format: 'pdf' | 'txt' | 'json') => {
    e.stopPropagation();
    const messages = await chatHistoryService.getMessages(conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation || !messages) return;

    const exportData = {
      ...conversation,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.created_at
      }))
    };

    switch (format) {
      case 'pdf':
        exportChatToPDF(exportData);
        break;
      case 'txt':
        exportChatToTXT(exportData);
        break;
      case 'json':
        exportChatToJSON(exportData);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r">
      {/* Bulk Actions Toolbar */}
      {selectedConversations.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedConversations.size}
          allTags={allTags}
          onAddTag={handleBulkAddTag}
          onRemoveTag={handleBulkRemoveTag}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedConversations(new Set())}
        />
      )}

      <div className="p-4 border-b space-y-3">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <div className="flex gap-2">
          <TagManager />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Filter Tags {selectedTagIds.length > 0 && `(${selectedTagIds.length})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => handleToggleTag(tag.id)}
                >
                  <TagBadge name={tag.name} color={tag.color} size="sm" />
                </DropdownMenuCheckboxItem>
              ))}
              {allTags.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-slate-500">No tags yet</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {searchQuery && (
          <div className="text-xs text-slate-500 text-center">
            {searching ? 'Searching...' : `${conversations.length} result${conversations.length !== 1 ? 's' : ''} found`}
          </div>
        )}

        {/* Select All Checkbox */}
        {conversations.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              checked={selectedConversations.size === conversations.length && conversations.length > 0}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
              Select All ({conversations.length})
            </label>
          </div>
        )}
      </div>


      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-4">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-4">
              {searchQuery ? 'No conversations found' : 'No chat history'}
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative p-3 rounded-lg mb-1 transition-colors",
                  currentConversationId === conv.id
                    ? "bg-blue-100 border border-blue-200"
                    : "hover:bg-slate-100",
                  selectedConversations.has(conv.id) && "bg-blue-50 border border-blue-300"
                )}
              >
                {/* Checkbox */}
                <div className="absolute left-2 top-3 z-10">
                  <Checkbox
                    checked={selectedConversations.has(conv.id)}
                    onCheckedChange={() => handleToggleSelection(conv.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div 
                  onClick={() => onSelectConversation(conv.id)}
                  className="flex items-start gap-2 pl-7 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      <HighlightedText text={conv.title} query={searchQuery} />
                    </div>
                    <div className="text-xs text-slate-500 mb-1.5">{formatDate(conv.updated_at)}</div>
                    
                    {/* Tag badges */}
                    {conv.tags && conv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {conv.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTagIds([tag.id]);
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <TagBadge name={tag.name} color={tag.color} size="sm" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>


                {/* Hover actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Quick add tag button */}
                  <Popover open={showTagPopover === conv.id} onOpenChange={(open) => setShowTagPopover(open ? conv.id : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 w-6 p-0"
                        title="Manage tags"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-64 p-3" 
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-sm mb-2">Manage Tags</div>
                        <ScrollArea className="max-h-48">
                          <div className="space-y-1">
                            {allTags.map((tag) => {
                              const isAssigned = conv.tags?.some(t => t.id === tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    if (isAssigned) {
                                      handleRemoveTagFromConversation(conv.id, tag.id);
                                    } else {
                                      handleAddTagToConversation(conv.id, tag.id);
                                    }
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2 rounded text-sm hover:bg-slate-100 transition-colors",
                                    isAssigned && "bg-slate-50"
                                  )}
                                >
                                  <TagBadge name={tag.name} color={tag.color} size="sm" />
                                  {isAssigned && (
                                    <X className="w-3 h-3 text-slate-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        {allTags.length === 0 && (
                          <div className="text-sm text-slate-500 text-center py-2">
                            No tags yet. Create one using the tag manager.
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 w-6 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleExport(e, conv.id, 'pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleExport(e, conv.id, 'txt')}>
                        Export as TXT
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleExport(e, conv.id, 'json')}>
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
