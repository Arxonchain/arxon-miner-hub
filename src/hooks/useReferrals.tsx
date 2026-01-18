import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { cacheGet, cacheSet } from '@/lib/localCache';
import { withTimeout } from '@/lib/utils';

interface ReferralData {
  id: string;
  referred_id: string;
  referral_code_used: string;
  points_awarded: number;
  created_at: string;
  referred_username?: string;
  is_active?: boolean; // Whether this referral is currently mining
}

interface ReferralStats {
  totalReferrals: number;
  activeMiners: number;
  inactiveMiners: number;
  totalEarnings: number;
}

const referralCodeCacheKey = (userId: string) => `arxon:referral_code:v1:${userId}`;
const referralsCacheKey = (userId: string) => `arxon:referrals:v1:${userId}`;
const referralStatsCacheKey = (userId: string) => `arxon:referral_stats:v1:${userId}`;

export const useReferrals = (user: User | null) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeMiners: 0,
    inactiveMiners: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReferralCode = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('referral_code').eq('user_id', user.id).maybeSingle(),
        12_000
      );

      if (!error && data?.referral_code) {
        setReferralCode(data.referral_code);
        cacheSet(referralCodeCacheKey(user.id), data.referral_code);
      }
    } catch {
      // keep cached UI
    }
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
        12_000
      );

      if (error) return;

      const rows = (data || []) as any[];

      if (rows.length === 0) {
        setReferrals([]);
        setStats({ totalReferrals: 0, activeMiners: 0, inactiveMiners: 0, totalEarnings: 0 });
        cacheSet(referralsCacheKey(user.id), []);
        cacheSet(referralStatsCacheKey(user.id), { totalReferrals: 0, activeMiners: 0, inactiveMiners: 0, totalEarnings: 0 });
        return;
      }

      const referredIds = rows.map((r) => r.referred_id).filter(Boolean);
      if (referredIds.length === 0) {
        setReferrals(rows);
        const nextStats = {
          totalReferrals: rows.length,
          activeMiners: 0,
          inactiveMiners: 0,
          totalEarnings: rows.reduce((sum, r) => sum + Number(r.points_awarded || 0), 0),
        };
        setStats(nextStats);
        cacheSet(referralsCacheKey(user.id), rows);
        cacheSet(referralStatsCacheKey(user.id), nextStats);
        return;
      }

      const totalEarnings = rows.reduce((sum, r) => sum + Number(r.points_awarded || 0), 0);

      // Fetch usernames + active mining sessions for each referral
      const [profilesRes, activeSessionsRes] = await Promise.all([
        withTimeout(
          supabase.from('profiles').select('user_id, username').in('user_id', referredIds),
          12_000
        ).catch(() => ({ data: [] as any[] } as any)),
        withTimeout(
          supabase
            .from('mining_sessions')
            .select('user_id')
            .in('user_id', referredIds)
            .eq('is_active', true),
          12_000
        ).catch(() => ({ data: [] } as any)),
      ]);

      const profiles = (profilesRes as any)?.data as any[] | undefined;
      const activeSessions = (activeSessionsRes as any)?.data as any[] | undefined;
      const activeUserIds = new Set(activeSessions?.map((s) => s.user_id) || []);
      const activeCount = activeUserIds.size;

      const referralsWithUsernames: ReferralData[] = rows.map((r) => ({
        ...r,
        referred_username: profiles?.find((p) => p.user_id === r.referred_id)?.username || 'Anonymous',
        is_active: activeUserIds.has(r.referred_id),
      }));

      const nextStats: ReferralStats = {
        totalReferrals: rows.length,
        activeMiners: activeCount,
        inactiveMiners: rows.length - activeCount,
        totalEarnings,
      };

      setReferrals(referralsWithUsernames);
      setStats(nextStats);
      cacheSet(referralsCacheKey(user.id), referralsWithUsernames);
      cacheSet(referralStatsCacheKey(user.id), nextStats);
    } catch {
      // keep cached UI
    }
  }, [user]);

  const applyReferralCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in' };
    }

    // Check if user already used a referral code
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .maybeSingle();

    if (existingReferral) {
      return { success: false, error: 'You have already used a referral code' };
    }

    // Find the referrer by code
    const { data: referrerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();

    if (profileError || !referrerProfile) {
      return { success: false, error: 'Invalid referral code' };
    }

    if (referrerProfile.user_id === user.id) {
      return { success: false, error: 'You cannot use your own referral code' };
    }

    // Create the referral record
    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referrerProfile.user_id,
      referred_id: user.id,
      referral_code_used: code.toUpperCase(),
      points_awarded: 100, // Base referral bonus
    });

    if (insertError) {
      return { success: false, error: 'Failed to apply referral code' };
    }

    // Keep UI fresh
    void fetchReferrals();

    return { success: true };
  };

  // Initial fetch + cache hydration
  useEffect(() => {
    if (!user) {
      setReferralCode(null);
      setReferrals([]);
      setStats({ totalReferrals: 0, activeMiners: 0, inactiveMiners: 0, totalEarnings: 0 });
      setLoading(false);
      return;
    }

    const cachedCode = cacheGet<string>(referralCodeCacheKey(user.id), { maxAgeMs: 24 * 60 * 60_000 });
    if (cachedCode?.data) setReferralCode(cachedCode.data);

    const cachedRefs = cacheGet<ReferralData[]>(referralsCacheKey(user.id), { maxAgeMs: 5 * 60_000 });
    if (cachedRefs?.data) setReferrals(cachedRefs.data);

    const cachedStats = cacheGet<ReferralStats>(referralStatsCacheKey(user.id), { maxAgeMs: 5 * 60_000 });
    if (cachedStats?.data) setStats(cachedStats.data);

    // Avoid long spinners
    setLoading(false);

    // Refresh in background
    void fetchReferralCode();
    void fetchReferrals();
  }, [user, fetchReferralCode, fetchReferrals]);

  // Real-time subscription for referrals and mining sessions (for active miners count)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('referrals-and-mining-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        () => {
          void fetchReferrals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_sessions',
        },
        () => {
          // Refresh referrals to update active miners count when any session changes
          void fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchReferrals]);

  const getReferralLink = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/?ref=${referralCode}`;
  };

  return {
    referralCode,
    referrals,
    stats,
    loading,
    getReferralLink,
    applyReferralCode,
    refreshReferrals: fetchReferrals,
  };
};

