import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const dailyMinersData = [
  { date: "Dec 13", miners: 18500 },
  { date: "Dec 14", miners: 19200 },
  { date: "Dec 15", miners: 21000 },
  { date: "Dec 16", miners: 20500 },
  { date: "Dec 17", miners: 22800 },
  { date: "Dec 18", miners: 23500 },
  { date: "Dec 19", miners: 24582 },
];

const arxMinedData = [
  { date: "Dec 13", arx: 1250000 },
  { date: "Dec 14", arx: 1380000 },
  { date: "Dec 15", arx: 1520000 },
  { date: "Dec 16", arx: 1450000 },
  { date: "Dec 17", arx: 1680000 },
  { date: "Dec 18", arx: 1720000 },
  { date: "Dec 19", arx: 1890000 },
];

const referralGrowthData = [
  { date: "Dec 13", referrals: 320 },
  { date: "Dec 14", referrals: 450 },
  { date: "Dec 15", referrals: 580 },
  { date: "Dec 16", referrals: 620 },
  { date: "Dec 17", referrals: 780 },
  { date: "Dec 18", referrals: 920 },
  { date: "Dec 19", referrals: 1050 },
];

const deviceData = [
  { name: "Desktop", value: 45, color: "hsl(var(--primary))" },
  { name: "Mobile", value: 38, color: "hsl(var(--accent))" },
  { name: "Tablet", value: 12, color: "hsl(217, 91%, 70%)" },
  { name: "Other", value: 5, color: "hsl(var(--muted-foreground))" },
];

const AdminAnalytics = () => {
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
          </div>
        </div>

        {/* ARX Mined per Day */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">ARX Mined per Day</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <div className="h-64">
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
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M ARX`, 'Mined']}
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

        {/* Referral Growth */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Referral Growth</h3>
            <p className="text-sm text-muted-foreground">New referrals per day</p>
          </div>
          <div className="h-64">
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
          </div>
        </div>

        {/* Device Distribution */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Device Distribution</h3>
            <p className="text-sm text-muted-foreground">Miner device breakdown</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
