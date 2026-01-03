import { useState, useEffect, useCallback, useRef } from 'react';
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
  social_points: number;
  period_posts: number;
  period_engagement: number;
  period_arx_p: number;
}

interface YapperTotals {
  totalPosts: number;
  totalEngagement: number;
  totalArxP: number;
}

// Simple cache with TTL
const yapperCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export const useYapperLeaderboard = (timeFilter: TimeFilter = 'all') => {
  const [yappers, setYappers] = useState<YapperEntry[]>([]);
  const [totals, setTotals] = useState<YapperTotals>({ totalPosts: 0, totalEngagement: 0, totalArxP: 0 });
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = useCallback(async (skipCache = false) => {
    if (fetchingRef.current) return;
    
    const cacheKey = `yapper-${timeFilter}`;
    
    // Check cache
    if (!skipCache) {
      const cached = yapperCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setYappers(cached.data.yappers);
        setTotals(cached.data.totals);
        setLoading(false);
        return;
      }
    }

    fetchingRef.current = true;
    
    try {
      setLoading(true);
      
      // Calculate date range
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
        default:
          startDate = null;
      }

      // Single query for x_profiles
      const { data: xProfiles, error: xError } = await supabase
        .from('x_profiles')
        .select('id, user_id, username, boost_percentage, qualified_posts_today, average_engagement, viral_bonus, last_scanned_at, updated_at, historical_posts_count, historical_arx_p_total, historical_boost_total')
        .limit(50);

      if (xError) throw xError;

      if (!xProfiles || xProfiles.length === 0) {
        setYappers([]);
        setTotals({ totalPosts: 0, totalEngagement: 0, totalArxP: 0 });
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const userIds = xProfiles.map(p => p.user_id);

      // Parallel queries
      let rewards: any[] = [];
      let userPoints: any[] = [];
      let profiles: any[] = [];

      if (startDate) {
        const [pointsRes, profilesRes, rewardsRes] = await Promise.all([
          supabase.from('user_points').select('user_id, social_points').in('user_id', userIds),
          supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds),
          supabase.from('x_post_rewards').select('user_id, total_engagement, arx_p_reward').in('user_id', userIds).gte('tweet_created_at', startDate.toISOString())
        ]);
        userPoints = pointsRes?.data || [];
        profiles = profilesRes?.data || [];
        rewards = rewardsRes?.data || [];
      } else {
        const [pointsRes, profilesRes] = await Promise.all([
          supabase.from('user_points').select('user_id, social_points').in('user_id', userIds),
          supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds)
        ]);
        userPoints = pointsRes?.data || [];
        profiles = profilesRes?.data || [];
      }

      // Build period stats
      const userRewardStats = new Map<string, { posts: number; engagement: number; arxP: number }>();
      
      rewards.forEach((r: any) => {
        const current = userRewardStats.get(r.user_id) || { posts: 0, engagement: 0, arxP: 0 };
        current.posts += 1;
        current.engagement += Number(r.total_engagement || 0);
        current.arxP += Number(r.arx_p_reward || 0);
        userRewardStats.set(r.user_id, current);
      });

      // Calculate totals
      let globalPosts = 0, globalEngagement = 0, globalArxP = 0;
      userRewardStats.forEach(stats => {
        globalPosts += stats.posts;
        globalEngagement += stats.engagement;
        globalArxP += stats.arxP;
      });
      
      const newTotals = { totalPosts: globalPosts, totalEngagement: globalEngagement, totalArxP: globalArxP };

      // Combine data
      const yappersWithData = xProfiles.map(yapper => {
        const profile = profiles.find((p: any) => p.user_id === yapper.user_id);
        const points = userPoints.find((p: any) => p.user_id === yapper.user_id);
        const periodStats = userRewardStats.get(yapper.user_id) || { posts: 0, engagement: 0, arxP: 0 };
        
        const socialPoints = points?.social_points || 0;
        const isAllTime = timeFilter === 'all';
        
        return {
          ...yapper,
          avatar_url: profile?.avatar_url || undefined,
          social_points: socialPoints,
          period_posts: isAllTime ? yapper.historical_posts_count : periodStats.posts,
          period_engagement: Math.round(isAllTime ? (yapper.average_engagement * yapper.historical_posts_count) : periodStats.engagement),
          period_arx_p: isAllTime ? (socialPoints || yapper.historical_arx_p_total) : periodStats.arxP,
        };
      });

      // Sort efficiently
      yappersWithData.sort((a, b) => 
        b.social_points - a.social_points || 
        b.period_arx_p - a.period_arx_p || 
        b.boost_percentage - a.boost_percentage
      );

      // Cache result
      yapperCache.set(cacheKey, {
        data: { yappers: yappersWithData, totals: newTotals },
        timestamp: Date.now()
      });

      setYappers(yappersWithData);
      setTotals(newTotals);
    } catch (error) {
      console.error('Error fetching yapper leaderboard:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Single debounced subscription instead of multiple
  useEffect(() => {
    const channel = supabase
      .channel('yapper-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'x_profiles' },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchLeaderboard(true), 10000);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return {
    yappers,
    totals,
    loading,
    refreshLeaderboard: () => fetchLeaderboard(true),
  };
};
