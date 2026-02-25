import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PasswordResetStats } from "@/components/PasswordResetStats";
import { ResetAttemptsChart } from "@/components/ResetAttemptsChart";
import { IPBlocklistManager } from "@/components/IPBlocklistManager";
import { SuspiciousActivityAlerts } from "@/components/SuspiciousActivityAlerts";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";
import { BackupCodesModal } from "@/components/BackupCodesModal";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAdminCheck } from "@/hooks/useAdminCheck";



export default function PasswordResetAdmin() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [stats, setStats] = useState({ totalAttempts: 0, blockedAttempts: 0, uniqueEmails: 0, blockedIPs: 0 });
  const [chartData, setChartData] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [has2FA, setHas2FA] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { toast } = useToast();


  // Check 2FA status
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.rpc('admin_has_required_2fa', {
          check_user_id: user.id
        });

        if (error) throw error;

        // If admin doesn't have 2FA, show setup
        if (!data) {
          setHas2FA(false);
          setShow2FASetup(true);
        } else {
          setHas2FA(true);
          // Show verification modal
          setShow2FAVerify(true);
        }
      } catch (err) {
        console.error('Failed to check 2FA status:', err);
      } finally {
        setChecking2FA(false);
      }
    };

    if (isAdmin && !adminLoading) {
      check2FAStatus();
    }
  }, [isAdmin, adminLoading]);

  // Redirect non-admin users
  if (!adminLoading && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  // Show loading while checking admin status or 2FA
  if (adminLoading || checking2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Show 2FA setup if required
  if (!has2FA && show2FASetup) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            <TwoFactorSetup
              isRequired={true}
              onComplete={async () => {
                // Generate backup codes
                const codes = Array.from({ length: 10 }, () =>
                  Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
                );
                setBackupCodes(codes);
                setHas2FA(true);
                setShow2FASetup(false);
                setShowBackupCodes(true);
              }}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show 2FA verification if not yet verified
  if (has2FA && !is2FAVerified) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Waiting for 2FA verification...</p>
          </div>
        </div>
        <TwoFactorVerification
          open={show2FAVerify}
          onVerified={() => {
            setIs2FAVerified(true);
            setShow2FAVerify(false);
            toast({ title: "Success", description: "2FA verified successfully" });
          }}
          onCancel={() => {
            window.location.href = '/';
          }}
        />
      </>
    );
  }


  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const { data: attempts } = await supabase
        .from('password_reset_attempts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: blocked } = await supabase
        .from('password_reset_ip_blocklist')
        .select('*')
        .gte('expires_at', new Date().toISOString());

      // Fetch analytics
      const { data: analytics } = await supabase
        .from('password_reset_analytics')
        .select('*')
        .order('time_bucket', { ascending: true });

      // Fetch suspicious patterns
      const { data: suspiciousPatterns } = await supabase.rpc('get_suspicious_reset_patterns');

      setStats({
        totalAttempts: attempts?.length || 0,
        blockedAttempts: attempts?.filter(a => a.blocked).length || 0,
        uniqueEmails: new Set(attempts?.map(a => a.email)).size || 0,
        blockedIPs: blocked?.length || 0
      });

      setChartData(analytics?.map(a => ({
        time: new Date(a.time_bucket).toLocaleTimeString(),
        attempts: a.attempt_count,
        blocked: a.blocked_count
      })) || []);

      setBlockedIPs(blocked || []);
      setPatterns(suspiciousPatterns || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Password Reset Security Dashboard</h1>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            <PasswordResetStats {...stats} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ResetAttemptsChart data={chartData} />
              <SuspiciousActivityAlerts patterns={patterns} />
            </div>
            <IPBlocklistManager blockedIPs={blockedIPs} onUpdate={fetchData} />
          </div>
        </main>
        <Footer />
      </div>

      <BackupCodesModal
        open={showBackupCodes}
        onOpenChange={(open) => {
          setShowBackupCodes(open);
          if (!open && backupCodes.length > 0) {
            // Reload to show dashboard
            window.location.reload();
          }
        }}
        codes={backupCodes}
      />
    </>
  );
}