import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePoints } from './usePoints';
import { toast } from 'sonner';

export interface ArenaBattle {
  id: string;
  title: string;
  description: string | null;
  side_a_name: string;
  side_a_image: string | null;
  side_a_color: string;
  side_b_name: string;
  side_b_image: string | null;
  side_b_color: string;
  side_a_power: number;
  side_b_power: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  winner_side: string | null;
  winner_boost_percentage: number;
}

export interface ArenaVote {
  id: string;
  battle_id: string;
  user_id: string;
  side: 'a' | 'b';
  power_spent: number;
  locked_until: string;
  created_at: string;
}

export interface ArenaParticipant {
  user_id: string;
  power_spent: number;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
}

export interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string | null;
  battle_id: string | null;
  earned_at: string;
}

export interface ArenaBoost {
  id: string;
  battle_id: string;
  boost_percentage: number;
  expires_at: string;
}

export const useArena = () => {
  const { user } = useAuth();
  const { points, addPoints } = usePoints();
  const [activeBattle, setActiveBattle] = useState<ArenaBattle | null>(null);
  const [userVote, setUserVote] = useState<ArenaVote | null>(null);
  const [participants, setParticipants] = useState<ArenaParticipant[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [arenaBoosts, setArenaBoosts] = useState<ArenaBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const fetchActiveBattle = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('arena_battles')
        .select('*')
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveBattle(data);
      return data;
    } catch (error) {
      console.error('Error fetching active battle:', error);
      return null;
    }
  }, []);

  const fetchUserVote = useCallback(async (battleId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('arena_votes')
        .select('*')
        .eq('battle_id', battleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserVote(data as ArenaVote | null);
      return data as ArenaVote | null;
    } catch (error) {
      console.error('Error fetching user vote:', error);
      return null;
    }
  }, [user]);

  const fetchParticipants = useCallback(async (battleId: string) => {
    try {
      const { data, error } = await supabase
        .from('arena_votes')
        .select(`
          user_id,
          power_spent,
          created_at,
          profiles!inner(username, avatar_url)
        `)
        .eq('battle_id', battleId)
        .order('power_spent', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        user_id: item.user_id,
        power_spent: item.power_spent,
        created_at: item.created_at,
        username: item.profiles?.username,
        avatar_url: item.profiles?.avatar_url,
      }));

      setParticipants(formatted);
      return formatted;
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  }, []);

  const fetchUserBadges = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setUserBadges(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }, [user]);

  const fetchArenaBoosts = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('arena_boosts')
        .select('*')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;
      setArenaBoosts(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching arena boosts:', error);
      return [];
    }
  }, [user]);

  const castVote = async (battleId: string, side: 'a' | 'b', powerAmount: number) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return false;
    }

    if (!points || points.total_points < powerAmount) {
      toast.error('Insufficient ARX-P points');
      return false;
    }

    if (powerAmount < 100) {
      toast.error('Minimum vote is 100 ARX-P');
      return false;
    }

    setVoting(true);

    try {
      // Deduct points first
      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          total_points: points.total_points - powerAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (pointsError) throw pointsError;

      // Cast vote
      const { error: voteError } = await supabase
        .from('arena_votes')
        .insert({
          battle_id: battleId,
          user_id: user.id,
          side,
          power_spent: powerAmount,
        });

      if (voteError) {
        // Refund points if vote fails
        await supabase
          .from('user_points')
          .update({
            total_points: points.total_points,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        throw voteError;
      }

      toast.success('Vote cast successfully!');
      
      // Refresh data
      await Promise.all([
        fetchActiveBattle(),
        fetchUserVote(battleId),
        fetchParticipants(battleId),
      ]);

      return true;
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast.error(error.message || 'Failed to cast vote');
      return false;
    } finally {
      setVoting(false);
    }
  };

  const getTotalArenaBoost = useCallback(() => {
    return arenaBoosts.reduce((total, boost) => total + boost.boost_percentage, 0);
  }, [arenaBoosts]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const battle = await fetchActiveBattle();
      
      if (battle) {
        await Promise.all([
          fetchUserVote(battle.id),
          fetchParticipants(battle.id),
        ]);
      }

      await Promise.all([
        fetchUserBadges(),
        fetchArenaBoosts(),
      ]);

      setLoading(false);
    };

    init();
  }, [user, fetchActiveBattle, fetchUserVote, fetchParticipants, fetchUserBadges, fetchArenaBoosts]);

  // Real-time subscription for battle updates
  useEffect(() => {
    if (!activeBattle) return;

    const channel = supabase
      .channel('arena-battle-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_battles',
          filter: `id=eq.${activeBattle.id}`,
        },
        (payload) => {
          if (payload.new) {
            setActiveBattle(payload.new as ArenaBattle);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBattle?.id]);

  return {
    activeBattle,
    userVote,
    participants,
    userBadges,
    arenaBoosts,
    loading,
    voting,
    castVote,
    getTotalArenaBoost,
    refreshBattle: fetchActiveBattle,
    refreshParticipants: () => activeBattle && fetchParticipants(activeBattle.id),
  };
};
