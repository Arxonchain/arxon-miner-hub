import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeFilter } from './useLeaderboard';

interface YapperEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  boost_percentage: number;
  qualified_posts_today: number;
  average_engagement: number;
  viral_bonus: boolean;
  last_scanned_at: string | null;
  updated_at?: string;
}

export const useYapperLeaderboard = (timeFilter: TimeFilter = 'all') => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on filter
      let startDate: Date | null = null;
      const now = new Date();
      
      switch (timeFilter) {
        case 'week':
        case '7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'all':
        default:
          startDate = null;
          break;
      }

      let query = supabase
        .from('x_profiles')
        .select('id, user_id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, last_scanned_at, updated_at')
        .order('boost_percentage', { ascending: false })
        .order('average_engagement', { ascending: false })
        .limit(50);

      if (startDate) {
        query = query.gte('updated_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching yapper leaderboard:', error);
        return;
      }

      if (!data || data.length === 0) {
        setYappers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for avatars
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);

      // Combine data
      const yappersWithAvatars = data.map(yapper => {
        const profile = profiles?.find(p => p.user_id === yapper.user_id);
        return {
          ...yapper,
          avatar_url: profile?.avatar_url || undefined,
        };
      });

      setYappers(yappersWithAvatars);
    } catch (error) {
      console.error('Error fetching yapper leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    yappers,
    loading,
    refreshLeaderboard: fetchLeaderboard,
  };
};
