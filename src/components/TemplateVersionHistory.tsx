import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TemplateDiffView } from './TemplateDiffView';

interface Version {
  id: string;
  version_number: number;
  name: string;
  description: string;
  date_range: string;
  metrics: any;
  email_subject: string;
  timezone: string;
  created_by: string;
  created_at: string;
  change_summary: string;
}

interface TemplateVersionHistoryProps {
  templateId: string;
  templateName: string;
  currentVersion: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
}

export function TemplateVersionHistory({
  templateId,
  templateName,
  currentVersion,
  open,
  onOpenChange,
  onRestore
}: TemplateVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, templateId]);

  const loadVersions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive'
      });
    } else {
      setVersions(data || []);
    }
    setLoading(false);
  };

  const handleRestore = async (version: Version) => {
    const { error } = await supabase
      .from('report_templates')
      .update({
        name: version.name,
        description: version.description,
        date_range: version.date_range,
        metrics: version.metrics,
        email_subject: version.email_subject,
        timezone: version.timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Restored to version ${version.version_number}`
      });
      onRestore();
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History: {templateName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {loading ? (
              <div className="text-center py-8">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No version history available
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>v{version.version_number}</Badge>
                          <span className="font-medium">{version.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(version.created_at).toLocaleString()}
                          </span>
                          <span>Range: {version.date_range}</span>
                          <span>Metrics: {Object.keys(version.metrics).length}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowDiff(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRestore(version)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedVersion && (
        <TemplateDiffView
          open={showDiff}
          onOpenChange={setShowDiff}
          oldVersion={selectedVersion}
          newVersion={currentVersion}
          templateName={templateName}
        />
      )}
    </>
  );
}
