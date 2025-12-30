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
  historical_posts_count: number;
  historical_arx_p_total: number;
  historical_boost_total: number;
  // From user_points - actual ARX-P earned from social/X posts
  social_points: number;
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

      // Fetch x_profiles
      let xProfilesQuery = supabase
        .from('x_profiles')
        .select('id, user_id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, last_scanned_at, updated_at, historical_posts_count, historical_arx_p_total, historical_boost_total')
        .limit(50);

      if (startDate) {
        xProfilesQuery = xProfilesQuery.gte('updated_at', startDate.toISOString());
      }

      const { data: xProfiles, error: xError } = await xProfilesQuery;

      if (xError) {
        console.error('Error fetching x_profiles:', xError);
        return;
      }

      if (!xProfiles || xProfiles.length === 0) {
        setYappers([]);
        setLoading(false);
        return;
      }

      // Get user IDs from x_profiles
      const userIds = xProfiles.map(p => p.user_id);

      // Fetch user_points for social_points (actual ARX-P earned from X posts)
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, social_points')
        .in('user_id', userIds);

      if (pointsError) {
        console.error('Error fetching user_points:', pointsError);
      }

      // Fetch profiles for avatars
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine all data
      const yappersWithData = xProfiles.map(yapper => {
        const profile = profiles?.find(p => p.user_id === yapper.user_id);
        const points = userPoints?.find(p => p.user_id === yapper.user_id);
        
        // Use social_points as the primary ranking metric (actual earned ARX-P)
        // Fall back to historical_arx_p_total if social_points is 0
        const socialPoints = points?.social_points || 0;
        
        return {
          ...yapper,
          avatar_url: profile?.avatar_url || undefined,
          social_points: socialPoints,
        };
      });

      // Sort by social_points (ARX-P earned from X posts) descending
      yappersWithData.sort((a, b) => {
        // Primary sort by social_points
        if (b.social_points !== a.social_points) {
          return b.social_points - a.social_points;
        }
        // Secondary sort by historical_arx_p_total
        if (b.historical_arx_p_total !== a.historical_arx_p_total) {
          return b.historical_arx_p_total - a.historical_arx_p_total;
        }
        // Tertiary sort by boost_percentage
        return b.boost_percentage - a.boost_percentage;
      });

      setYappers(yappersWithData);
    } catch (error) {
      console.error('Error fetching yapper leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time subscription for auto-updates
  useEffect(() => {
    // Subscribe to x_profiles changes
    const xProfilesChannel = supabase
      .channel('yapper-leaderboard-x-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'x_profiles'
        },
        () => {
          console.log('x_profiles changed, refreshing leaderboard');
          fetchLeaderboard();
        }
      )
      .subscribe();

    // Subscribe to user_points changes (for social_points updates)
    const userPointsChannel = supabase
      .channel('yapper-leaderboard-user-points')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_points'
        },
        () => {
          console.log('user_points changed, refreshing leaderboard');
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xProfilesChannel);
      supabase.removeChannel(userPointsChannel);
    };
  }, [fetchLeaderboard]);

  return {
    yappers,
    loading,
    refreshLeaderboard: fetchLeaderboard,
  };
};
