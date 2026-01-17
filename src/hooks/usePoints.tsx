import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/localCache';
import { useAuth } from './useAuth';

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  daily_streak: number;
  last_checkin_date: string | null;
  mining_points: number;
  task_points: number;
  social_points: number;
  referral_points: number;
  referral_bonus_percentage: number; // Boost from referrals only
  x_post_boost_percentage: number; // Boost from X post submissions (social yapping)
}

type PointsContextType = {
  points: UserPoints | null;
  loading: boolean;
  rank: number | null;
  addPoints: (amount: number, type: 'mining' | 'task' | 'social' | 'referral', sessionId?: string) => Promise<void>;
  refreshPoints: () => Promise<void>;
  triggerConfetti: () => void;
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

const pointsCacheKey = (userId: string) => `arxon:points:v2:${userId}`;
const rankCacheKey = (userId: string) => `arxon:rank:v1:${userId}`;

export const PointsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  const hydratedUserIdRef = useRef<string | null>(null);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6B8CAE', '#8BA4C4', '#A0B8D4', '#C0D0E0'],
    });
  }, []);

  const fetchPoints = useCallback(async () => {
    if (!user) {
      setPoints(null);
      setRank(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch points and rank in parallel
      const [pointsResult, rankResult] = await Promise.all([
        supabase.from('user_points').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('leaderboard_view').select('user_id').order('total_points', { ascending: false }).limit(1000),
      ]);

      if (pointsResult.error) throw pointsResult.error;

      let nextPoints = pointsResult.data as UserPoints | null;

      if (!nextPoints) {
        // Ensure row exists (avoid unique race)
        const { error: ensureError } = await supabase
          .from('user_points')
          .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

        if (ensureError) throw ensureError;

        const { data: ensured, error: ensuredError } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (ensuredError) throw ensuredError;
        nextPoints = ensured as UserPoints | null;
      }

      setPoints(nextPoints);
      cacheSet(pointsCacheKey(user.id), nextPoints);

      if (rankResult.data) {
        const userRank = rankResult.data.findIndex((p) => p.user_id === user.id) + 1;
        const nextRank = userRank > 0 ? userRank : null;
        setRank(nextRank);
        cacheSet(rankCacheKey(user.id), nextRank);
      }
    } catch (error) {
      // Keep any cached/previous values; don't block UI
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addPoints = useCallback(
    async (amount: number, type: 'mining' | 'task' | 'social' | 'referral', sessionId?: string) => {
      if (!user) return;

      const safeAmount = Math.min(Math.max(Math.floor(amount), 0), 500);
      if (safeAmount <= 0) return;

      try {
        // Use the secure backend endpoint instead of direct RPC
        const { data, error } = await supabase.functions.invoke('award-points', {
          body: {
            type,
            amount: safeAmount,
            session_id: sessionId,
          },
        });

        if (error) {
          console.error('Error adding points via backend:', error);
          return;
        }

        if (data?.success && data?.userPoints) {
          const next = data.userPoints as UserPoints;
          setPoints(next);
          cacheSet(pointsCacheKey(user.id), next);
        }

        if (safeAmount >= 10) triggerConfetti();
      } catch (err) {
        console.error('Error adding points:', err);
      }
    },
    [triggerConfetti, user]
  );

  // Hydrate instantly from cache on login (so ARX-P shows immediately), then refresh in background
  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      hydratedUserIdRef.current = null;
      setPoints(null);
      setRank(null);
      setLoading(false);
      return;
    }

    if (hydratedUserIdRef.current !== userId) {
      hydratedUserIdRef.current = userId;

      const cachedPoints = cacheGet<UserPoints | null>(pointsCacheKey(userId));
      const cachedRank = cacheGet<number | null>(rankCacheKey(userId));

      if (cachedPoints) setPoints(cachedPoints.data);
      if (cachedRank) setRank(cachedRank.data);

      // If we have cached values, don't show loading spinners
      setLoading(!(cachedPoints || cachedRank));
    }

    // Always refresh in background
    void fetchPoints();
  }, [fetchPoints, user?.id]);

  // Single real-time subscription for user_points (consolidated via provider)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const next = payload.new as UserPoints;
            setPoints(next);
            cacheSet(pointsCacheKey(user.id), next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo<PointsContextType>(
    () => ({
      points,
      loading,
      rank,
      addPoints,
      refreshPoints: fetchPoints,
      triggerConfetti,
    }),
    [addPoints, fetchPoints, loading, points, rank, triggerConfetti]
  );

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

