import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/utils';
import { signUpWithFallback } from '@/lib/auth/signUpWithFallback';

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

    // Fail-safe: never block the whole app on a hung network request.
    // Reduced to 2.5s for faster fallback to landing page when backend is down.
    const failSafe = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    // Set up auth state listener BEFORE getSession() to avoid missing the initial session
    // on slower devices / flaky storage environments.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Handle PASSWORD_RECOVERY event - redirect to reset password page
       if (event === 'PASSWORD_RECOVERY') {
        // Session is established, user can now update password
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        window.clearTimeout(failSafe);
        
         // Navigate to reset password page if not already there.
         // Preserve URL params/hash because some recovery flows require them to establish the session.
         if (window.location.pathname !== '/reset-password') {
           const qs = window.location.search || '';
           const hash = window.location.hash || '';
           window.location.href = `/reset-password${qs}${hash}`;
         }
        return;
      }
      
      // Handle successful sign-in after password change
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
        window.clearTimeout(failSafe);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      window.clearTimeout(failSafe);
    });

    // Then fetch current session (fast path).
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        window.clearTimeout(failSafe);
      })
      .catch(() => {
        if (mounted) setLoading(false);
        window.clearTimeout(failSafe);
      });

    return () => {
      mounted = false;
      window.clearTimeout(failSafe);
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
    return signUpWithFallback(supabase, email, password);
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clear any stale/partial session (e.g. after password recovery flows)
      // to prevent "Invalid login credentials" on some devices.
      await supabase.auth.signOut().catch(() => {});

      // Also clear localStorage Supabase keys in case signOut didn't fully clear them
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* ignore storage errors */ }

      // Small delay to ensure signOut propagates
      await new Promise(r => setTimeout(r, 100));

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        20_000,
        'Connection timed out. The server may be busy - please try again.'
      );

      return { error: (error as unknown as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
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
