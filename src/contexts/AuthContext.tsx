import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import SplashScreen from '@/components/SplashScreen';
import { nfcService } from '@/services/nfcService';
interface Profile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'driver' | 'developer' | 'finance' | 'canteen' | 'school_attendance' | 'bus_attendance' | 'supervisor';
  phone?: string;
  address?: string;
  email_confirmed?: boolean;
  expected_students_count?: number;
  registered_students_count?: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on very first app load (not on refresh or navigation)
    const hasShownInitialSplash = localStorage.getItem('hasShownInitialSplash');
    if (!hasShownInitialSplash) {
      localStorage.setItem('hasShownInitialSplash', 'true');
      return true;
    }
    return false;
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let splashTimer: NodeJS.Timeout | null = null;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        // Show splash ONLY on actual sign in event (not on page load with existing session)
        if (event === 'SIGNED_IN' && !loading) {
          setShowSplash(true);
          splashTimer = setTimeout(() => {
            setShowSplash(false);
          }, 1000); // 1 second
        }

        // Handle sign out (splash is handled in logout function)
        if (event === 'SIGNED_OUT') {
          window.location.href = '/auth';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        await fetchProfile(existingSession.user.id);
        // Parents go directly to dashboard - they can register students from there
      }
      
      setLoading(false);
    });

    // Handle initial splash screen (only if it's the very first load)
    if (showSplash) {
      splashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 1000); // 1 second
    }

    return () => {
      subscription.unsubscribe();
      if (splashTimer) clearTimeout(splashTimer);
    };
  }, []);

  const logout = async () => {
    try {
      // Check if this is a test account and reset data if needed
      const testEmails = [
        'admin@talebschool.com',
        'teacher@talebschool.com',
        'student@talebschool.com',
        'parent@talebschool.com',
        'driver@talebschool.com',
        'finance@talebschool.com'
      ];
      
      if (user?.email && testEmails.includes(user.email)) {
        console.log('Test account detected, resetting data...');
        try {
          const { error } = await supabase.functions.invoke('reset-test-account', {
            headers: {
              Authorization: `Bearer ${session?.access_token}`
            }
          });
          
          if (error) {
            console.error('Error resetting test account data:', error);
          } else {
            console.log('Test account data reset successfully');
          }
        } catch (resetError) {
          console.error('Failed to reset test account:', resetError);
        }
      }
      
      // Clear state FIRST so components unmount cleanly before splash
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear all storage
      localStorage.removeItem('developerViewRole');
      localStorage.removeItem('hasShownInitialSplash');
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset NFC service so next login can scan fresh
      nfcService.reset();
      
      // Sign out from Supabase (scope: local to avoid invalidating other devices)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (signOutError: any) {
        // Ignore errors - session might already be gone
        console.log('SignOut completed with note:', signOutError?.message);
      }
      
      toast.success('Logged out successfully');
      
      // Small delay then redirect (no splash blocking - allows immediate NFC re-login)
      setTimeout(() => {
        window.location.href = '/auth';
      }, 300);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear state and redirect anyway
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.clear();
      sessionStorage.clear();
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 300);
    }
  };

  const value = {
    user,
    session,
    profile,
    isAuthenticated: !!session,
    loading,
    logout,
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};