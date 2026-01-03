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
        // Use secure leaderboard view that only exposes minimal data
        const { data, error } = await supabase
          .from('leaderboard_view')
          .select('user_id, username, avatar_url, total_points, daily_streak')
          .order('total_points', { ascending: false })
          .limit(limit);

        if (error || !mountedRef.current) return;

        if (!data || data.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        const leaderboardWithRanks = data.map((entry, index) => ({
          user_id: entry.user_id,
          total_points: entry.total_points,
          daily_streak: entry.daily_streak,
          username: entry.username || `Miner${entry.user_id.slice(0, 4)}`,
          avatar_url: entry.avatar_url || undefined,
          rank: index + 1,
        }));

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
