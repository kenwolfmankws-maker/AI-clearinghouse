import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { NotificationCenter } from './NotificationCenter';
import RuntimeConfigIndicator from './RuntimeConfigIndicator';
import { User, LogOut, FolderOpen, BarChart3, Building2, FileText, Settings, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { ConfigProfile } from './ProfileManager';


interface CredentialHistory {
  id: string;
  url: string;
  anonKey: string;
  timestamp: number;
  label?: string;
}


export const Header = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [labeledConfigs, setLabeledConfigs] = useState<CredentialHistory[]>([]);
  const [profiles, setProfiles] = useState<ConfigProfile[]>([]);
  const navigate = useNavigate();


  // Load profiles and labeled configurations
  useEffect(() => {
    const loadData = () => {
      // Load profiles
      const storedProfiles = localStorage.getItem('config_profiles');
      if (storedProfiles) {
        try {
          setProfiles(JSON.parse(storedProfiles));
        } catch (error) {
          console.error('Failed to load profiles:', error);
        }
      }

      // Load labeled configurations
      const stored = localStorage.getItem('supabase_credential_history');
      if (stored) {
        try {
          const history: CredentialHistory[] = JSON.parse(stored);
          const labeled = history.filter(config => config.label);
          setLabeledConfigs(labeled);
        } catch (error) {
          console.error('Failed to load configurations:', error);
        }
      }
    };

    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('configsUpdated', handleStorageChange);
    window.addEventListener('profilesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configsUpdated', handleStorageChange);
      window.removeEventListener('profilesUpdated', handleStorageChange);
    };
  }, []);


  // Keyboard shortcuts for quick switching (profiles and configs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          // Prioritize profiles over configs
          if (profiles[num - 1]) {
            quickSwitchProfile(profiles[num - 1]);
          } else if (labeledConfigs[num - 1]) {
            quickSwitchConfig(labeledConfigs[num - 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profiles, labeledConfigs]);


  const quickSwitchProfile = (profile: ConfigProfile) => {
    localStorage.setItem('supabase_credentials', JSON.stringify(profile.supabase));
    localStorage.setItem('active_profile_id', profile.id);
    alert(`Switched to "${profile.name}" profile. Page will reload to apply changes.`);
    window.location.reload();
  };

  const quickSwitchConfig = (config: CredentialHistory) => {
    localStorage.setItem('supabase_credentials', JSON.stringify({ 
      url: config.url, 
      anonKey: config.anonKey 
    }));
    alert(`Switched to "${config.label}" configuration. Page will reload to apply changes.`);
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };



  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <span className="text-2xl font-bold text-white">AI Clearinghouse</span>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <RuntimeConfigIndicator />
                <NotificationCenter />

                {/* Quick Switch Dropdown */}
                {(profiles.length > 0 || labeledConfigs.length > 0) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-slate-300 hover:text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Quick Switch
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {profiles.length + labeledConfigs.length}
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      {profiles.length > 0 && (
                        <>
                          <DropdownMenuLabel>Profiles</DropdownMenuLabel>
                          {profiles.slice(0, 9).map((profile, index) => (
                            <DropdownMenuItem 
                              key={profile.id}
                              onClick={() => quickSwitchProfile(profile)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">{profile.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {profile.description || profile.supabase.url}
                                  </span>
                                </div>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Ctrl+{index + 1}
                                </Badge>
                              </div>
                            </DropdownMenuItem>
                          ))}
                          {profiles.length > 9 && (
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                              +{profiles.length - 9} more in Settings
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {labeledConfigs.length > 0 && profiles.length > 0 && <DropdownMenuSeparator />}
                      {labeledConfigs.length > 0 && profiles.length === 0 && (
                        <>
                          <DropdownMenuLabel>Configurations</DropdownMenuLabel>
                          {labeledConfigs.slice(0, 9).map((config, index) => (
                            <DropdownMenuItem 
                              key={config.id}
                              onClick={() => quickSwitchConfig(config)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">{config.label}</span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {config.url}
                                  </span>
                                </div>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Ctrl+{index + 1}
                                </Badge>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                
                <Button variant="ghost" onClick={() => navigate('/analytics')} className="text-slate-300 hover:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="ghost" onClick={() => navigate('/collections')} className="text-slate-300 hover:text-white">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Collections
                </Button>
                <Button variant="ghost" onClick={() => navigate('/organization')} className="text-slate-300 hover:text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  Organization
                </Button>
                <Button variant="ghost" onClick={() => navigate('/audit-log')} className="text-slate-300 hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Audit Log
                </Button>


                <Button variant="ghost" onClick={() => navigate('/profile')} className="text-slate-300 hover:text-white">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" onClick={() => navigate('/settings')} className="text-slate-300 hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="text-slate-300 hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>

              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-blue-500 to-purple-600">
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
