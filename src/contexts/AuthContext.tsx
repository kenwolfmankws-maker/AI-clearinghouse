import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/emailService';


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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Auth session error:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();

  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      }
    });
    
    if (data.user && !error) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        email_verified: false,
      });
      
      // Send welcome email
      sendWelcomeEmail(email, fullName, 'free');
    }
    
    return { data, error };
  };




  const signIn = async (email: string, password: string, rememberMe = false) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.data.user && !result.error) {
      // Optional session tracking - non-blocking
      try {
        await supabase.from('sessions').insert({
          user_id: result.data.user.id,
          browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown',
          created_at: new Date().toISOString()
        }).select().single();
      } catch (error) {
        // Silently fail - session tracking is optional
        console.debug('Session tracking unavailable');
      }
    }
    
    return result;
  };



  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (profileData: any) => {
    if (!user) return { error: 'No user' };
    return await supabase.from('user_profiles').update(profileData).eq('id', user.id);
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
