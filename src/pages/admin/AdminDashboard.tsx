import { Users, Activity, Coins, Server, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Button } from "@/components/ui/button";
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
        <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{value}</p>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  </div>
);

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const AdminDashboard = () => {
  const { stats, dailyStats, recentSessions, loading, refetch } = useAdminStats();

  // Prepare hourly data from daily stats for the area chart
  const activeMinersData = dailyStats.map(d => ({
    time: d.date,
    miners: d.miners,
  }));

  // Create ARX per day data
  const arxPerDayData = dailyStats.map(d => ({
    date: d.date,
    arx: d.arx,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor network health and miner activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Miners" 
          value={formatNumber(stats.totalMiners)} 
          loading={loading}
        />
        <StatCard 
          icon={Activity} 
          label="Active Sessions" 
          value={formatNumber(stats.activeSessions)} 
          loading={loading}
        />
        <StatCard 
          icon={Coins} 
          label="Total ARX Mined" 
          value={formatNumber(stats.totalArxMined)} 
          subtext="Total points" 
          loading={loading}
        />
        <StatCard 
          icon={Users} 
          label="Total Referrals" 
          value={formatNumber(stats.totalReferrals)} 
          loading={loading}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Claim Status" 
          value={stats.claimingEnabled ? "Enabled" : "Disabled"} 
          subtext="Admin controlled" 
          loading={loading}
        />
        <StatCard 
          icon={Server} 
          label="Node Health" 
          value="Online" 
          trend="neutral" 
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Miners */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Daily Active Miners</h3>
            <p className="text-sm text-muted-foreground">Unique miners over the last 7 days</p>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeMinersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeMinersData}>
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
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* ARX Mined per Day */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">ARX Mined per Day</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : arxPerDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arxPerDayData}>
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
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatNumber(value) + ' ARX', 'Mined']}
                  />
                  <Bar 
                    dataKey="arx" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentSessions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Session ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Wallet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ARX Earned</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-primary">
                      {session.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {session.username || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-foreground">
                      {session.wallet || 'No wallet'}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {formatNumber(session.arx_mined)} ARX
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No mining sessions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
