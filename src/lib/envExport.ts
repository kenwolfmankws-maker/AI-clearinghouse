import { ConfigProfile } from '@/components/ProfileManager';

/**
 * Converts a configuration profile to .env file format
 */
export function profileToEnvFormat(profile: ConfigProfile): string {
  const lines: string[] = [];
  
  // Add header comment
  lines.push(`# Environment Variables for ${profile.name}`);
  if (profile.description) {
    lines.push(`# ${profile.description}`);
  }
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  // Supabase credentials
  if (profile.supabase.url || profile.supabase.anonKey) {
    lines.push('# Supabase Configuration');
    if (profile.supabase.url) {
      lines.push(`VITE_SUPABASE_URL=${profile.supabase.url}`);
    }
    if (profile.supabase.anonKey) {
      lines.push(`VITE_SUPABASE_ANON_KEY=${profile.supabase.anonKey}`);
    }
    lines.push('');
  }
  
  // API Keys
  if (Object.keys(profile.apiKeys).length > 0) {
    lines.push('# API Keys');
    Object.entries(profile.apiKeys).forEach(([key, value]) => {
      const envKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      lines.push(`VITE_${envKey}_API_KEY=${value}`);
    });
    lines.push('');
  }
  
  // Feature Flags
  if (Object.keys(profile.featureFlags).length > 0) {
    lines.push('# Feature Flags');
    Object.entries(profile.featureFlags).forEach(([key, value]) => {
      const envKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      lines.push(`VITE_FEATURE_${envKey}=${value.toString()}`);
    });
    lines.push('');
  }
  
  // Custom Variables
  if (Object.keys(profile.customVars).length > 0) {
    lines.push('# Custom Variables');
    Object.entries(profile.customVars).forEach(([key, value]) => {
      const envKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      lines.push(`VITE_${envKey}=${value}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download text as a file
 */
export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
