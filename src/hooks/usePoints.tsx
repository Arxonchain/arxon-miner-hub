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

  // Calculate rank with multiple fallback layers - NEVER fails
  // Priority: 1) Full calculation with tiebreaker, 2) Simple count, 3) Leaderboard position, 4) Cached value
  const calculateRank = useCallback(async (currentPoints: number, userCreatedAt?: string) => {
    if (!user) return;
    
    // Fallback to cached rank if points are invalid
    if (currentPoints === undefined || currentPoints === null) {
      const cached = cacheGet<number>(rankCacheKey(user.id));
      if (cached?.data && cached.data > 0) {
        setRank(cached.data);
      } else {
        setRank(1); // Default to rank 1 for new users with 0 points
      }
      return;
    }
    
    try {
      // Get user's created_at if not provided (with fallback)
      let createdAt = userCreatedAt;
      if (!createdAt) {
        const { data: userData } = await supabase
          .from('user_points')
          .select('created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        createdAt = userData?.created_at || new Date().toISOString();
      }

      // Primary method: Count users with strictly higher points
      const { count: higherCount, error: higherError } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', currentPoints);

      if (higherError) {
        console.error('Error counting higher points, trying fallback:', higherError);
        // Fallback: Use leaderboard_view to find position
        await calculateRankFromLeaderboard(currentPoints);
        return;
      }

      // Try to get tiebreaker count, but don't fail if it errors
      let tiedBeforeCount = 0;
      try {
        const { count, error: tiedError } = await supabase
          .from('user_points')
          .select('*', { count: 'exact', head: true })
          .eq('total_points', currentPoints)
          .lt('created_at', createdAt)
          .neq('user_id', user.id);

        if (!tiedError && count !== null) {
          tiedBeforeCount = count;
        }
      } catch {
        // Ignore tiebreaker errors - just use higher count
      }

      const userRank = Math.max(1, (higherCount || 0) + tiedBeforeCount + 1);
      setRank(userRank);
      cacheSet(rankCacheKey(user.id), userRank);
    } catch (error) {
      console.error('Error calculating rank, using fallback:', error);
      // Ultimate fallback: use cached or estimate from leaderboard
      await calculateRankFromLeaderboard(currentPoints);
    }
  }, [user]);

  // Fallback rank calculation using leaderboard_view
  const calculateRankFromLeaderboard = useCallback(async (currentPoints: number) => {
    if (!user) return;
    
    try {
      // Count how many users have more points in leaderboard_view
      const { count, error } = await supabase
        .from('leaderboard_view')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', currentPoints);

      if (!error && count !== null) {
        const userRank = Math.max(1, count + 1);
        setRank(userRank);
        cacheSet(rankCacheKey(user.id), userRank);
        return;
      }
    } catch {
      // Leaderboard fallback failed
    }

    // Final fallback: use cached value or default
    const cached = cacheGet<number>(rankCacheKey(user.id));
    if (cached?.data && cached.data > 0) {
      setRank(cached.data);
    } else {
      // If all else fails, estimate based on points (rough approximation)
      // Users with 0 points = rank based on total users, otherwise estimate
      const estimatedRank = currentPoints > 0 ? Math.max(1, Math.ceil(1000 / Math.max(1, currentPoints / 100))) : 1;
      setRank(Math.min(estimatedRank, 10000)); // Cap at reasonable number
      cacheSet(rankCacheKey(user.id), estimatedRank);
    }
  }, [user]);

  const fetchPoints = useCallback(async () => {
    if (!user) {
      setPoints(null);
      setRank(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch points first
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pointsError) throw pointsError;

      let nextPoints = pointsData as UserPoints | null;

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

      // Calculate rank based on actual total_points
      if (nextPoints?.total_points !== undefined) {
        await calculateRank(nextPoints.total_points);
      }
    } catch (error) {
      // Keep any cached/previous values; don't block UI
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateRank]);

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
      const cachedRank = cacheGet<number>(rankCacheKey(userId));

      if (cachedPoints?.data) {
        setPoints(cachedPoints.data);
        setLoading(false);
      }
      
      // Use cached rank as initial value to avoid showing null
      // Will be recalculated fresh after fetchPoints completes
      if (cachedRank?.data && cachedRank.data > 0) {
        setRank(cachedRank.data);
      }
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
            
            // Recalculate rank when points update in real-time
            if (next?.total_points !== undefined) {
              void calculateRank(next.total_points);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, calculateRank]);

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

