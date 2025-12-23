import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Coins, Server, Clock, CheckCircle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subHours, startOfHour, eachHourOfInterval } from "date-fns";
import { formatDistanceToNow } from "date-fns";

const StatCard = ({ icon: Icon, label, value, subtext, trend, loading }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}) => (
  <div className="glass-card p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          trend === "up" ? "bg-green-500/10 text-green-500" :
          trend === "down" ? "bg-red-500/10 text-red-500" :
          "bg-muted text-muted-foreground"
        }`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
        </span>
      )}
    </div>
    <div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{value}</p>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  // Fetch main stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // Total unique miners
      const { data: allSessions } = await supabase
        .from("mining_sessions")
        .select("user_id");
      const totalMiners = new Set(allSessions?.map((s) => s.user_id)).size;

      // Active sessions
      const { count: activeSessions } = await supabase
        .from("mining_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Total ARX mined
      const { data: miningData } = await supabase
        .from("mining_sessions")
        .select("arx_mined");
      const totalArxMined = miningData?.reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;

      // Mining settings (claim status)
      const { data: settings } = await supabase
        .from("mining_settings")
        .select("claiming_enabled, block_reward")
        .limit(1)
        .maybeSingle();

      // Total user points for additional context
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("total_points");
      const totalPoints = pointsData?.reduce((sum, p) => sum + Number(p.total_points || 0), 0) || 0;

      return {
        totalMiners,
        activeSessions: activeSessions || 0,
        totalArxMined,
        claimingEnabled: settings?.claiming_enabled || false,
        blockReward: settings?.block_reward || 1000,
        totalPoints,
      };
    },
    refetchInterval: 15000,
  });

  // Fetch 24h miner activity
  const { data: hourlyData = [], isLoading: loadingHourly } = useQuery({
    queryKey: ["admin-hourly-miners"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subHours(endDate, 23);
      
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("user_id, started_at")
        .gte("started_at", startDate.toISOString());

      if (error) throw error;

      const hours = eachHourOfInterval({ start: startDate, end: endDate });
      return hours.map((hour) => {
        const hourStart = startOfHour(hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        
        const uniqueUsers = new Set(
          sessions?.filter((s) => {
            const sessionDate = new Date(s.started_at);
            return sessionDate >= hourStart && sessionDate < hourEnd;
          }).map((s) => s.user_id)
        );

        return {
          time: format(hour, "HH:mm"),
          miners: uniqueUsers.size,
        };
      });
    },
    refetchInterval: 60000,
  });

  // Fetch recent mining sessions as "blocks"
  const { data: recentBlocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: ["admin-recent-sessions"],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("id, user_id, arx_mined, started_at")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get profiles for usernames
      const userIds = sessions?.map((s) => s.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) || []);

      // Get wallets
      const { data: wallets } = await supabase
        .from("user_wallets")
        .select("user_id, wallet_address")
        .in("user_id", userIds)
        .eq("is_primary", true);

      const walletMap = new Map(wallets?.map((w) => [w.user_id, w.wallet_address]) || []);

      return sessions?.map((session, index) => {
        const wallet = walletMap.get(session.user_id) || "No wallet";
        const shortWallet = wallet.length > 12 
          ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` 
          : wallet;
        
        return {
          id: `#${(900000 - index).toString()}`,
          miner: shortWallet,
          username: profileMap.get(session.user_id) || "Anonymous",
          reward: `${Math.round(Number(session.arx_mined || 0)).toLocaleString()} ARX`,
          time: formatDistanceToNow(new Date(session.started_at), { addSuffix: true }),
        };
      }) || [];
    },
    refetchInterval: 15000,
  });

  // ARX per recent session data for chart
  const { data: arxPerBlockData = [] } = useQuery({
    queryKey: ["admin-arx-per-block"],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("arx_mined")
        .order("started_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      return sessions?.reverse().map((s, i) => ({
        block: `${i + 1}`,
        arx: Math.round(Number(s.arx_mined || 0)),
      })) || [];
    },
    refetchInterval: 30000,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const isLoading = loadingStats || loadingHourly || loadingBlocks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor network health and miner activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Miners" 
          value={formatNumber(stats?.totalMiners || 0)} 
          loading={loadingStats}
        />
        <StatCard 
          icon={Activity} 
          label="Active Sessions" 
          value={formatNumber(stats?.activeSessions || 0)} 
          trend={stats?.activeSessions ? "up" : "neutral"}
          loading={loadingStats}
        />
        <StatCard 
          icon={Coins} 
          label="Total ARX Mined" 
          value={formatNumber(stats?.totalArxMined || 0)} 
          subtext="All time"
          loading={loadingStats}
        />
        <StatCard 
          icon={Coins} 
          label="Block Reward" 
          value={`${stats?.blockReward || 1000} ARX`} 
          subtext="Per session"
          loading={loadingStats}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Claim Status" 
          value={stats?.claimingEnabled ? "Enabled" : "Disabled"} 
          subtext="Admin controlled"
          loading={loadingStats}
        />
        <StatCard 
          icon={Server} 
          label="Total Points" 
          value={formatNumber(stats?.totalPoints || 0)} 
          subtext="All users"
          loading={loadingStats}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24h Active Miners */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">24h Active Miners</h3>
            <p className="text-sm text-muted-foreground">Miner activity over the last 24 hours</p>
          </div>
          <div className="h-64">
            {loadingHourly ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hourlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="minersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="miners"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#minersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ARX per Block */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">ARX Mined per Session</h3>
              <p className="text-sm text-muted-foreground">Last 6 sessions</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Recent</span>
            </div>
          </div>
          <div className="h-64">
            {arxPerBlockData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No session data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arxPerBlockData}>
                  <XAxis 
                    dataKey="block" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ARX`, 'Mined']}
                  />
                  <Bar 
                    dataKey="arx" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Recent Mining Sessions</h3>
          <p className="text-sm text-muted-foreground">Latest mining activity on the network</p>
        </div>
        <div className="overflow-x-auto">
          {loadingBlocks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentBlocks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No mining sessions yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Session</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Miner</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reward</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentBlocks.map((block, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-primary">{block.id}</td>
                    <td className="py-3 px-4 text-sm font-mono text-foreground">{block.miner}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{block.username}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{block.reward}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{block.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
