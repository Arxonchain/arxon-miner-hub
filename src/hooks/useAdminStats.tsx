import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalMiners: number;
  activeSessions: number;
  totalArxMined: number;
  totalReferrals: number;
  claimingEnabled: boolean;
}

interface MinerData {
  id: string;
  wallet: string | null;
  username: string | null;
  email: string | null;
  sessions: number;
  totalMined: number;
  lastActive: string | null;
  status: 'active' | 'idle' | 'offline';
}

interface DailyStats {
  date: string;
  miners: number;
  arx: number;
  referrals: number;
}

interface RecentSession {
  id: string;
  username: string | null;
  wallet: string | null;
  arx_mined: number;
  started_at: string;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalMiners: 0,
    activeSessions: 0,
    totalArxMined: 0,
    totalReferrals: 0,
    claimingEnabled: false,
  });
  const [miners, setMiners] = useState<MinerData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get total unique miners (users with profiles)
      const { count: totalMiners } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active sessions count
      const { count: activeSessions } = await supabase
        .from('mining_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total ARX mined
      const { data: miningData } = await supabase
        .from('mining_sessions')
        .select('arx_mined');
      
      const totalArxMined = miningData?.reduce((sum, session) => sum + Number(session.arx_mined), 0) || 0;

      // Get total referrals
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

      // Get mining settings
      const { data: settings } = await supabase
        .from('mining_settings')
        .select('claiming_enabled')
        .limit(1)
        .single();

      setStats({
        totalMiners: totalMiners || 0,
        activeSessions: activeSessions || 0,
        totalArxMined,
        totalReferrals: totalReferrals || 0,
        claimingEnabled: settings?.claiming_enabled || false,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchMiners = async () => {
    try {
      // Get all profiles with their mining data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url');

      if (!profiles) return;

      // Get mining sessions aggregated by user
      const { data: sessions } = await supabase
        .from('mining_sessions')
        .select('user_id, arx_mined, is_active, started_at, ended_at');

      // Get user wallets
      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('user_id, wallet_address, is_primary');

      const minersData: MinerData[] = profiles.map((profile) => {
        const userSessions = sessions?.filter(s => s.user_id === profile.user_id) || [];
        const userWallet = wallets?.find(w => w.user_id === profile.user_id && w.is_primary);
        
        const totalMined = userSessions.reduce((sum, s) => sum + Number(s.arx_mined), 0);
        const hasActiveSession = userSessions.some(s => s.is_active);
        
        // Get last activity
        const lastSession = userSessions
          .filter(s => s.started_at)
          .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
        
        let status: 'active' | 'idle' | 'offline' = 'offline';
        if (hasActiveSession) {
          status = 'active';
        } else if (lastSession) {
          const lastActiveTime = new Date(lastSession.ended_at || lastSession.started_at).getTime();
          const hourAgo = Date.now() - 3600000;
          if (lastActiveTime > hourAgo) {
            status = 'idle';
          }
        }

        return {
          id: profile.id,
          wallet: userWallet?.wallet_address ? 
            `${userWallet.wallet_address.slice(0, 6)}...${userWallet.wallet_address.slice(-4)}` : null,
          username: profile.username,
          email: null,
          sessions: userSessions.length,
          totalMined,
          lastActive: lastSession?.started_at || null,
          status,
        };
      });

      setMiners(minersData);
    } catch (error) {
      console.error('Error fetching miners:', error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      // Get sessions for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions } = await supabase
        .from('mining_sessions')
        .select('user_id, arx_mined, started_at')
        .gte('started_at', sevenDaysAgo.toISOString());

      const { data: referrals } = await supabase
        .from('referrals')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Group by date
      const statsMap = new Map<string, { miners: Set<string>; arx: number; referrals: number }>();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        statsMap.set(dateStr, { miners: new Set(), arx: 0, referrals: 0 });
      }

      sessions?.forEach(session => {
        const date = new Date(session.started_at);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const stat = statsMap.get(dateStr);
        if (stat) {
          stat.miners.add(session.user_id);
          stat.arx += Number(session.arx_mined);
        }
      });

      referrals?.forEach(ref => {
        const date = new Date(ref.created_at);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const stat = statsMap.get(dateStr);
        if (stat) {
          stat.referrals += 1;
        }
      });

      const dailyStatsArray: DailyStats[] = Array.from(statsMap.entries()).map(([date, data]) => ({
        date,
        miners: data.miners.size,
        arx: data.arx,
        referrals: data.referrals,
      }));

      setDailyStats(dailyStatsArray);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const { data: sessions } = await supabase
        .from('mining_sessions')
        .select('id, user_id, arx_mined, started_at')
        .order('started_at', { ascending: false })
        .limit(10);

      if (!sessions) return;

      // Get profiles for these users
      const userIds = [...new Set(sessions.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('user_id, wallet_address')
        .in('user_id', userIds)
        .eq('is_primary', true);

      const recentData: RecentSession[] = sessions.map(session => {
        const profile = profiles?.find(p => p.user_id === session.user_id);
        const wallet = wallets?.find(w => w.user_id === session.user_id);
        
        return {
          id: session.id,
          username: profile?.username || null,
          wallet: wallet?.wallet_address ? 
            `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-4)}` : null,
          arx_mined: Number(session.arx_mined),
          started_at: session.started_at,
        };
      });

      setRecentSessions(recentData);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchMiners(),
        fetchDailyStats(),
        fetchRecentSessions(),
      ]);
      setLoading(false);
    };

    loadAllData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mining_sessions' }, () => {
        fetchStats();
        fetchMiners();
        fetchRecentSessions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
        fetchMiners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stats,
    miners,
    dailyStats,
    recentSessions,
    loading,
    refetch: () => {
      fetchStats();
      fetchMiners();
      fetchDailyStats();
      fetchRecentSessions();
    },
  };
};
