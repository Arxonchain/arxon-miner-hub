import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
  created_at?: string;
  // Per-user period stats
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

export const useLeaderboard = (limit: number = 100, timeFilter: TimeFilter = 'all') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<LeaderboardTotals>({ totalPoints: 0, totalMiners: 0 });
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

      // Fetch ALL user_points (with full breakdown)
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, total_points, daily_streak, created_at, mining_points, task_points, social_points, referral_points, updated_at')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        setTotals({ totalPoints: 0, totalMiners: 0 });
        setLoading(false);
        return;
      }

      const userIds = pointsData.map(p => p.user_id);

      // Fetch mining sessions for period calculation
      let miningQuery = supabase
        .from('mining_sessions')
        .select('user_id, arx_mined, started_at')
        .in('user_id', userIds);
      
      if (startDate) {
        miningQuery = miningQuery.gte('started_at', startDate.toISOString());
      }

      const { data: miningSessions } = await miningQuery;

      // Fetch completed tasks for period
      let tasksQuery = supabase
        .from('user_tasks')
        .select('user_id, points_awarded, completed_at')
        .in('user_id', userIds)
        .eq('status', 'completed')
        .gt('points_awarded', 0);
      
      if (startDate) {
        tasksQuery = tasksQuery.gte('completed_at', startDate.toISOString());
      }

      const { data: completedTasks } = await tasksQuery;

      // Fetch approved social submissions for period
      let socialQuery = supabase
        .from('social_submissions')
        .select('user_id, points_awarded, created_at')
        .in('user_id', userIds)
        .eq('status', 'approved')
        .gt('points_awarded', 0);
      
      if (startDate) {
        socialQuery = socialQuery.gte('created_at', startDate.toISOString());
      }

      const { data: socialSubmissions } = await socialQuery;

      // Fetch referrals for period
      let referralQuery = supabase
        .from('referrals')
        .select('referrer_id, points_awarded, created_at')
        .in('referrer_id', userIds)
        .gt('points_awarded', 0);
      
      if (startDate) {
        referralQuery = referralQuery.gte('created_at', startDate.toISOString());
      }

      const { data: referrals } = await referralQuery;

      // Build per-user period stats
      const periodStats = new Map<string, { mining: number; tasks: number; social: number; referral: number }>();

      (miningSessions || []).forEach((s: any) => {
        const current = periodStats.get(s.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.mining += Number(s.arx_mined || 0);
        periodStats.set(s.user_id, current);
      });

      (completedTasks || []).forEach((t: any) => {
        const current = periodStats.get(t.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.tasks += Number(t.points_awarded || 0);
        periodStats.set(t.user_id, current);
      });

      (socialSubmissions || []).forEach((s: any) => {
        const current = periodStats.get(s.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.social += Number(s.points_awarded || 0);
        periodStats.set(s.user_id, current);
      });

      (referrals || []).forEach((r: any) => {
        const current = periodStats.get(r.referrer_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        current.referral += Number(r.points_awarded || 0);
        periodStats.set(r.referrer_id, current);
      });

      // Fetch profiles for usernames and avatars
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      // Combine data
      const leaderboardWithRanks = pointsData.map((entry, index) => {
        const profile = profiles?.find(p => p.user_id === entry.user_id);
        const stats = periodStats.get(entry.user_id) || { mining: 0, tasks: 0, social: 0, referral: 0 };
        
        // For "all time", use stored totals if period stats are empty
        const isAllTime = timeFilter === 'all';
        const period_mining = isAllTime && stats.mining === 0 ? Number(entry.mining_points || 0) : stats.mining;
        const period_tasks = isAllTime && stats.tasks === 0 ? Number(entry.task_points || 0) : stats.tasks;
        const period_social = isAllTime && stats.social === 0 ? Number(entry.social_points || 0) : stats.social;
        const period_referral = isAllTime && stats.referral === 0 ? Number(entry.referral_points || 0) : stats.referral;
        const period_total = period_mining + period_tasks + period_social + period_referral;

        return {
          ...entry,
          username: profile?.username || `Miner${entry.user_id.slice(0, 4)}`,
          avatar_url: profile?.avatar_url || undefined,
          rank: index + 1,
          period_mining: Math.round(period_mining),
          period_tasks: Math.round(period_tasks),
          period_social: Math.round(period_social),
          period_referral: Math.round(period_referral),
          period_total: Math.round(period_total),
        };
      });

      // Calculate totals
      const totalPoints = leaderboardWithRanks.reduce((sum, p) => sum + p.period_total, 0);
      setTotals({ totalPoints, totalMiners: leaderboardWithRanks.length });

      setLeaderboard(leaderboardWithRanks);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_points' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return { leaderboard, totals, loading, refreshLeaderboard: fetchLeaderboard };
};
