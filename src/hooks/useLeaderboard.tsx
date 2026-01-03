import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  daily_streak: number;
  username?: string;
  avatar_url?: string;
  rank: number;
}

export type TimeFilter = 'all' | 'month' | 'week' | '7days' | 'day';

export const useLeaderboard = (limit: number = 50) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchLeaderboard = async () => {
      try {
        // Simple single query for points
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_points')
          .select('user_id, total_points, daily_streak')
          .order('total_points', { ascending: false })
          .limit(limit);

        if (pointsError || !mountedRef.current) return;

        if (!pointsData || pointsData.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        const userIds = pointsData.map(p => p.user_id);

        // Single query for profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        if (!mountedRef.current) return;

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        const leaderboardWithRanks = pointsData.map((entry, index) => {
          const profile = profileMap.get(entry.user_id);
          return {
            ...entry,
            username: profile?.username || `Miner${entry.user_id.slice(0, 4)}`,
            avatar_url: profile?.avatar_url || undefined,
            rank: index + 1,
          };
        });

        setLeaderboard(leaderboardWithRanks);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { leaderboard, loading };
};
