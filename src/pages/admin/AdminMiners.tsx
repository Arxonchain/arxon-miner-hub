import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, MoreHorizontal, Activity, Clock, Coins, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface MinerData {
  user_id: string;
  wallet: string;
  username: string;
  sessions: number;
  totalMined: number;
  lastActive: string;
  status: "active" | "idle" | "offline";
}

const AdminMiners = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: miners = [], isLoading } = useQuery({
    queryKey: ["admin-miners"],
    queryFn: async () => {
      // Fetch all mining sessions with aggregation
      const { data: sessions, error: sessionsError } = await supabase
        .from("mining_sessions")
        .select("user_id, arx_mined, is_active, started_at, ended_at");

      if (sessionsError) throw sessionsError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username");

      if (profilesError) throw profilesError;

      // Fetch all wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("user_wallets")
        .select("user_id, wallet_address, is_primary");

      if (walletsError) throw walletsError;

      // Aggregate data by user
      const userMap = new Map<string, {
        sessions: number;
        totalMined: number;
        lastActive: Date | null;
        isActive: boolean;
      }>();

      sessions?.forEach((session) => {
        const existing = userMap.get(session.user_id) || {
          sessions: 0,
          totalMined: 0,
          lastActive: null,
          isActive: false,
        };

        const sessionEnd = session.ended_at ? new Date(session.ended_at) : new Date(session.started_at);
        
        userMap.set(session.user_id, {
          sessions: existing.sessions + 1,
          totalMined: existing.totalMined + Number(session.arx_mined || 0),
          lastActive: !existing.lastActive || sessionEnd > existing.lastActive ? sessionEnd : existing.lastActive,
          isActive: existing.isActive || session.is_active,
        });
      });

      // Build miner data
      const minerData: MinerData[] = [];
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) || []);
      const walletMap = new Map(
        wallets?.filter((w) => w.is_primary).map((w) => [w.user_id, w.wallet_address]) || []
      );

      userMap.forEach((data, userId) => {
        const now = new Date();
        const lastActive = data.lastActive || now;
        const minutesAgo = (now.getTime() - lastActive.getTime()) / 1000 / 60;

        let status: "active" | "idle" | "offline" = "offline";
        if (data.isActive) {
          status = "active";
        } else if (minutesAgo < 60) {
          status = "idle";
        }

        const wallet = walletMap.get(userId) || "No wallet";
        const shortWallet = wallet.length > 10 
          ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` 
          : wallet;

        minerData.push({
          user_id: userId,
          wallet: shortWallet,
          username: profileMap.get(userId) || "Anonymous",
          sessions: data.sessions,
          totalMined: Math.round(data.totalMined),
          lastActive: formatDistanceToNow(lastActive, { addSuffix: true }),
          status,
        });
      });

      // Sort by total mined descending
      return minerData.sort((a, b) => b.totalMined - a.totalMined);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-miners-stats"],
    queryFn: async () => {
      const { count: activeCount } = await supabase
        .from("mining_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { data: totalMinedData } = await supabase
        .from("mining_sessions")
        .select("arx_mined");

      const totalMined = totalMinedData?.reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;

      const { data: uniqueUsers } = await supabase
        .from("mining_sessions")
        .select("user_id");

      const uniqueUserCount = new Set(uniqueUsers?.map((u) => u.user_id)).size;

      return {
        activeNow: activeCount || 0,
        totalMiners: uniqueUserCount,
        totalMined,
      };
    },
    refetchInterval: 30000,
  });

  const filteredMiners = miners.filter(
    (miner) =>
      miner.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      miner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/10 text-green-500",
      idle: "bg-yellow-500/10 text-yellow-500",
      offline: "bg-muted text-muted-foreground",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status === "active" ? "Mining" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Miners</h1>
          <p className="text-muted-foreground">Manage and monitor all ARX-P miners</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Mining Info */}
      <div className="glass-card p-4 border-primary/30 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Mining Rate:</span> +10 ARX-P/hour | 
          <span className="font-medium text-foreground ml-2">Max Session:</span> 8 hours (80 ARX-P max) | 
          <span className="font-medium text-foreground ml-2">Conversion:</span> ARX-P → $ARX at TGE
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatNumber(stats?.activeNow || 0)}</p>
            <p className="text-sm text-muted-foreground">Currently Mining</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatNumber(stats?.totalMiners || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Miners</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{formatNumber(stats?.totalMined || 0)}</p>
            <p className="text-sm text-muted-foreground">Total ARX-P Mined</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by wallet or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Wallet</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Username</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Sessions</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">ARX-P Mined</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMiners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No miners found
                    </td>
                  </tr>
                ) : (
                  filteredMiners.map((miner) => (
                    <tr key={miner.user_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 text-sm font-mono text-primary">{miner.wallet}</td>
                      <td className="py-4 px-4 text-sm text-foreground">{miner.username}</td>
                      <td className="py-4 px-4 text-sm text-foreground">{miner.sessions}</td>
                      <td className="py-4 px-4 text-sm text-accent font-medium">{miner.totalMined.toLocaleString()} ARX-P</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{miner.lastActive}</td>
                      <td className="py-4 px-4">{getStatusBadge(miner.status)}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMiners;
