import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { parseEmailsFromText, parseEmailsFromCSV, createBulkInvitations, BulkInvitationResult } from '@/lib/invitationService';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateSelector } from './TemplateSelector';


interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  inviterName: string;
  onComplete: () => void;
}

export function BulkInviteModal({ open, onClose, organizationId, organizationName, inviterName, onComplete }: Props) {
  const [emailText, setEmailText] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [customMessage, setCustomMessage] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkInvitationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const emails = await parseEmailsFromCSV(file);
      setParsedEmails(emails);
      setEmailText(emails.join('\n'));
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  };

  const handleParseText = () => {
    const emails = parseEmailsFromText(emailText);
    setParsedEmails(emails);
  };

  const handleSendInvitations = async () => {
    if (parsedEmails.length === 0) return;

    setLoading(true);
    setProgress(0);
    setResults([]);

    const batchResults = await createBulkInvitations(
      organizationId,
      parsedEmails,
      role,
      organizationName,
      inviterName,
      customMessage || undefined
    );


    setResults(batchResults);
    setProgress(100);
    setLoading(false);
    onComplete();
  };

  const handleClose = () => {
    setEmailText('');
    setParsedEmails([]);
    setResults([]);
    setProgress(0);
    onClose();
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Invite Members
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste multiple email addresses to invite team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Upload CSV File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose CSV File
            </Button>
          </div>

          <div>
            <Label htmlFor="emails">Or Paste Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="email1@example.com, email2@example.com&#10;or one per line"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="h-32 mt-2"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleParseText}
              className="mt-2"
            >
              Parse Emails
            </Button>
          </div>

          {parsedEmails.length > 0 && (
            <>
              <div>
                <Label>Default Role for All Invitations</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>

                  </SelectContent>
                </Select>


              </div>

              <TemplateSelector
                organizationId={organizationId}
                onSelect={setCustomMessage}
                currentMessage={customMessage}
              />

              <div>

                <Label htmlFor="customMessage">Custom Welcome Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a personal welcome message that will be included in the invitation email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="h-24 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message will be displayed prominently in the invitation email
                </p>
              </div>

              <div>
                <Label>Parsed Emails ({parsedEmails.length})</Label>
                <ScrollArea className="h-32 border rounded-md p-2 mt-2">
                  <div className="flex flex-wrap gap-1">
                    {parsedEmails.map((email, i) => (
                      <Badge key={i} variant="secondary">{email}</Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>

          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Sending invitations...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{successCount} successful</span>
                </div>
                {failureCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{failureCount} failed</span>
                  </div>
                )}
              </div>
              {failureCount > 0 && (
                <ScrollArea className="h-24 border rounded-md p-2">
                  {results.filter(r => !r.success).map((result, i) => (
                    <div key={i} className="text-xs text-red-600">
                      {result.email}: {result.error}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              {results.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            {results.length === 0 && (
              <Button
                onClick={handleSendInvitations}
                disabled={parsedEmails.length === 0 || loading}
              >
                Send {parsedEmails.length} Invitation{parsedEmails.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
