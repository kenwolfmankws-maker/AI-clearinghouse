import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiKeyRotationService, KeyHistoryEntry } from '@/lib/apiKeyRotationService';
import { History, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface KeyHistoryViewerProps {
  keyName: string;
}

export function KeyHistoryViewer({ keyName }: KeyHistoryViewerProps) {
  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, [keyName]);

  const loadHistory = async () => {
    const data = await apiKeyRotationService.getKeyHistory(keyName);
    setHistory(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Rotation History
        </CardTitle>
        <CardDescription>Past key rotations for {keyName}</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rotation history yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {entry.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-mono text-sm">{entry.keyHash.substring(0, 20)}...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.rotationReason}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.rotatedAt), 'PPpp')}
                  </p>
                </div>
                <Badge variant={entry.isActive ? 'default' : 'secondary'}>
                  {entry.rotatedBy}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
