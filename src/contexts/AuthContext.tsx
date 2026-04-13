import React, { createContext, useContext, useEffect, useState } from 'react';
import { sendWelcomeEmail } from '@/lib/emailService';

type User = null;
type Session = null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth disabled: no external auth provider, so no session restoration.
    setSession(null);
    setUser(null);
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, fullName: string) => {
    // Auth disabled: stubbed success response.
    // Keep welcome email behavior non-blocking and safe.
    try {
      sendWelcomeEmail(email, fullName, 'free');
    } catch (_error) {
      // Silently fail - email is optional and should not block build/runtime.
      console.debug('Welcome email unavailable');
    }

    return { data: null, error: null };
  };

  const signIn = async (_email: string, _password: string, _rememberMe = false) => {
    // Auth disabled: stubbed success response.
    return { data: null, error: null };
  };

  const signOut = async () => {
    // Auth disabled: nothing to do.
    setSession(null);
    setUser(null);
  };

  const updateProfile = async (_profileData: any) => {
    // Auth disabled: no-op success response.
    return { data: null, error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
