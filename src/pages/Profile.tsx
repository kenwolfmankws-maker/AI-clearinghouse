import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

import { Heart, Activity, Settings, Save, Loader2 } from 'lucide-react';
import { allModels } from '@/data/allModels';

// Keep imports to avoid unrelated refactors; sections that depend on backend are disabled.
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ApiDocumentation } from '@/components/ApiDocumentation';
import { RateLimitStatus } from '@/components/RateLimitStatus';
import { PaymentHistory } from '@/components/PaymentHistory';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { TwoFactorManagement } from '@/components/TwoFactorManagement';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { SessionManagement } from '@/components/SessionManagement';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth/DB removed: profile data cannot be loaded from Supabase.
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [apiKeys] = useState<any[]>([]);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // With auth disabled, user will typically be null; but keep this guard as-is.
    // Backend removed: no data to load.
    setProfile(null);
    setFavorites([]);
    setFullName('');
    setPageLoading(false);

    // Stripe query param handling intentionally removed (was unused here: useSearchParams not needed)
    // to keep this page deterministic without backend coupling.
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Auth disabled: updateProfile is a stub and should succeed.
    const { error } = await updateProfile({ full_name: fullName, updated_at: new Date().toISOString() });

    if (error) {
      toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
    } else {
      toast({
        title: 'Disabled',
        description: 'Profile updates are disabled because authentication/database integration was removed.',
      });
      setProfile(null);
    }

    setLoading(false);
  };

  const favoriteModels = allModels.filter((m) => favorites.some((f) => f.model_id === m.id));

  // Provide safe defaults for UI.
  const api_calls_count = 0;
  const api_calls_limit = 1000;
  const apiUsagePercent = (api_calls_count / api_calls_limit) * 100;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-white mb-8">My Profile</h1>

        <div className="mb-6">
          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-2">Profile Disabled</h2>
            <p className="text-slate-400">
              Authentication and database features were removed, so profile features (favorites, API keys, billing,
              analytics, notifications, sessions, and 2FA) are currently unavailable.
            </p>
          </Card>
        </div>

        {/* Email Verification Banner (disabled) */}
        <div className="mb-6">
          <EmailVerificationBanner isVerified={false} userEmail={user?.email || ''} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">API Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{api_calls_count}</p>
            <p className="text-slate-400 text-sm mb-3">of {api_calls_limit} calls</p>
            <Progress value={apiUsagePercent} className="h-2" />
          </Card>

          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-pink-400" />
              <h3 className="text-lg font-semibold text-white">Favorites</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{favorites.length}</p>
            <p className="text-slate-400 text-sm">AI models saved</p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Account</h3>
            </div>
            <p className="text-slate-300 text-sm mb-1">{user?.email || '—'}</p>
            <p className="text-slate-400 text-xs">Member since —</p>
          </Card>
        </div>

        {/* Backend-dependent sections kept but effectively disabled by missing auth/backend */}
        <div className="mb-6">
          <RateLimitStatus userId={user?.id || ''} />
        </div>

        <div className="mb-6">
          <ApiKeyManager userId={user?.id || ''} />
        </div>

        <div className="mb-6">
          <ApiDocumentation />
        </div>

        <div className="mb-6">
          <PaymentHistory userId={user?.id || ''} />
        </div>

        <div className="mb-6">
          <AnalyticsDashboard />
        </div>

        <div className="mb-6">
          <NotificationPreferences />
        </div>

        <div className="mb-6">
          <TwoFactorManagement />
        </div>

        <div className="mb-6">
          <SessionManagement />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Account Settings</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input value={user?.email || ''} disabled className="bg-slate-800 border-slate-700 text-slate-400" />
              </div>
              <div>
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Favorite Models</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {favoriteModels.length === 0 ? (
                <p className="text-slate-400">No favorites yet. Start exploring AI models!</p>
              ) : (
                favoriteModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">{model.name}</p>
                      <p className="text-slate-400 text-sm">{model.provider}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/')}>
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
