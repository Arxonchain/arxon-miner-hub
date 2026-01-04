import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastAutoXSyncUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check for existing session FIRST for faster initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto-sync X rewards/boosts on login (non-blocking, fire-and-forget)
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    if (lastAutoXSyncUserId.current === userId) return;
    lastAutoXSyncUserId.current = userId;

    // Fire-and-forget: don't await, don't block UI
    (async () => {
      try {
        const { data: xProfile } = await supabase
          .from('x_profiles')
          .select('username, profile_url, last_scanned_at, historical_scanned')
          .eq('user_id', userId)
          .maybeSingle();

        if (!xProfile?.username) return;

        const last = xProfile.last_scanned_at ? new Date(xProfile.last_scanned_at).getTime() : 0;
        const shouldRefresh = !last || Date.now() - last > 60 * 60 * 1000; // 1h throttle
        if (!shouldRefresh) return;

        // Don't await - let this run in background
        supabase.functions.invoke('scan-x-profile', {
          body: {
            username: xProfile.username,
            profileUrl: xProfile.profile_url,
            isInitialConnect: false,
            forceHistorical: !xProfile.historical_scanned,
          },
        }).catch(() => {}); // Silently ignore failures
      } catch (e) {
        // Silently fail - don't block the app
      }
    })();
  }, [session?.user?.id]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error, user: data?.user ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
