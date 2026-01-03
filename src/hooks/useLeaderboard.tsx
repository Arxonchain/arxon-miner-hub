import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
  created_at?: string;
  period_mining: number;
  period_tasks: number;
  period_social: number;
  period_referral: number;
  period_total: number;
}

export type TimeFilter = 'all' | 'month' | 'week' | '7days' | 'day';

interface LeaderboardTotals {
  totalPoints: number;
  totalMiners: number;
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export const useLeaderboard = (limit: number = 100, timeFilter: TimeFilter = 'all') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<LeaderboardTotals>({ totalPoints: 0, totalMiners: 0 });
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = useCallback(async (skipCache = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    const cacheKey = `leaderboard-${timeFilter}-${limit}`;
    
    // Check cache first
    if (!skipCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setLeaderboard(cached.data.leaderboard);
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

      // Single query for user_points with all data
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, total_points, daily_streak, created_at, mining_points, task_points, social_points, referral_points')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        setTotals({ totalPoints: 0, totalMiners: 0 });
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const userIds = pointsData.map(p => p.user_id);

      // Parallel queries for period data and profiles
      let profiles: any[] = [];
      let miningSessions: any[] = [];
      let completedTasks: any[] = [];
      let socialSubmissions: any[] = [];
      let referrals: any[] = [];

      if (startDate) {
        const startDateStr = startDate.toISOString();
        const [profilesRes, miningRes, tasksRes, socialRes, referralsRes] = await Promise.all([
          supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
          supabase.from('mining_sessions').select('user_id, arx_mined').in('user_id', userIds).gte('started_at', startDateStr),
          supabase.from('user_tasks').select('user_id, points_awarded').in('user_id', userIds).eq('status', 'completed').gt('points_awarded', 0).gte('completed_at', startDateStr),
          supabase.from('social_submissions').select('user_id, points_awarded').in('user_id', userIds).eq('status', 'approved').gt('points_awarded', 0).gte('created_at', startDateStr),
          supabase.from('referrals').select('referrer_id, points_awarded').in('referrer_id', userIds).gt('points_awarded', 0).gte('created_at', startDateStr)
        ]);
        
        profiles = profilesRes?.data || [];
        miningSessions = miningRes?.data || [];
        completedTasks = tasksRes?.data || [];
        socialSubmissions = socialRes?.data || [];
        referrals = referralsRes?.data || [];
      } else {
        const profilesRes = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds);
        profiles = profilesRes?.data || [];
      }

      // Build period stats if we have period data
      const periodStats = new Map<string, { mining: number; tasks: number; social: number; referral: number }>();
      
      miningSessions.forEach((s: any) => {
        const current = periodStats.get(s.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.mining += Number(s.arx_mined || 0);
        periodStats.set(s.user_id, current);
      });

      completedTasks.forEach((t: any) => {
        const current = periodStats.get(t.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.tasks += Number(t.points_awarded || 0);
        periodStats.set(t.user_id, current);
      });

      socialSubmissions.forEach((s: any) => {
        const current = periodStats.get(s.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.social += Number(s.points_awarded || 0);
        periodStats.set(s.user_id, current);
      });

      referrals.forEach((r: any) => {
        const current = periodStats.get(r.referrer_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.referral += Number(r.points_awarded || 0);
        periodStats.set(r.referrer_id, current);
      });

      // Combine data efficiently
      const leaderboardWithRanks = pointsData.map((entry, index) => {
        const profile = profiles.find((p: any) => p.user_id === entry.user_id);
        const stats = periodStats.get(entry.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        
        const isAllTime = timeFilter === 'all';
        const period_mining = isAllTime ? Number(entry.mining_points || 0) : stats.mining;
        const period_tasks = isAllTime ? Number(entry.task_points || 0) : stats.tasks;
        const period_social = isAllTime ? Number(entry.social_points || 0) : stats.social;
        const period_referral = isAllTime ? Number(entry.referral_points || 0) : stats.referral;

        return {
          ...entry,
          username: profile?.username || `Miner${entry.user_id.slice(0, 4)}`,
          avatar_url: profile?.avatar_url || undefined,
          rank: index + 1,
          period_mining: Math.round(period_mining),
          period_tasks: Math.round(period_tasks),
          period_social: Math.round(period_social),
          period_referral: Math.round(period_referral),
          period_total: Math.round(period_mining + period_tasks + period_social + period_referral),
        };
      });

      const totalPoints = leaderboardWithRanks.reduce((sum, p) => sum + p.period_total, 0);
      const newTotals = { totalPoints, totalMiners: leaderboardWithRanks.length };
      
      // Cache the result
      cache.set(cacheKey, {
        data: { leaderboard: leaderboardWithRanks, totals: newTotals },
        timestamp: Date.now()
      });

      setLeaderboard(leaderboardWithRanks);
      setTotals(newTotals);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [limit, timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Debounced real-time updates - only refresh every 10 seconds max
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_points' },
        () => {
          // Debounce: wait 10 seconds before refetching
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            fetchLeaderboard(true);
          }, 10000);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return { leaderboard, totals, loading, refreshLeaderboard: () => fetchLeaderboard(true) };
};
