import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const earningData = [
  { day: "Mon", mining: 120, referral: 30 },
  { day: "Tue", mining: 180, referral: 45 },
  { day: "Wed", mining: 250, referral: 80 },
  { day: "Thu", mining: 320, referral: 120 },
  { day: "Fri", mining: 480, referral: 150 },
  { day: "Sat", mining: 620, referral: 220 },
  { day: "Sun", mining: 890, referral: 280 },
];

const EarningStatistics = () => {
  const totalMining = earningData.reduce((sum, d) => sum + d.mining, 0);
  const totalReferral = earningData.reduce((sum, d) => sum + d.referral, 0);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Earning statistics</h3>
          <p className="text-sm text-muted-foreground">Your revenue graph generated based on your mining activity</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mining Earnings</p>
            <p className="text-lg font-bold text-primary">{totalMining.toLocaleString()} ARX</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Referral Earnings</p>
            <p className="text-lg font-bold text-accent">{totalReferral.toLocaleString()} ARX</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={earningData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="miningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="referralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
              width={40}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 11%)', 
                border: '1px solid hsl(217 33% 17%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)'
              }}
              labelStyle={{ color: 'hsl(215 20% 65%)' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="mining"
              name="Mining"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              fill="url(#miningGradient)"
            />
            <Area
              type="monotone"
              dataKey="referral"
              name="Referral"
              stroke="hsl(142 76% 36%)"
              strokeWidth={2}
              fill="url(#referralGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EarningStatistics;
