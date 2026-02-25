import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  message: string;
  category: string;
}

interface TemplateSelectorProps {
  organizationId: string;
  onSelect: (message: string, templateId?: string) => void;
  currentMessage: string;
}


const CATEGORIES = [
  'Engineering',
  'Sales',
  'Executive',
  'Contractor',
  'Marketing',
  'Operations',
  'General'
];

const CATEGORY_COLORS: Record<string, string> = {
  Engineering: 'bg-blue-100 text-blue-800',
  Sales: 'bg-green-100 text-green-800',
  Executive: 'bg-purple-100 text-purple-800',
  Contractor: 'bg-orange-100 text-orange-800',
  Marketing: 'bg-pink-100 text-pink-800',
  Operations: 'bg-yellow-100 text-yellow-800',
  General: 'bg-gray-100 text-gray-800'
};

export function TemplateSelector({ organizationId, onSelect, currentMessage }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, [organizationId]);

  useEffect(() => {
    if (filterCategory === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(t => t.category === filterCategory));
    }
  }, [templates, filterCategory]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('invitation_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (!error && data) {
      setTemplates(data);
      setFilteredTemplates(data);
    }
  };

  const handleSelect = (templateId: string) => {
    setSelectedId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelect(template.message, templateId);
    }
  };

  const handleClear = () => {
    setSelectedId('');
    onSelect('', undefined);
  };


  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Use Template (Optional)</label>
      
      {templates.length > 3 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Select value={selectedId} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {filteredTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  <Badge 
                    className={`${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.General} text-xs`} 
                    variant="secondary"
                  >
                    {template.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedId && (
          <Button size="icon" variant="outline" onClick={handleClear}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {filterCategory !== 'all' && filteredTemplates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No templates in {filterCategory} category
        </p>
      )}
    </div>
  );
}
