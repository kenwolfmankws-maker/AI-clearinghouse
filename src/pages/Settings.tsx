import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Loader2, Trash2, Eye, EyeOff, Download, Upload, Clock, RotateCcw, GitCompare, FileDown, Pencil, CheckSquare, Square, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, FileUp } from 'lucide-react';


import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import EditConfigLabelModal from '@/components/EditConfigLabelModal';
import ProfileManager from '@/components/ProfileManager';
import { APIKeyRotationAnalytics } from '@/components/APIKeyRotationAnalytics';





import { supabase } from '@/lib/supabase';


interface CredentialHistory {
  id: string;
  url: string;
  anonKey: string;
  timestamp: number;
  label?: string;
}

export default function Settings() {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [credentialHistory, setCredentialHistory] = useState<CredentialHistory[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareConfig1, setCompareConfig1] = useState<string>('');
  const [compareConfig2, setCompareConfig2] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<CredentialHistory | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());
  const [isBulkLabelModalOpen, setIsBulkLabelModalOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'label' | 'url'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');





  useEffect(() => {
    const stored = localStorage.getItem('supabase_credentials');
    if (stored) {
      const creds = JSON.parse(stored);
      setUrl(creds.url || '');
      setAnonKey(creds.anonKey || '');
    } else {
      setUrl(import.meta.env.VITE_SUPABASE_URL || '');
      setAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
    }

    // Load credential history
    loadCredentialHistory();
  }, []);

  const loadCredentialHistory = () => {
    const stored = localStorage.getItem('supabase_credential_history');
    if (stored) {
      try {
        const history = JSON.parse(stored);
        setCredentialHistory(history);
      } catch (error) {
        console.error('Failed to load credential history:', error);
      }
    }
  };

  const saveToHistory = (credUrl: string, credKey: string) => {
    // Check if this exact configuration already exists
    const exists = credentialHistory.some(
      entry => entry.url === credUrl && entry.anonKey === credKey
    );

    if (exists) return;

    const newEntry: CredentialHistory = {
      id: Date.now().toString(),
      url: credUrl,
      anonKey: credKey,
      timestamp: Date.now(),
    };

    const updatedHistory = [newEntry, ...credentialHistory].slice(0, 10); // Keep last 10
    setCredentialHistory(updatedHistory);
    localStorage.setItem('supabase_credential_history', JSON.stringify(updatedHistory));
  };

  const switchToConfiguration = (entry: CredentialHistory) => {
    setUrl(entry.url);
    setAnonKey(entry.anonKey);
    setTestResult({ 
      success: true, 
      message: 'Configuration loaded! Click "Save Credentials" to apply.' 
    });
  };

  const deleteHistoryEntry = (id: string) => {
    const updatedHistory = credentialHistory.filter(entry => entry.id !== id);
    setCredentialHistory(updatedHistory);
    localStorage.setItem('supabase_credential_history', JSON.stringify(updatedHistory));
    setTestResult({ success: true, message: 'Configuration deleted from history.' });
  };

  const openEditModal = (entry: CredentialHistory) => {
    setEditingConfig(entry);
    setIsEditModalOpen(true);
  };

  const handleSaveLabel = (label: string) => {
    if (!editingConfig) return;

    const updatedHistory = credentialHistory.map(entry =>
      entry.id === editingConfig.id ? { ...entry, label } : entry
    );
    
    setCredentialHistory(updatedHistory);
    localStorage.setItem('supabase_credential_history', JSON.stringify(updatedHistory));
    setTestResult({ success: true, message: 'Configuration label updated successfully!' });
  };

  // Bulk operations
  const toggleSelectConfig = (id: string) => {
    const newSelected = new Set(selectedConfigs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedConfigs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedConfigs.size === credentialHistory.length) {
      setSelectedConfigs(new Set());
    } else {
      setSelectedConfigs(new Set(credentialHistory.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    const updatedHistory = credentialHistory.filter(entry => !selectedConfigs.has(entry.id));
    setCredentialHistory(updatedHistory);
    localStorage.setItem('supabase_credential_history', JSON.stringify(updatedHistory));
    setTestResult({ success: true, message: `${selectedConfigs.size} configuration(s) deleted successfully!` });
    setSelectedConfigs(new Set());
  };

  const handleBulkExport = () => {
    const selectedEntries = credentialHistory.filter(entry => selectedConfigs.has(entry.id));
    const exportData = {
      exportedAt: new Date().toLocaleString(),
      count: selectedEntries.length,
      configurations: selectedEntries.map(entry => ({
        label: entry.label || 'Unlabeled',
        timestamp: new Date(entry.timestamp).toLocaleString(),
        url: entry.url,
        anonKey: entry.anonKey,
      })),
    };

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-configs-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTestResult({ success: true, message: `${selectedConfigs.size} configuration(s) exported successfully!` });
  };

  const handleBulkLabelAssign = () => {
    setIsBulkLabelModalOpen(true);
  };

  const handleSaveBulkLabel = (label: string) => {
    const updatedHistory = credentialHistory.map(entry =>
      selectedConfigs.has(entry.id) ? { ...entry, label } : entry
    );
    
    setCredentialHistory(updatedHistory);
    localStorage.setItem('supabase_credential_history', JSON.stringify(updatedHistory));
    setTestResult({ success: true, message: `Label applied to ${selectedConfigs.size} configuration(s)!` });
    setSelectedConfigs(new Set());
  };



  // Get unique labels from history
  const getUniqueLabels = () => {
    const labels = credentialHistory
      .map(entry => entry.label)
      .filter((label): label is string => !!label);
    return Array.from(new Set(labels));
  };

  // Filter and sort configurations
  const getFilteredAndSortedHistory = () => {
    let filtered = [...credentialHistory];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        (entry.label?.toLowerCase().includes(term)) ||
        entry.url.toLowerCase().includes(term)
      );
    }

    // Apply label filter
    if (selectedLabelFilter !== 'all') {
      if (selectedLabelFilter === 'unlabeled') {
        filtered = filtered.filter(entry => !entry.label);
      } else {
        filtered = filtered.filter(entry => entry.label === selectedLabelFilter);
      }
    }

    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        'today': 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000,
      };
      
      const range = ranges[dateRangeFilter];
      if (range) {
        filtered = filtered.filter(entry => now - entry.timestamp <= range);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'label') {
        const labelA = a.label || '';
        const labelB = b.label || '';
        comparison = labelA.localeCompare(labelB);
      } else if (sortField === 'url') {
        comparison = a.url.localeCompare(b.url);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLabelFilter('all');
    setDateRangeFilter('all');
    setSortField('date');
    setSortDirection('desc');
  };

  // Export entire configuration set
  const exportConfigSet = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedAtReadable: new Date().toLocaleString(),
      totalConfigurations: credentialHistory.length,
      configurations: credentialHistory,
    };

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config-set-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTestResult({ success: true, message: `Configuration set exported successfully! (${credentialHistory.length} configs)` });
  };

  // Import entire configuration set
  const importConfigSet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setTestResult({ success: false, message: 'Invalid file type. Please upload a JSON file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate import data structure
        if (!importData.configurations || !Array.isArray(importData.configurations)) {
          setTestResult({ success: false, message: 'Invalid configuration file format.' });
          return;
        }

        // Validate each configuration
        const validConfigs = importData.configurations.filter((config: any) => 
          config.url && config.anonKey && config.timestamp
        );

        if (validConfigs.length === 0) {
          setTestResult({ success: false, message: 'No valid configurations found in file.' });
          return;
        }

        // Merge with existing configurations (avoid duplicates)
        const existingUrls = new Set(credentialHistory.map(c => `${c.url}|${c.anonKey}`));
        const newConfigs = validConfigs.filter((config: any) => 
          !existingUrls.has(`${config.url}|${config.anonKey}`)
        );

        const mergedHistory = [...newConfigs, ...credentialHistory].slice(0, 50); // Keep up to 50
        setCredentialHistory(mergedHistory);
        localStorage.setItem('supabase_credential_history', JSON.stringify(mergedHistory));

        setTestResult({ 
          success: true, 
          message: `Imported ${newConfigs.length} new configuration(s)! (${validConfigs.length - newConfigs.length} duplicates skipped)` 
        });
      } catch (error) {
        setTestResult({ success: false, message: 'Failed to parse configuration file.' });
      }
    };

    reader.onerror = () => {
      setTestResult({ success: false, message: 'Failed to read file.' });
    };

    reader.readAsText(file);
    event.target.value = '';
  };





  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) throw error;
      
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const saveCredentials = () => {
    localStorage.setItem('supabase_credentials', JSON.stringify({ url, anonKey }));
    
    // Save to history
    saveToHistory(url, anonKey);
    
    setTestResult({ success: true, message: 'Credentials saved! Reload to apply changes.' });
  };


  const clearStorage = () => {
    localStorage.clear();
    setTestResult({ success: true, message: 'All data cleared! Reload to reconfigure.' });
  };

  const exportEnvFile = () => {
    const envContent = `# Supabase Configuration
# Generated on ${new Date().toLocaleString()}

VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${anonKey}
`;

    const blob = new Blob([envContent], { type: 'text/plain' });
    const url_download = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_download;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url_download);

    setTestResult({ success: true, message: '.env file downloaded successfully!' });

  };

  const importEnvFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.env')) {
      setTestResult({ success: false, message: 'Invalid file type. Please upload a .env file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Parse .env file content
        const lines = content.split('\n');
        let foundUrl = '';
        let foundKey = '';

        lines.forEach(line => {
          const trimmedLine = line.trim();
          // Skip comments and empty lines
          if (trimmedLine.startsWith('#') || !trimmedLine) return;

          // Parse KEY=VALUE format
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=').trim();

          if (key.trim() === 'VITE_SUPABASE_URL') {
            foundUrl = value;
          } else if (key.trim() === 'VITE_SUPABASE_ANON_KEY') {
            foundKey = value;
          }
        });

        // Validate that both required variables were found
        if (!foundUrl || !foundKey) {
          const missing = [];
          if (!foundUrl) missing.push('VITE_SUPABASE_URL');
          if (!foundKey) missing.push('VITE_SUPABASE_ANON_KEY');
          setTestResult({ 
            success: false, 
            message: `Missing required variables: ${missing.join(', ')}` 
          });
          return;
        }

        // Update state with parsed values
        setUrl(foundUrl);
        setAnonKey(foundKey);
        setTestResult({ 
          success: true, 
          message: '.env file imported successfully! Click "Save Credentials" to apply.' 
        });
      } catch (error) {
        setTestResult({ 
          success: false, 
          message: 'Failed to parse .env file. Please check the file format.' 
        });
      }
    };

    reader.onerror = () => {
      setTestResult({ success: false, message: 'Failed to read file.' });
    };

    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Helper function to find differences between two strings
  const findDifferences = (str1: string, str2: string) => {
    if (str1 === str2) return { hasDiff: false, segments: [{ text: str1, type: 'same' }] };
    
    const segments: Array<{ text: string; type: 'same' | 'removed' | 'added' }> = [];
    const maxLen = Math.max(str1.length, str2.length);
    
    let i = 0;
    while (i < maxLen) {
      if (str1[i] === str2[i]) {
        let sameText = '';
        while (i < maxLen && str1[i] === str2[i]) {
          sameText += str1[i] || '';
          i++;
        }
        segments.push({ text: sameText, type: 'same' });
      } else {
        let diff1 = '';
        let diff2 = '';
        const startI = i;
        
        // Find next matching point or end
        while (i < maxLen && str1[i] !== str2[i]) {
          if (i < str1.length) diff1 += str1[i];
          if (i < str2.length) diff2 += str2[i];
          i++;
        }
        
        if (diff1) segments.push({ text: diff1, type: 'removed' });
        if (diff2) segments.push({ text: diff2, type: 'added' });
      }
    }
    
    return { hasDiff: true, segments };
  };

  const getComparisonData = () => {
    const config1 = credentialHistory.find(c => c.id === compareConfig1);
    const config2 = credentialHistory.find(c => c.id === compareConfig2);
    
    if (!config1 || !config2) return null;
    
    return {
      config1,
      config2,
      urlDiff: findDifferences(config1.url, config2.url),
      keyDiff: findDifferences(config1.anonKey, config2.anonKey),
    };
  };

  const exportComparisonReport = (format: 'text' | 'json' | 'html') => {
    const comparison = getComparisonData();
    if (!comparison) return;

    const timestamp = new Date().toLocaleString();
    const { config1, config2, urlDiff, keyDiff } = comparison;

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'text') {
      content = `SUPABASE CONFIGURATION COMPARISON REPORT
Generated: ${timestamp}

================================================
CONFIGURATION 1
================================================
Timestamp: ${new Date(config1.timestamp).toLocaleString()}
URL: ${config1.url}
Anon Key: ${config1.anonKey}

================================================
CONFIGURATION 2
================================================
Timestamp: ${new Date(config2.timestamp).toLocaleString()}
URL: ${config2.url}
Anon Key: ${config2.anonKey}

================================================
DIFFERENCES ANALYSIS
================================================
URL Comparison: ${urlDiff.hasDiff ? 'DIFFERENT' : 'IDENTICAL'}
Anon Key Comparison: ${keyDiff.hasDiff ? 'DIFFERENT' : 'IDENTICAL'}

Overall Status: ${!urlDiff.hasDiff && !keyDiff.hasDiff ? 'Configurations are identical' : 'Configurations have differences'}
`;
      filename = `config-comparison-${Date.now()}.txt`;
      mimeType = 'text/plain';
    } else if (format === 'json') {
      const reportData = {
        generatedAt: timestamp,
        configuration1: {
          timestamp: new Date(config1.timestamp).toLocaleString(),
          url: config1.url,
          anonKey: config1.anonKey,
        },
        configuration2: {
          timestamp: new Date(config2.timestamp).toLocaleString(),
          url: config2.url,
          anonKey: config2.anonKey,
        },
        differences: {
          url: urlDiff.hasDiff,
          anonKey: keyDiff.hasDiff,
          identical: !urlDiff.hasDiff && !keyDiff.hasDiff,
        },
      };
      content = JSON.stringify(reportData, null, 2);
      filename = `config-comparison-${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <title>Configuration Comparison Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .config { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; }
    .config h3 { margin-top: 0; color: #2196F3; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
    .value { font-family: monospace; background: white; padding: 10px; border-radius: 4px; word-break: break-all; margin-top: 5px; }
    .diff { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .same { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .summary { background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Supabase Configuration Comparison Report</h1>
  <div class="meta">Generated: ${timestamp}</div>
  
  <div class="comparison">
    <div class="config">
      <h3>Configuration 1</h3>
      <div class="field">
        <div class="label">Timestamp</div>
        <div class="value">${new Date(config1.timestamp).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">Supabase URL</div>
        <div class="value">${config1.url}</div>
      </div>
      <div class="field">
        <div class="label">Anon Key</div>
        <div class="value">${config1.anonKey}</div>
      </div>
    </div>
    
    <div class="config">
      <h3>Configuration 2</h3>
      <div class="field">
        <div class="label">Timestamp</div>
        <div class="value">${new Date(config2.timestamp).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">Supabase URL</div>
        <div class="value">${config2.url}</div>
      </div>
      <div class="field">
        <div class="label">Anon Key</div>
        <div class="value">${config2.anonKey}</div>
      </div>
    </div>
  </div>
  
  <h2>Differences Analysis</h2>
  ${urlDiff.hasDiff ? '<div class="diff"><strong>URL:</strong> Differences detected</div>' : '<div class="same"><strong>URL:</strong> Identical</div>'}
  ${keyDiff.hasDiff ? '<div class="diff"><strong>Anon Key:</strong> Differences detected</div>' : '<div class="same"><strong>Anon Key:</strong> Identical</div>'}
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Overall Status:</strong> ${!urlDiff.hasDiff && !keyDiff.hasDiff ? 'Configurations are identical' : 'Configurations have differences'}</p>
  </div>
</body>
</html>`;
      filename = `config-comparison-${Date.now()}.html`;
      mimeType = 'text/html';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTestResult({ success: true, message: `Comparison report downloaded as ${format.toUpperCase()}!` });
  };





  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase Configuration</CardTitle>
          <CardDescription>Manage your Supabase connection credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">Supabase URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>

          <div>
            <Label htmlFor="anonKey">Supabase Anon Key</Label>
            <div className="relative">
              <Input
                id="anonKey"
                type={showKey ? 'text' : 'password'}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Label htmlFor="envFile" className="mb-2 block">Import .env File</Label>
            <div className="flex gap-2">
              <Input
                id="envFile"
                type="file"
                accept=".env"
                onChange={importEnvFile}
                className="cursor-pointer"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('envFile')?.click()}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a .env file containing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveCredentials}>Save Credentials</Button>
            <Button onClick={testConnection} variant="outline" disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Connection
            </Button>
            <Button onClick={exportEnvFile} variant="secondary" disabled={!url || !anonKey}>
              <Download className="h-4 w-4 mr-2" />
              Export .env File
            </Button>
          </div>



          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {credentialHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Credential History</CardTitle>
                <CardDescription>Previously saved Supabase configurations (last 10)</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-2"
              >
                {selectedConfigs.size === credentialHistory.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedConfigs.size === credentialHistory.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Bar */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by label or URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedLabelFilter} onValueChange={setSelectedLabelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    <SelectItem value="unlabeled">Unlabeled</SelectItem>
                    {getUniqueLabels().map(label => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortField} onValueChange={(v) => setSortField(v as 'date' | 'label' | 'url')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortDirection}
                  title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>

                {(searchTerm || selectedLabelFilter !== 'all' || dateRangeFilter !== 'all' || sortField !== 'date' || sortDirection !== 'desc') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {getFilteredAndSortedHistory().length !== credentialHistory.length && (
                <div className="text-sm text-muted-foreground">
                  Showing {getFilteredAndSortedHistory().length} of {credentialHistory.length} configurations
                </div>
              )}
            </div>

            {selectedConfigs.size > 0 && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{selectedConfigs.size} selected</Badge>
                  <span className="text-sm text-muted-foreground">
                    Bulk actions available
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkLabelAssign}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Assign Label
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {getFilteredAndSortedHistory().map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedConfigs.has(entry.id)}
                    onCheckedChange={() => toggleSelectConfig(entry.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {entry.label && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.label}
                        </Badge>
                      )}
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-mono truncate text-foreground">
                      {entry.url}
                    </p>
                    <p className="text-xs font-mono truncate text-muted-foreground mt-1">
                      {entry.anonKey.substring(0, 40)}...
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(entry)}
                      title="Edit label"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchToConfiguration(entry)}
                      title="Load this configuration"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteHistoryEntry(entry.id)}
                      title="Delete this entry"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      )}

      <EditConfigLabelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLabel}
        currentLabel={editingConfig?.label || ''}
        configUrl={editingConfig?.url || ''}
      />

      <EditConfigLabelModal
        isOpen={isBulkLabelModalOpen}
        onClose={() => setIsBulkLabelModalOpen(false)}
        onSave={handleSaveBulkLabel}
        currentLabel=""
        configUrl={`${selectedConfigs.size} configurations`}
      />


      {credentialHistory.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuration Comparison</CardTitle>
                <CardDescription>Compare two saved configurations side-by-side</CardDescription>
              </div>
              <Button
                variant={compareMode ? "default" : "outline"}
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (!compareMode) {
                    setCompareConfig1('');
                    setCompareConfig2('');
                  }
                }}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {compareMode ? 'Hide Comparison' : 'Compare Configs'}
              </Button>
            </div>
          </CardHeader>
          {compareMode && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Configuration 1</Label>
                  <Select value={compareConfig1} onValueChange={setCompareConfig1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first config" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentialHistory.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Configuration 2</Label>
                  <Select value={compareConfig2} onValueChange={setCompareConfig2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select second config" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentialHistory.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {compareConfig1 && compareConfig2 && (() => {
                const comparison = getComparisonData();
                if (!comparison) return null;

                return (
                  <div className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-3">Supabase URL</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Configuration 1</p>
                          <p className="text-sm font-mono break-all">
                            {comparison.config1.url}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Configuration 2</p>
                          <p className="text-sm font-mono break-all">
                            {comparison.config2.url}
                          </p>
                        </div>
                      </div>
                      {comparison.urlDiff.hasDiff && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <span className="font-semibold">Differences detected in URL</span>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Supabase Anon Key</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Configuration 1</p>
                          <p className="text-xs font-mono break-all">
                            {comparison.config1.anonKey}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Configuration 2</p>
                          <p className="text-xs font-mono break-all">
                            {comparison.config2.anonKey}
                          </p>
                        </div>
                      </div>
                      {comparison.keyDiff.hasDiff && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <span className="font-semibold">Differences detected in Anon Key</span>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {!comparison.urlDiff.hasDiff && !comparison.keyDiff.hasDiff && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          These configurations are identical.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end mt-6 pt-4 border-t">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default">
                            <FileDown className="h-4 w-4 mr-2" />
                            Download Comparison Report
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportComparisonReport('text')}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Download as Text (.txt)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportComparisonReport('json')}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Download as JSON (.json)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportComparisonReport('html')}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Download as HTML (.html)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                  </div>
                );
              })()}
            </CardContent>
          )}
        </Card>
      )}




      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Set Management</CardTitle>
          <CardDescription>Import or export all configurations with labels as JSON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportConfigSet} variant="default" disabled={credentialHistory.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export All Configurations
            </Button>
            <div className="flex gap-2">
              <Input
                id="configSetFile"
                type="file"
                accept=".json"
                onChange={importConfigSet}
                className="cursor-pointer max-w-xs"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('configSetFile')?.click()}
                className="shrink-0"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import Configuration Set
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Export all configurations to backup or share. Import to restore or merge configurations.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Key Rotation Analytics</CardTitle>
          <CardDescription>View comprehensive analytics for API key rotation patterns and compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <APIKeyRotationAnalytics />
        </CardContent>
      </Card>

      <ProfileManager onProfileApplied={(profile) => {
        setTestResult({ success: true, message: `Profile "${profile.name}" applied successfully!` });
      }} />

      <Card>

        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Clear local storage and reset application data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={clearStorage} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Local Data
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
