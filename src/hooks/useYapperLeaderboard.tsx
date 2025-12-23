import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface YapperEntry {
  id: string;
  username: string;
  boost_percentage: number;
  qualified_posts_today: number;
  average_engagement: number;
  viral_bonus: boolean;
  last_scanned_at: string | null;
}

export const useYapperLeaderboard = () => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('x_profiles')
        .select('id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, last_scanned_at')
        .order('boost_percentage', { ascending: false })
        .order('average_engagement', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching yapper leaderboard:', error);
        return;
      }

      setYappers(data || []);
    } catch (error) {
      console.error('Error fetching yapper leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    yappers,
    loading,
    refreshLeaderboard: fetchLeaderboard,
  };
};
