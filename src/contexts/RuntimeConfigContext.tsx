import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { APIUsageTracker } from '@/lib/apiUsageTracker';

const RuntimeConfigContext = createContext<RuntimeConfigContextType | undefined>(undefined);

export interface RuntimeConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  apiKeys: Record<string, string>;
  featureFlags: Record<string, boolean>;
  customVars: Record<string, string>;
  profileName?: string;
  profileId?: string;
  autoSync: boolean;
}
interface RuntimeConfigContextType {
  config: RuntimeConfig;
  setConfig: (config: RuntimeConfig) => void;
  getApiKey: (provider: string, componentName?: string) => string | undefined;
  getFeatureFlag: (flag: string) => boolean;
  getCustomVar: (name: string) => string | undefined;
  setAutoSync: (enabled: boolean) => void;
  clearConfig: () => void;
}


const defaultConfig: RuntimeConfig = {
  supabase: { url: '', anonKey: '' },
  apiKeys: {},
  featureFlags: {},
  customVars: {},
  autoSync: true,
};
export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<RuntimeConfig>(() => {
    const stored = localStorage.getItem('runtime_config');
    return stored ? JSON.parse(stored) : defaultConfig;
  });

  // Listen for profile application events
  useEffect(() => {
    const handleApplyProfile = (event: CustomEvent) => {
      const profile = event.detail;
      if (config.autoSync) {
        const newConfig: RuntimeConfig = {
          supabase: profile.supabase,
          apiKeys: profile.apiKeys,
          featureFlags: profile.featureFlags,
          customVars: profile.customVars,
          profileName: profile.name,
          profileId: profile.id,
          autoSync: config.autoSync,
        };
        setConfigState(newConfig);
      }
    };

    window.addEventListener('applyProfile', handleApplyProfile as EventListener);
    return () => window.removeEventListener('applyProfile', handleApplyProfile as EventListener);
  }, [config.autoSync]);

  useEffect(() => {
    localStorage.setItem('runtime_config', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('runtimeConfigChanged', { detail: config }));
  }, [config]);


  const setConfig = (newConfig: RuntimeConfig) => {
    setConfigState(newConfig);
  };

  const getApiKey = (provider: string, componentName?: string) => {
    const key = config.apiKeys[provider];
    if (key && componentName) {
      APIUsageTracker.trackAccess(provider, componentName);
    }
    return key;
  };

  const getFeatureFlag = (flag: string) => config.featureFlags[flag] ?? false;
  const getCustomVar = (name: string) => config.customVars[name];


  const setAutoSync = (enabled: boolean) => {
    setConfigState(prev => ({ ...prev, autoSync: enabled }));
  };

  const clearConfig = () => {
    setConfigState(defaultConfig);
    localStorage.removeItem('runtime_config');
  };

  return (
    <RuntimeConfigContext.Provider value={{ config, setConfig, getApiKey, getFeatureFlag, getCustomVar, setAutoSync, clearConfig }}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const context = useContext(RuntimeConfigContext);
  if (!context) throw new Error('useRuntimeConfig must be used within RuntimeConfigProvider');
  return context;
}
