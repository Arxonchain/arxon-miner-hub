import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const AdminAnalytics = () => {
  // Fetch daily miners data (last 7 days)
  const { data: dailyMinersData = [], isLoading: loadingMiners } = useQuery({
    queryKey: ["admin-daily-miners"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("user_id, started_at")
        .gte("started_at", startDate.toISOString());

      if (error) throw error;

      // Create a map of dates to unique user counts
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const uniqueUsers = new Set(
          sessions?.filter((s) => {
            const sessionDate = new Date(s.started_at);
            return sessionDate >= dayStart && sessionDate < dayEnd;
          }).map((s) => s.user_id)
        );

        return {
          date: format(day, "MMM d"),
          miners: uniqueUsers.size,
        };
      });

      return dailyData;
    },
    refetchInterval: 60000,
  });

  // Fetch ARX mined per day (last 7 days)
  const { data: arxMinedData = [], isLoading: loadingArx } = useQuery({
    queryKey: ["admin-daily-arx"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("arx_mined, started_at")
        .gte("started_at", startDate.toISOString());

      if (error) throw error;

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const arxTotal = sessions?.filter((s) => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        }).reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;

        return {
          date: format(day, "MMM d"),
          arx: Math.round(arxTotal),
        };
      });

      return dailyData;
    },
    refetchInterval: 60000,
  });

  // Fetch referral growth (last 7 days)
  const { data: referralGrowthData = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ["admin-daily-referrals"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const count = referrals?.filter((r) => {
          const refDate = new Date(r.created_at);
          return refDate >= dayStart && refDate < dayEnd;
        }).length || 0;

        return {
          date: format(day, "MMM d"),
          referrals: count,
        };
      });

      return dailyData;
    },
    refetchInterval: 60000,
  });

  // Fetch user activity distribution
  const { data: activityData = [], isLoading: loadingActivity } = useQuery({
    queryKey: ["admin-activity-distribution"],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("mining_sessions")
        .select("user_id, is_active, ended_at, started_at");

      if (error) throw error;

      const now = new Date();
      const activeUsers = new Set<string>();
      const idleUsers = new Set<string>();
      const offlineUsers = new Set<string>();

      sessions?.forEach((session) => {
        const lastActivity = session.ended_at ? new Date(session.ended_at) : new Date(session.started_at);
        const minutesAgo = (now.getTime() - lastActivity.getTime()) / 1000 / 60;

        if (session.is_active) {
          activeUsers.add(session.user_id);
          idleUsers.delete(session.user_id);
          offlineUsers.delete(session.user_id);
        } else if (!activeUsers.has(session.user_id)) {
          if (minutesAgo < 60) {
            idleUsers.add(session.user_id);
            offlineUsers.delete(session.user_id);
          } else if (!idleUsers.has(session.user_id)) {
            offlineUsers.add(session.user_id);
          }
        }
      });

      const total = activeUsers.size + idleUsers.size + offlineUsers.size;
      if (total === 0) return [];

      return [
        { name: "Active", value: Math.round((activeUsers.size / total) * 100), color: "hsl(142, 71%, 45%)" },
        { name: "Idle", value: Math.round((idleUsers.size / total) * 100), color: "hsl(38, 92%, 50%)" },
        { name: "Offline", value: Math.round((offlineUsers.size / total) * 100), color: "hsl(var(--muted-foreground))" },
      ];
    },
    refetchInterval: 60000,
  });

  const isLoading = loadingMiners || loadingArx || loadingReferrals || loadingActivity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Network performance and user insights</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Miners */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Daily Active Miners</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <div className="h-64">
            {dailyMinersData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No mining data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyMinersData}>
                  <defs>
                    <linearGradient id="minersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                    fill="url(#minersGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ARX Mined per Day */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">ARX Mined per Day</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <div className="h-64">
            {arxMinedData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No mining data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arxMinedData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
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

        {/* Referral Growth */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Referral Growth</h3>
            <p className="text-sm text-muted-foreground">New referrals per day</p>
          </div>
          <div className="h-64">
            {referralGrowthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No referral data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={referralGrowthData}>
                  <defs>
                    <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                    dataKey="referrals"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#refGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User Activity Distribution */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">User Activity Distribution</h3>
            <p className="text-sm text-muted-foreground">Current miner status breakdown</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {activityData.length === 0 ? (
              <div className="text-muted-foreground">No user data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
