import { Users, Activity, Coins, Server, Clock, CheckCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";

const activeMinersData = [
  { time: "00:00", miners: 1200 },
  { time: "04:00", miners: 980 },
  { time: "08:00", miners: 1560 },
  { time: "12:00", miners: 2100 },
  { time: "16:00", miners: 2450 },
  { time: "20:00", miners: 2180 },
  { time: "24:00", miners: 1890 },
];

const arxPerBlockData = [
  { block: "1", arx: 1000 },
  { block: "2", arx: 1000 },
  { block: "3", arx: 980 },
  { block: "4", arx: 1000 },
  { block: "5", arx: 990 },
  { block: "6", arx: 1000 },
];

const recentBlocks = [
  { id: "#892341", miner: "0x8f3a...c2e1", reward: "1000 ARX", time: "2 min ago" },
  { id: "#892340", miner: "0x2b7c...9f4a", reward: "1000 ARX", time: "5 min ago" },
  { id: "#892339", miner: "0xd1e5...7b2c", reward: "1000 ARX", time: "8 min ago" },
  { id: "#892338", miner: "0x6a9f...e3d8", reward: "1000 ARX", time: "12 min ago" },
  { id: "#892337", miner: "0xc4b2...1f6e", reward: "1000 ARX", time: "15 min ago" },
];

const StatCard = ({ icon: Icon, label, value, subtext, trend }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
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
          {trend === "up" ? "↑ 12%" : trend === "down" ? "↓ 5%" : "—"}
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor network health and miner activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Miners" value="24,582" trend="up" />
        <StatCard icon={Activity} label="Active Sessions" value="2,145" trend="up" />
        <StatCard icon={Coins} label="Total ARX Mined" value="45.2M" subtext="Public supply" />
        <StatCard icon={Coins} label="Remaining Supply" value="54.8M" subtext="Mining pool" />
        <StatCard icon={CheckCircle} label="Claim Status" value="Disabled" subtext="Admin controlled" />
        <StatCard icon={Server} label="Node Health" value="98.5%" trend="neutral" />
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
          </div>
        </div>

        {/* ARX per Block */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">ARX Mined per Block</h3>
              <p className="text-sm text-muted-foreground">Last 6 blocks</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Block time: ~2.5s</span>
            </div>
          </div>
          <div className="h-64">
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
                  domain={[0, 1200]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="arx" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Recent Blocks</h3>
          <p className="text-sm text-muted-foreground">Latest mined blocks on the network</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Block ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Miner</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reward</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentBlocks.map((block, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-primary">{block.id}</td>
                  <td className="py-3 px-4 text-sm font-mono text-foreground">{block.miner}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{block.reward}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{block.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
