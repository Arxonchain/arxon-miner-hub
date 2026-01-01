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
  // Per-user period stats
  period_posts: number;
  period_engagement: number;
  period_arx_p: number;
}

interface YapperTotals {
  totalPosts: number;
  totalEngagement: number;
  totalArxP: number;
}

export const useYapperLeaderboard = (timeFilter: TimeFilter = 'all') => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [totals, setTotals] = useState<YapperTotals>({ totalPosts: 0, totalEngagement: 0, totalArxP: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on filter
      let startDate: Date | null = null;
      const now = new Date();
      
      switch (timeFilter) {
        case 'day':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          break;
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

      // Fetch ALL x_profiles (no time filter on profiles themselves)
      const { data: xProfiles, error: xError } = await supabase
        .from('x_profiles')
        .select('id, user_id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, last_scanned_at, updated_at, historical_posts_count, historical_arx_p_total, historical_boost_total')
        .limit(50);

      if (xError) {
        console.error('Error fetching x_profiles:', xError);
        return;
      }

      if (!xProfiles || xProfiles.length === 0) {
        setYappers([]);
        setTotals({ totalPosts: 0, totalEngagement: 0, totalArxP: 0 });
        setLoading(false);
        return;
      }

      const userIds = xProfiles.map(p => p.user_id);

      // Fetch x_post_rewards for per-user period stats
      let rewardsQuery = supabase
        .from('x_post_rewards')
        .select('user_id, total_engagement, arx_p_reward, tweet_created_at')
        .in('user_id', userIds);
      
      if (startDate) {
        rewardsQuery = rewardsQuery.gte('tweet_created_at', startDate.toISOString());
      }

      const { data: rewards } = await rewardsQuery;

      // Fetch approved social submissions for period stats (backup source)
      let submissionsQuery = supabase
        .from('social_submissions')
        .select('user_id, points_awarded, reviewed_at, created_at')
        .in('user_id', userIds)
        .eq('status', 'approved')
        .gt('points_awarded', 0);
      
      if (startDate) {
        submissionsQuery = submissionsQuery.gte('created_at', startDate.toISOString());
      }

      const { data: submissions } = await submissionsQuery;

      // Build per-user period stats maps
      const userRewardStats = new Map<string, { posts: number; engagement: number; arxP: number }>();
      
      // First from x_post_rewards
      (rewards || []).forEach((r: any) => {
        const current = userRewardStats.get(r.user_id) || { posts: 0, engagement: 0, arxP: 0 };
        current.posts += 1;
        current.engagement += Number(r.total_engagement || 0);
        current.arxP += Number(r.arx_p_reward || 0);
        userRewardStats.set(r.user_id, current);
      });

      // If no x_post_rewards, use social_submissions as backup
      (submissions || []).forEach((s: any) => {
        const existing = userRewardStats.get(s.user_id);
        if (!existing || existing.posts === 0) {
          const current = userRewardStats.get(s.user_id) || { posts: 0, engagement: 0, arxP: 0 };
          current.posts += 1;
          current.arxP += Number(s.points_awarded || 0);
          userRewardStats.set(s.user_id, current);
        }
      });

      // Calculate global totals
      let globalPosts = 0;
      let globalEngagement = 0;
      let globalArxP = 0;
      userRewardStats.forEach((stats) => {
        globalPosts += stats.posts;
        globalEngagement += stats.engagement;
        globalArxP += stats.arxP;
      });
      setTotals({ totalPosts: globalPosts, totalEngagement: globalEngagement, totalArxP: globalArxP });

      // Fetch user_points for social_points
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
        const periodStats = userRewardStats.get(yapper.user_id) || { posts: 0, engagement: 0, arxP: 0 };
        
        const socialPoints = points?.social_points || 0;
        
        // For "all time", use historical data if period stats are empty
        const isAllTime = timeFilter === 'all';
        const period_posts = isAllTime && periodStats.posts === 0 ? yapper.historical_posts_count : periodStats.posts;
        const period_engagement = isAllTime && periodStats.engagement === 0 ? (yapper.average_engagement * yapper.historical_posts_count) : periodStats.engagement;
        const period_arx_p = isAllTime && periodStats.arxP === 0 ? (socialPoints || yapper.historical_arx_p_total) : periodStats.arxP;
        
        return {
          ...yapper,
          avatar_url: profile?.avatar_url || undefined,
          social_points: socialPoints,
          period_posts,
          period_engagement: Math.round(period_engagement),
          period_arx_p,
        };
      });

      // Sort by social_points descending, then by period_arx_p
      yappersWithData.sort((a, b) => {
        if (b.social_points !== a.social_points) {
          return b.social_points - a.social_points;
        }
        if (b.period_arx_p !== a.period_arx_p) {
          return b.period_arx_p - a.period_arx_p;
        }
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
    const xProfilesChannel = supabase
      .channel('yapper-leaderboard-x-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'x_profiles' },
        () => fetchLeaderboard()
      )
      .subscribe();

    const userPointsChannel = supabase
      .channel('yapper-leaderboard-user-points')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_points' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xProfilesChannel);
      supabase.removeChannel(userPointsChannel);
    };
  }, [fetchLeaderboard]);

  return {
    yappers,
    totals,
    loading,
    refreshLeaderboard: fetchLeaderboard,
  };
};
