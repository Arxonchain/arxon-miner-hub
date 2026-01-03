import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

    const fetchLeaderboard = async () => {
      try {
        // Use secure yapper leaderboard view that only exposes minimal data
        const { data, error } = await supabase
          .from('yapper_leaderboard_view')
          .select('user_id, username, avatar_url, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, social_points')
          .limit(50);

        if (error || !mountedRef.current) return;

        if (!data || data.length === 0) {
          setYappers([]);
          setLoading(false);
          return;
        }

        const yappersWithData = data.map(yapper => ({
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
