import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateDiffViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldVersion: any;
  newVersion: any;
  templateName: string;
}

export function TemplateDiffView({
  open,
  onOpenChange,
  oldVersion,
  newVersion,
  templateName
}: TemplateDiffViewProps) {
  const getDiff = (field: string, oldVal: any, newVal: any) => {
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
      return null;
    }
    return { old: oldVal, new: newVal };
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const fields = [
    { key: 'name', label: 'Template Name' },
    { key: 'description', label: 'Description' },
    { key: 'date_range', label: 'Date Range' },
    { key: 'email_subject', label: 'Email Subject' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'metrics', label: 'Metrics' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Compare Versions: {templateName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Badge variant="outline">Version {oldVersion.version_number}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(oldVersion.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex-1">
                <Badge>Current Version</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(newVersion.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {fields.map((field) => {
              const diff = getDiff(
                field.key,
                oldVersion[field.key],
                newVersion[field.key]
              );

              if (!diff) {
                return (
                  <div key={field.key} className="border-b pb-4">
                    <h3 className="font-medium mb-2">{field.label}</h3>
                    <div className="bg-muted p-3 rounded">
                      <pre className="text-sm whitespace-pre-wrap">
                        {formatValue(newVersion[field.key])}
                      </pre>
                    </div>
                  </div>
                );
              }

              return (
                <div key={field.key} className="border-b pb-4">
                  <h3 className="font-medium mb-2">{field.label}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Old Value</p>
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <pre className="text-sm whitespace-pre-wrap text-red-900">
                          {formatValue(diff.old)}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">New Value</p>
                      <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <pre className="text-sm whitespace-pre-wrap text-green-900">
                          {formatValue(diff.new)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
