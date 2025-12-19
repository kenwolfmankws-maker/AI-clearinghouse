import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  message: string;
  category: string;
  created_at: string;
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

export function InvitationTemplateManager({ organizationId }: { organizationId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from('invitation_templates')
        .update({ name, message, category, updated_at: new Date().toISOString() })
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error('Failed to update template');
      } else {
        toast.success('Template updated');
        loadTemplates();
        resetForm();
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('invitation_templates')
        .insert({ organization_id: organizationId, name, message, category, created_by: user?.id });

      if (error) {
        toast.error('Failed to create template');
      } else {
        toast.success('Template created');
        loadTemplates();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    const { error } = await supabase
      .from('invitation_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete template');
    } else {
      toast.success('Template deleted');
      loadTemplates();
    }
  };

  const resetForm = () => {
    setName('');
    setMessage('');
    setCategory('General');
    setEditingTemplate(null);
    setIsOpen(false);
  };

  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setMessage(template.message);
    setCategory(template.category || 'General');
    setIsOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invitation Templates</CardTitle>
            <CardDescription>Create and manage reusable invitation message templates</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome to Engineering Team"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your custom invitation message..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">Save</Button>
                  <Button onClick={resetForm} variant="outline">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
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
        </div>
        <div className="space-y-3">
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {filterCategory === 'all' 
                ? 'No templates yet. Create your first template to get started.'
                : `No templates in ${filterCategory} category.`}
            </p>
          ) : (
            filteredTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge className={CATEGORY_COLORS[template.category] || CATEGORY_COLORS.General} variant="secondary">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.message}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
