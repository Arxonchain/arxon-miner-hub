import { useEffect, useRef, useState } from 'react';
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

export const useYapperLeaderboard = () => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const cacheKey = `arxon:leaderboard:yappers:v1:100`;
    const cached = cacheGet<YapperEntry[]>(cacheKey, { maxAgeMs: 5 * 60_000 });
    if (cached?.data?.length) {
      setYappers(cached.data);
      setLoading(false);
    }

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('yapper_leaderboard_view')
          .select('user_id, username, avatar_url, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, social_points')
          .order('social_points', { ascending: false, nullsFirst: false })
          .limit(100);

        if (error || !mountedRef.current) return;

        if (!data || data.length === 0) {
          setYappers([]);
          setLoading(false);
          return;
        }

        const yappersWithData: YapperEntry[] = data.map((yapper) => ({
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

        setYappers(yappersWithData);
        cacheSet(cacheKey, yappersWithData);
      } catch (error) {
        console.error('Error fetching yapper leaderboard:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { yappers, loading };
};

