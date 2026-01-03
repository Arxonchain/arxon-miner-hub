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
        // Simple single query for x_profiles
        const { data: xProfiles, error: xError } = await supabase
          .from('x_profiles')
          .select('id, user_id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus')
          .limit(50);

        if (xError || !mountedRef.current) return;

        if (!xProfiles || xProfiles.length === 0) {
          setYappers([]);
          setLoading(false);
          return;
        }

        const userIds = xProfiles.map(p => p.user_id);

        // Single parallel query
        const [pointsRes, profilesRes] = await Promise.all([
          supabase.from('user_points').select('user_id, social_points').in('user_id', userIds),
          supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds)
        ]);

        if (!mountedRef.current) return;

        const pointsMap = new Map((pointsRes.data || []).map(p => [p.user_id, p.social_points]));
        const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.avatar_url]));

        const yappersWithData = xProfiles.map(yapper => ({
          ...yapper,
          avatar_url: profileMap.get(yapper.user_id) || undefined,
          social_points: pointsMap.get(yapper.user_id) || 0,
        }));

        // Sort by social points
        yappersWithData.sort((a, b) => b.social_points - a.social_points);

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
