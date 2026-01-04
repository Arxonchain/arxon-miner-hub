import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/localCache';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
}

const POLL_MS = 10_000;

export const useLeaderboard = (limit: number = 50) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const cacheKey = `arxon:leaderboard:miners:v1:${limit}`;

  const fetchLeaderboard = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('user_id, username, avatar_url, total_points, daily_streak')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error || !mountedRef.current) return;

      const leaderboardWithRanks: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        user_id: entry.user_id,
        total_points: entry.total_points,
        daily_streak: entry.daily_streak,
        username: entry.username || `Miner${entry.user_id.slice(0, 4)}`,
        avatar_url: entry.avatar_url || undefined,
        rank: index + 1,
      }));

      setLeaderboard(leaderboardWithRanks);
      cacheSet(cacheKey, leaderboardWithRanks);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [cacheKey, limit]);

  useEffect(() => {
    mountedRef.current = true;

    const cached = cacheGet<LeaderboardEntry[]>(cacheKey, { maxAgeMs: 5 * 60_000 });
    if (cached?.data?.length) {
      setLeaderboard(cached.data);
      setLoading(false);
    } else {
      // Don't hard-block UI; we'll render quickly even if fresh fetch is in progress.
      setLoading(false);
    }

    void fetchLeaderboard();

    const interval = window.setInterval(() => {
      void fetchLeaderboard();
    }, POLL_MS);

    const onWake = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchLeaderboard();
    };

    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [cacheKey, fetchLeaderboard]);

  return { leaderboard, loading };
};

