import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Share2, Copy, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  frequency: string;
  format: string;
  date_range: string;
  metrics: string[];
  is_shared: boolean;
  is_public: boolean;
  user_id: string;
}

interface ReportTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: ReportTemplate) => void;
  currentConfig?: {
    frequency: string;
    format: string;
    date_range: string;
    metrics: string[];
  };
}

export default function ReportTemplateManager({ open, onClose, onUseTemplate, currentConfig }: ReportTemplateManagerProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('is_public', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!currentConfig || !newTemplate.name) {
      toast.error('Please provide a template name');
      return;
    }

    try {
      const { error } = await supabase.from('report_templates').insert({
        user_id: user?.id,
        name: newTemplate.name,
        description: newTemplate.description,
        template_type: 'custom',
        frequency: currentConfig.frequency,
        format: currentConfig.format,
        date_range: currentConfig.date_range,
        metrics: currentConfig.metrics,
        is_shared: false,
        is_public: false
      });

      if (error) throw error;
      toast.success('Template saved successfully');
      setShowSaveDialog(false);
      setNewTemplate({ name: '', description: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('report_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const duplicateTemplate = async (template: ReportTemplate) => {
    try {
      const { error } = await supabase.from('report_templates').insert({
        user_id: user?.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: 'custom',
        frequency: template.frequency,
        format: template.format,
        date_range: template.date_range,
        metrics: template.metrics,
        is_shared: false,
        is_public: false
      });

      if (error) throw error;
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Templates Library
              </span>
              {currentConfig && (
                <Button onClick={() => setShowSaveDialog(true)} size="sm">
                  Save Current Config
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading templates...</div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.is_public && <Badge variant="secondary">Pre-built</Badge>}
                          {template.is_shared && <Badge variant="outline">Shared</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{template.frequency}</Badge>
                          <Badge variant="outline">{template.format.toUpperCase()}</Badge>
                          <Badge variant="outline">{template.date_range?.replace(/_/g, ' ')}</Badge>
                          <Badge variant="outline">{template.metrics.length} metrics</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" onClick={() => onUseTemplate(template)}>
                          <Download className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateTemplate(template)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        {template.user_id === user?.id && !template.is_public && (
                          <Button size="sm" variant="destructive" onClick={() => deleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., My Weekly Report"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Describe what this template is for..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={saveAsTemplate}>Save Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
