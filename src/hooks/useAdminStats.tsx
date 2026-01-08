import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  activeMiners: number;
  totalMiningPoints: number;
  totalPoints: number;
  totalReferrals: number;
  claimingEnabled: boolean;
  blockReward: number;
  totalMinersEver: number;
}

/**
 * Centralized hook for admin statistics.
 * Ensures consistent data across all admin pages.
 */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Total users from profiles table (the source of truth for signups)
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Active miners (currently mining sessions)
      const { count: activeMiners } = await supabase
        .from("mining_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Unique miners who have ever mined
      const { data: allSessions } = await supabase
        .from("mining_sessions")
        .select("user_id");
      const totalMinersEver = new Set(allSessions?.map(s => s.user_id)).size;

      // Total points from user_points - use RPC or paginated fetch to get ALL rows
      // Supabase default limit is 1000, so we need to fetch in batches
      let allPointsData: { mining_points: number; total_points: number }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batch } = await supabase
          .from("user_points")
          .select("mining_points, total_points")
          .range(offset, offset + batchSize - 1);
        
        if (batch && batch.length > 0) {
          allPointsData = [...allPointsData, ...batch];
          offset += batchSize;
          hasMore = batch.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      const totalMiningPoints = allPointsData.reduce((sum, p) => sum + Number(p.mining_points || 0), 0);
      const totalPoints = allPointsData.reduce((sum, p) => sum + Number(p.total_points || 0), 0);

      // Total referrals
      const { count: totalReferrals } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true });

      // Mining settings
      const { data: settings } = await supabase
        .from("mining_settings")
        .select("claiming_enabled, block_reward")
        .limit(1)
        .maybeSingle();

      return {
        totalUsers: totalUsers || 0,
        activeMiners: activeMiners || 0,
        totalMiningPoints,
        totalPoints,
        totalReferrals: totalReferrals || 0,
        claimingEnabled: settings?.claiming_enabled || false,
        blockReward: settings?.block_reward || 1000,
        totalMinersEver,
      };
    },
    refetchInterval: 15000, // Faster refresh every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

export const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};
