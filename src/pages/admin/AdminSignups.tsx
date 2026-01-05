import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Users, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Cell } from "recharts";

interface DailySignup {
  date: string;
  signups: number;
}

const AdminSignups = () => {
  const [realtimeSignups, setRealtimeSignups] = useState<number>(0);

  // Fetch daily signups for last 30 days
  const { data: dailySignups, isLoading, refetch } = useQuery({
    queryKey: ["admin-daily-signups"],
    queryFn: async (): Promise<DailySignup[]> => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Group by date
      const grouped: Record<string, number> = {};
      
      // Initialize all 30 days with 0
      for (let i = 0; i <= 30; i++) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        grouped[date] = 0;
      }

      // Count signups per day
      data?.forEach((profile) => {
        const date = format(new Date(profile.created_at), "yyyy-MM-dd");
        if (grouped[date] !== undefined) {
          grouped[date]++;
        }
      });

      // Convert to array and sort by date
      return Object.entries(grouped)
        .map(([date, signups]) => ({ date, signups }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Real-time subscription for new signups
  useEffect(() => {
    const channel = supabase
      .channel("new-signups")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        () => {
          setRealtimeSignups((prev) => prev + 1);
          refetch(); // Refresh the data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todaySignups = (dailySignups?.find((d) => d.date === todayStr)?.signups || 0) + realtimeSignups;
  const yesterdaySignups = dailySignups?.find((d) => d.date === yesterdayStr)?.signups || 0;
  const weekTotal = dailySignups?.slice(-7).reduce((sum, d) => sum + d.signups, 0) || 0;
  const monthTotal = dailySignups?.reduce((sum, d) => sum + d.signups, 0) || 0;

  const growthPercent = yesterdaySignups > 0 
    ? Math.round(((todaySignups - yesterdaySignups) / yesterdaySignups) * 100) 
    : todaySignups > 0 ? 100 : 0;

  // Chart data - last 14 days for better visibility
  const chartData = dailySignups?.slice(-14).map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    signups: d.signups + (d.date === todayStr ? realtimeSignups : 0),
  })) || [];

  // Find max for coloring
  const maxSignups = Math.max(...(chartData.map(d => d.signups) || [0]));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Daily Signups</h1>
        <p className="text-muted-foreground">Track user registration growth in real-time</p>
        {realtimeSignups > 0 && (
          <p className="text-sm text-primary mt-1 animate-pulse">
            +{realtimeSignups} new signup{realtimeSignups > 1 ? "s" : ""} since page load
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          icon={UserPlus}
          label="Today's Signups"
          value={todaySignups.toLocaleString()}
          trend={growthPercent > 0 ? "up" : growthPercent < 0 ? "down" : "neutral"}
          subtext={`${growthPercent >= 0 ? "+" : ""}${growthPercent}% vs yesterday`}
        />
        <AdminStatCard
          icon={Calendar}
          label="Yesterday"
          value={yesterdaySignups.toLocaleString()}
        />
        <AdminStatCard
          icon={TrendingUp}
          label="This Week"
          value={weekTotal.toLocaleString()}
          subtext="Last 7 days"
        />
        <AdminStatCard
          icon={Users}
          label="This Month"
          value={monthTotal.toLocaleString()}
          subtext="Last 30 days"
        />
      </div>

      {/* Area Chart - Last 14 Days */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Signup Trend (Last 14 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="signups"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#signupGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Daily Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Daily Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="signups" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.signups === maxSignups ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">All Daily Signups (Last 30 Days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Signups</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...(dailySignups || [])].reverse().map((day, index, arr) => {
                const prevDay = arr[index + 1];
                const change = prevDay ? day.signups - prevDay.signups : 0;
                const isToday = day.date === todayStr;
                const displaySignups = isToday ? day.signups + realtimeSignups : day.signups;
                
                return (
                  <tr key={day.date} className={isToday ? "bg-primary/5" : "hover:bg-muted/30"}>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {format(new Date(day.date), "EEEE, MMM d, yyyy")}
                      {isToday && <span className="ml-2 text-xs text-primary font-medium">(Today)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                      {displaySignups.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {change !== 0 && (
                        <span className={change > 0 ? "text-green-500" : "text-red-500"}>
                          {change > 0 ? "+" : ""}{change}
                        </span>
                      )}
                      {change === 0 && prevDay && <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSignups;
