import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { RuntimeConfigProvider } from "@/contexts/RuntimeConfigContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { BulkSelectionProvider } from "@/contexts/BulkSelectionContext";

import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import SetupWizard from "@/components/SetupWizard";
import { hasValidCredentials } from "@/lib/supabase";



import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import SharedCollection from "./pages/SharedCollection";
import Analytics from "./pages/Analytics";
import Organization from "./pages/Organization";
import AuditLog from "./pages/AuditLog";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import PasswordResetAdmin from "./pages/PasswordResetAdmin";
import Forbidden from "./pages/Forbidden";
import Settings from "./pages/Settings";


import NotFound from "./pages/NotFound";










const queryClient = new QueryClient();

const App = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsConfigured(hasValidCredentials());
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return null;
  }

  if (!isConfigured) {
    return (
      <ThemeProvider defaultTheme="dark">
        <SetupWizard onComplete={() => setIsConfigured(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <RuntimeConfigProvider>
          <AuthProvider>

          <NotificationProvider>
            <FilterProvider>
              <BulkSelectionProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <SessionTimeoutWarning />

                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/collections" element={<Collections />} />
                      <Route path="/collections/:shareToken" element={<SharedCollection />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/organization" element={<Organization />} />
                      <Route path="/audit-log" element={<AuditLog />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/invite/:token" element={<AcceptInvitation />} />
                      <Route path="/admin/password-reset" element={<PasswordResetAdmin />} />
                      <Route path="/forbidden" element={<Forbidden />} />
                      <Route path="*" element={<NotFound />} />

                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </BulkSelectionProvider>
            </FilterProvider>
          </NotificationProvider>
          </AuthProvider>
        </RuntimeConfigProvider>
      </QueryClientProvider>

    </ThemeProvider>
  );
};



export default App;
