import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Copy, Download, Upload, Plus, Edit2, Check, X, FileText, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import APIKeyManager from '@/components/APIKeyManager';



export interface ConfigProfile {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  supabase: {
    url: string;
    anonKey: string;
  };
  apiKeys: Record<string, string>;
  featureFlags: Record<string, boolean>;
  customVars: Record<string, string>;
}

interface ProfileManagerProps {
  onProfileApplied?: (profile: ConfigProfile) => void;
}

export default function ProfileManager({ onProfileApplied }: ProfileManagerProps) {
  const [profiles, setProfiles] = useState<ConfigProfile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    const stored = localStorage.getItem('config_profiles');
    if (stored) {
      try {
        setProfiles(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    }
  };

  const saveProfiles = (newProfiles: ConfigProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('config_profiles', JSON.stringify(newProfiles));
    window.dispatchEvent(new Event('profilesUpdated'));
  };

  const createProfile = (template?: string) => {
    const templates: Record<string, Partial<ConfigProfile>> = {
      development: {
        name: 'Development',
        description: 'Local development environment',
        featureFlags: { debugMode: true, analytics: false },
      },
      staging: {
        name: 'Staging',
        description: 'Pre-production testing',
        featureFlags: { debugMode: false, analytics: true },
      },
      production: {
        name: 'Production',
        description: 'Live production environment',
        featureFlags: { debugMode: false, analytics: true },
      },
    };

    const templateData = template ? templates[template] : {};
    const newProfile: ConfigProfile = {
      id: Date.now().toString(),
      name: templateData.name || 'New Profile',
      description: templateData.description,
      timestamp: Date.now(),
      supabase: { url: '', anonKey: '' },
      apiKeys: {},
      featureFlags: templateData.featureFlags || {},
      customVars: {},
    };

    saveProfiles([newProfile, ...profiles]);
    setEditingId(newProfile.id);
    setShowCreateForm(false);
    setMessage({ type: 'success', text: 'Profile created successfully!' });
  };

  const cloneProfile = (profile: ConfigProfile) => {
    const cloned: ConfigProfile = {
      ...profile,
      id: Date.now().toString(),
      name: `${profile.name} (Copy)`,
      timestamp: Date.now(),
    };
    saveProfiles([cloned, ...profiles]);
    setMessage({ type: 'success', text: 'Profile cloned successfully!' });
  };

  const deleteProfile = (id: string) => {
    saveProfiles(profiles.filter(p => p.id !== id));
    setMessage({ type: 'success', text: 'Profile deleted successfully!' });
  };

  const applyProfile = (profile: ConfigProfile) => {
    // Store in localStorage for persistence
    localStorage.setItem('supabase_credentials', JSON.stringify(profile.supabase));
    localStorage.setItem('active_profile_id', profile.id);
    
    // Dispatch event for runtime config context to pick up
    window.dispatchEvent(new CustomEvent('applyProfile', { detail: profile }));
    
    onProfileApplied?.(profile);
    setMessage({ type: 'success', text: `Applied profile: ${profile.name}. Settings are now active!` });
  };


  const exportProfile = (profile: ConfigProfile) => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const profile = JSON.parse(e.target?.result as string);
        profile.id = Date.now().toString();
        profile.timestamp = Date.now();
        saveProfiles([profile, ...profiles]);
        setMessage({ type: 'success', text: 'Profile imported successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to import profile' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuration Profiles</CardTitle>
            <CardDescription>Manage environment-specific settings</CardDescription>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {showCreateForm && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => createProfile('development')} variant="outline" className="flex-1">
                  Development
                </Button>
                <Button onClick={() => createProfile('staging')} variant="outline" className="flex-1">
                  Staging
                </Button>
                <Button onClick={() => createProfile('production')} variant="outline" className="flex-1">
                  Production
                </Button>
                <Button onClick={() => createProfile()} variant="outline" className="flex-1">
                  Blank
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={importProfile}
                  className="cursor-pointer"
                />
                <Button onClick={() => setShowCreateForm(false)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isEditing={editingId === profile.id}
              onEdit={() => setEditingId(profile.id)}
              onSave={(updated) => {
                saveProfiles(profiles.map(p => p.id === updated.id ? updated : p));
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              onClone={() => cloneProfile(profile)}
              onDelete={() => deleteProfile(profile.id)}
              onApply={() => applyProfile(profile)}
              onExport={() => exportProfile(profile)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfileCardProps {
  profile: ConfigProfile;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (profile: ConfigProfile) => void;
  onCancel: () => void;
  onClone: () => void;
  onDelete: () => void;
  onApply: () => void;
  onExport: () => void;
}

function ProfileCard({ profile, isEditing, onEdit, onSave, onCancel, onClone, onDelete, onApply, onExport }: ProfileCardProps) {
  const [editedProfile, setEditedProfile] = useState(profile);
  const [showEnvPreview, setShowEnvPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyEnv = async () => {
    const { profileToEnvFormat, copyToClipboard } = await import('@/lib/envExport');
    const envContent = profileToEnvFormat(profile);
    const success = await copyToClipboard(envContent);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadEnv = async () => {
    const { profileToEnvFormat, downloadAsFile } = await import('@/lib/envExport');
    const envContent = profileToEnvFormat(profile);
    const filename = `.env.${profile.name.toLowerCase().replace(/\s+/g, '-')}`;
    downloadAsFile(envContent, filename);
  };

  if (!isEditing) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              {profile.description && (
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <EnvPreviewDialog profile={profile} />
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onClone}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Supabase URL: </span>
              <span className="font-mono">{profile.supabase.url || 'Not set'}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(profile.featureFlags).length > 0 && (
                <Badge variant="secondary">{Object.keys(profile.featureFlags).length} flags</Badge>
              )}
              {Object.keys(profile.apiKeys).length > 0 && (
                <Badge variant="secondary">{Object.keys(profile.apiKeys).length} API keys</Badge>
              )}
            </div>
          </div>
          <Button onClick={onApply} className="w-full mt-4">
            Apply Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary">
      <CardContent className="pt-6 space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Profile Name</Label>
            <Input
              value={editedProfile.name}
              onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={editedProfile.description || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, description: e.target.value })}
            />
          </div>
        </div>

        <Tabs defaultValue="supabase" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="supabase">Supabase</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="custom">Custom Vars</TabsTrigger>
          </TabsList>

          <TabsContent value="supabase" className="space-y-4 mt-4">
            <div>
              <Label>Supabase URL</Label>
              <Input
                value={editedProfile.supabase.url}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  supabase: { ...editedProfile.supabase, url: e.target.value }
                })}
                placeholder="https://your-project.supabase.co"
              />
            </div>
            <div>
              <Label>Supabase Anon Key</Label>
              <Input
                type="password"
                value={editedProfile.supabase.anonKey}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  supabase: { ...editedProfile.supabase, anonKey: e.target.value }
                })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
          </TabsContent>

          <TabsContent value="apikeys" className="mt-4">
            <APIKeyManager
              apiKeys={editedProfile.apiKeys}
              onChange={(apiKeys) => setEditedProfile({ ...editedProfile, apiKeys })}
            />
          </TabsContent>

          <TabsContent value="flags" className="space-y-3 mt-4">
            <FeatureFlagManager
              flags={editedProfile.featureFlags}
              onChange={(featureFlags) => setEditedProfile({ ...editedProfile, featureFlags })}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-3 mt-4">
            <CustomVarsManager
              vars={editedProfile.customVars}
              onChange={(customVars) => setEditedProfile({ ...editedProfile, customVars })}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={() => onSave(editedProfile)} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureFlagManager({ flags, onChange }: { flags: Record<string, boolean>; onChange: (flags: Record<string, boolean>) => void }) {
  const [newFlagName, setNewFlagName] = useState('');

  const addFlag = () => {
    if (!newFlagName || flags[newFlagName] !== undefined) return;
    onChange({ ...flags, [newFlagName]: false });
    setNewFlagName('');
  };

  const removeFlag = (name: string) => {
    const updated = { ...flags };
    delete updated[name];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Feature Flags</Label>
        <Badge variant="secondary">{Object.keys(flags).length} flags</Badge>
      </div>
      
      {Object.entries(flags).map(([name, enabled]) => (
        <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
          <Label className="font-normal">{name}</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => onChange({ ...flags, [name]: checked })}
            />
            <Button variant="ghost" size="sm" onClick={() => removeFlag(name)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          placeholder="Flag name"
          value={newFlagName}
          onChange={(e) => setNewFlagName(e.target.value)}
        />
        <Button onClick={addFlag} disabled={!newFlagName}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CustomVarsManager({ vars, onChange }: { vars: Record<string, string>; onChange: (vars: Record<string, string>) => void }) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const addVar = () => {
    if (!newVarName) return;
    onChange({ ...vars, [newVarName]: newVarValue });
    setNewVarName('');
    setNewVarValue('');
  };

  const removeVar = (name: string) => {
    const updated = { ...vars };
    delete updated[name];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Custom Variables</Label>
        <Badge variant="secondary">{Object.keys(vars).length} vars</Badge>
      </div>

      {Object.entries(vars).map(([name, value]) => (
        <div key={name} className="space-y-2 p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">{name}</Label>
            <Button variant="ghost" size="sm" onClick={() => removeVar(name)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Input
            value={value}
            onChange={(e) => onChange({ ...vars, [name]: e.target.value })}
          />
        </div>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-2">
          <Input
            placeholder="Variable name"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
          />
          <Input
            placeholder="Variable value"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
          />
          <Button onClick={addVar} disabled={!newVarName} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EnvPreviewDialog({ profile }: { profile: ConfigProfile }) {
  const [envContent, setEnvContent] = useState('');
  const [copied, setCopied] = useState(false);


  const loadEnvContent = async () => {
    const { profileToEnvFormat } = await import('@/lib/envExport');
    setEnvContent(profileToEnvFormat(profile));
  };

  const handleCopy = async () => {
    const { copyToClipboard } = await import('@/lib/envExport');
    const success = await copyToClipboard(envContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    const { downloadAsFile } = await import('@/lib/envExport');
    const filename = `.env.${profile.name.toLowerCase().replace(/\s+/g, '-')}`;
    downloadAsFile(envContent, filename);
  };

  return (
    <Dialog onOpenChange={(open) => { if (open) loadEnvContent(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Environment Variables Preview</DialogTitle>
          <DialogDescription>
            Preview and export {profile.name} as .env file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={envContent}
            readOnly
            className="font-mono text-sm h-96"
          />
          <div className="flex gap-2">
            <Button onClick={handleCopy} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download .env File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
