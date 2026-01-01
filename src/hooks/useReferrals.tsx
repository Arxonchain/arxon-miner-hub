import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ReferralData {
  id: string;
  referred_id: string;
  referral_code_used: string;
  points_awarded: number;
  created_at: string;
  referred_username?: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeMiners: number;
  totalEarnings: number;
}

export const useReferrals = (user: User | null) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeMiners: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchReferralCode = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setReferralCode(data.referral_code);
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch usernames for referred users
      const referredIds = data.map(r => r.referred_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', referredIds);

      const referralsWithUsernames = data.map(r => ({
        ...r,
        referred_username: profiles?.find(p => p.user_id === r.referred_id)?.username || 'Anonymous'
      }));

      setReferrals(referralsWithUsernames);

      // Calculate stats
      const totalEarnings = data.reduce((sum, r) => sum + Number(r.points_awarded), 0);
      
      // Get active miners count (users who have mined in last 24 hours)
      const { count: activeCount } = await supabase
        .from('mining_sessions')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', referredIds)
        .eq('is_active', true);

      setStats({
        totalReferrals: data.length,
        activeMiners: activeCount || 0,
        totalEarnings
      });
    }
  };

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
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerProfile.user_id,
        referred_id: user.id,
        referral_code_used: code.toUpperCase(),
        points_awarded: 100 // Base referral bonus
      });

    if (insertError) {
      return { success: false, error: 'Failed to apply referral code' };
    }

    // Award the referrer +5% boost (capped at 50% total) and 100 ARX-P
    const { data: referrerPoints } = await supabase
      .from('user_points')
      .select('referral_bonus_percentage, referral_points, total_points')
      .eq('user_id', referrerProfile.user_id)
      .single();

    if (referrerPoints) {
      const currentBoost = referrerPoints.referral_bonus_percentage || 0;
      const newBoost = Math.min(currentBoost + 5, 50); // Cap at 50%
      const newReferralPoints = (referrerPoints.referral_points || 0) + 100;
      const newTotalPoints = (referrerPoints.total_points || 0) + 100;

      await supabase
        .from('user_points')
        .update({
          referral_bonus_percentage: newBoost,
          referral_points: newReferralPoints,
          total_points: newTotalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referrerProfile.user_id);
    }

    return { success: true };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchReferralCode(), fetchReferrals()]);
      setLoading(false);
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

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
    refreshReferrals: fetchReferrals
  };
};
