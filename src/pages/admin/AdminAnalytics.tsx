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

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map((day) => {
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
    },
    refetchInterval: 60000,
  });

  // Fetch ARX-P mined per day (last 7 days)
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
      return days.map((day) => {
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
      return days.map((day) => {
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
    },
    refetchInterval: 60000,
  });

  // Fetch ARX-P source distribution
  const { data: pointsSourceData = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["admin-points-distribution"],
    queryFn: async () => {
      const { data: points, error } = await supabase
        .from("user_points")
        .select("mining_points, task_points, social_points, referral_points");

      if (error) throw error;

      const totals = {
        mining: points?.reduce((sum, p) => sum + Number(p.mining_points || 0), 0) || 0,
        tasks: points?.reduce((sum, p) => sum + Number(p.task_points || 0), 0) || 0,
        social: points?.reduce((sum, p) => sum + Number(p.social_points || 0), 0) || 0,
        referrals: points?.reduce((sum, p) => sum + Number(p.referral_points || 0), 0) || 0,
      };

      const total = totals.mining + totals.tasks + totals.social + totals.referrals;
      if (total === 0) return [];

      return [
        { name: "Mining", value: Math.round((totals.mining / total) * 100), color: "hsl(var(--primary))" },
        { name: "Tasks", value: Math.round((totals.tasks / total) * 100), color: "hsl(142, 71%, 45%)" },
        { name: "Social", value: Math.round((totals.social / total) * 100), color: "hsl(38, 92%, 50%)" },
        { name: "Referrals", value: Math.round((totals.referrals / total) * 100), color: "hsl(280, 70%, 50%)" },
      ];
    },
    refetchInterval: 60000,
  });

  const isLoading = loadingMiners || loadingArx || loadingReferrals || loadingPoints;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">ARX-P mining performance and user engagement metrics</p>
      </div>

      {/* Key Metrics Banner */}
      <div className="glass-card p-4 border-primary/30 bg-primary/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">+10</p>
            <p className="text-xs text-muted-foreground">ARX-P/hour rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">8h</p>
            <p className="text-xs text-muted-foreground">Max session</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">80</p>
            <p className="text-xs text-muted-foreground">Max ARX-P/session</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">$ARX</p>
            <p className="text-xs text-muted-foreground">Token at TGE</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Miners */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Daily Active Miners</h3>
            <p className="text-sm text-muted-foreground">Unique miners per day (last 7 days)</p>
          </div>
          <div className="h-64">
            {dailyMinersData.every(d => d.miners === 0) ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No mining activity yet
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
                    formatter={(value: number) => [`${value} miners`, 'Active']}
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

        {/* ARX-P Mined per Day */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">ARX-P Mined per Day</h3>
            <p className="text-sm text-muted-foreground">Points earned from mining (last 7 days)</p>
          </div>
          <div className="h-64">
            {arxMinedData.every(d => d.arx === 0) ? (
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
                    tickFormatter={formatNumber}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ARX-P`, 'Mined']}
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
            <p className="text-sm text-muted-foreground">New referral signups per day</p>
          </div>
          <div className="h-64">
            {referralGrowthData.every(d => d.referrals === 0) ? (
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
                    formatter={(value: number) => [`${value} referrals`, 'New']}
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

        {/* ARX-P Source Distribution */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">ARX-P Source Distribution</h3>
            <p className="text-sm text-muted-foreground">How users are earning points</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {pointsSourceData.length === 0 ? (
              <div className="text-muted-foreground">No points data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pointsSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pointsSourceData.map((entry, index) => (
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
