import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/localCache';

interface YapperEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  boost_percentage: number;
  qualified_posts_today: number;
  average_engagement: number;
  viral_bonus: boolean;
  social_points: number;
}

const POLL_MS = 10_000;
const LIMIT = 100;

export const useYapperLeaderboard = () => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const cacheKey = `arxon:leaderboard:yappers:v1:${LIMIT}`;

  const fetchLeaderboard = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const { data, error } = await supabase
        .from('yapper_leaderboard_view')
        .select(
          'user_id, username, avatar_url, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, social_points'
        )
        .order('social_points', { ascending: false, nullsFirst: false })
        .limit(LIMIT);

      if (error || !mountedRef.current) return;

      const next: YapperEntry[] = (data || []).map((yapper) => ({
        id: yapper.user_id,
        user_id: yapper.user_id,
        username: yapper.username || `Yapper${yapper.user_id.slice(0, 4)}`,
        avatar_url: yapper.avatar_url || undefined,
        boost_percentage: yapper.boost_percentage || 0,
        qualified_posts_today: yapper.qualified_posts_today || 0,
        average_engagement: yapper.average_engagement || 0,
        viral_bonus: yapper.viral_bonus || false,
        social_points: yapper.social_points || 0,
      }));

      setYappers(next);
      cacheSet(cacheKey, next);
    } catch (error) {
      console.error('Error fetching yapper leaderboard:', error);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    mountedRef.current = true;

    const cached = cacheGet<YapperEntry[]>(cacheKey, { maxAgeMs: 5 * 60_000 });
    if (cached?.data?.length) {
      setYappers(cached.data);
      setLoading(false);
    } else {
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

  return { yappers, loading };
};

