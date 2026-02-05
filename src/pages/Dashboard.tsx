 import { motion } from 'framer-motion';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { usePoints } from '@/hooks/usePoints';
 import { useProfile } from '@/hooks/useProfile';
 import { useMiningStatus } from '@/hooks/useMiningStatus';
 import { Button } from '@/components/ui/button';
 import { 
  Zap, TrendingUp, Trophy, Send, Swords, 
  Pickaxe, Sparkles, Coins, Activity, TrendingDown
 } from 'lucide-react';
 import XIcon from '@/components/icons/XIcon';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
 
 export default function Dashboard() {
   const { user, signOut } = useAuth();
   const navigate = useNavigate();
   const { points, rank, loading: pointsLoading } = usePoints();
   const { profile } = useProfile();
   const { isMining } = useMiningStatus();
  
  // Personal analytics state
  const [weeklyEarnings, setWeeklyEarnings] = useState({ current: 0, previous: 0 });
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [activityData, setActivityData] = useState<{day: string; points: number}[]>([]);
 
  useEffect(() => {
    if (!user) return;
    
    const fetchPersonalAnalytics = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch mining sessions for analytics + daily breakdown
      const [currentWeek, previousWeek, todaySessions, activeCount, dailyData] = await Promise.all([
        supabase
          .from('mining_sessions')
          .select('arx_mined')
          .eq('user_id', user.id)
          .gte('started_at', weekAgo),
        supabase
          .from('mining_sessions')
          .select('arx_mined')
          .eq('user_id', user.id)
          .gte('started_at', twoWeeksAgo)
          .lt('started_at', weekAgo),
        supabase
          .from('mining_sessions')
          .select('arx_mined')
          .eq('user_id', user.id)
          .gte('started_at', today),
        supabase
          .from('mining_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('mining_sessions')
          .select('arx_mined, started_at')
          .eq('user_id', user.id)
          .gte('started_at', weekAgo)
          .order('started_at', { ascending: true })
      ]);
      
      const currentTotal = currentWeek.data?.reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;
      const previousTotal = previousWeek.data?.reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;
      const todayTotal = todaySessions.data?.reduce((sum, s) => sum + Number(s.arx_mined || 0), 0) || 0;
      
      setWeeklyEarnings({ current: currentTotal, previous: previousTotal });
      setTodayEarnings(todayTotal);
      setActiveSessions(activeCount.data?.length || 0);
      
      // Process daily data for chart
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyTotals: Record<string, number> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        dailyTotals[key] = 0;
      }
      
      // Sum up points per day
      dailyData.data?.forEach(session => {
        const dayKey = session.started_at.split('T')[0];
        if (dailyTotals[dayKey] !== undefined) {
          dailyTotals[dayKey] += Number(session.arx_mined || 0);
        }
      });
      
      // Convert to chart format
      const chartData = Object.entries(dailyTotals).map(([date, points]) => ({
        day: dayNames[new Date(date).getDay()],
        points: Math.floor(points)
      }));
      
      setActivityData(chartData);
    };
    
    fetchPersonalAnalytics();
  }, [user]);
  
  const earningsTrend = weeklyEarnings.previous > 0 
    ? ((weeklyEarnings.current - weeklyEarnings.previous) / weeklyEarnings.previous * 100).toFixed(1)
    : weeklyEarnings.current > 0 ? 100 : 0;
  const isPositiveTrend = Number(earningsTrend) >= 0;
 
  const quickLinks = [
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard', color: 'amber' },
    { name: 'Arena', icon: Swords, path: '/arena', color: 'purple' },
    { name: 'Nexus', icon: Send, path: '/nexus', color: 'cyan' },
    { name: 'Mining', icon: Pickaxe, path: '/mining', color: 'primary' },
  ];

   if (pointsLoading) {
     return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
         >
           <Zap className="w-12 h-12 text-accent" />
         </motion.div>
       </div>
     );
   }
 
   return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Enhanced background with brand blue glow */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep brand blue ambient glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(217 91% 60% / 0.12) 0%, transparent 60%)',
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 20% 80%, hsl(217 91% 60% / 0.06) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 50% 30% at 80% 60%, hsl(217 91% 60% / 0.05) 0%, transparent 40%)',
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>
       
       {/* Header */}
      <header className="border-b border-primary/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-end">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
         </div>
        </div>
       </header>
       
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl relative z-10">
         {/* Welcome Section */}
        <div className="mb-4 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 mb-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-accent font-medium">Welcome back</span>
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {profile?.username || 'Miner'}
          </h1>
        </div>
 
        {/* Mining Status */}
         {isMining && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Pickaxe className="w-4 h-4 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-primary">Mining Active</p>
               </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => navigate('/mining')}
              className="text-primary hover:text-primary h-7 text-xs"
            >
              View
            </Button>
          </motion.div>
         )}
         
        {/* Balance Card */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/30 to-card/20 border border-primary/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Balance</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Rank</span>
              <span className="text-primary font-medium">#{rank || '—'}</span>
            </div>
           </div>
          <p className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
            {Math.floor(points?.total_points || 0).toLocaleString()}
            <span className="text-lg sm:text-xl text-primary ml-1">ARX-P</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Mined: {Math.floor(points?.mining_points || 0).toLocaleString()}</span>
            <span>Streak: {points?.daily_streak || 0} days</span>
          </div>
        </div>
 
        {/* Quick Actions - Compact 4 buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickLinks.map((link, index) => (
            <motion.button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`p-3 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
                link.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' :
                link.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40' :
                link.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40' :
                'bg-primary/10 border-primary/20 hover:border-primary/40'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <link.icon className={`w-4 h-4 mx-auto mb-1 ${
                link.color === 'amber' ? 'text-amber-400' :
                link.color === 'purple' ? 'text-purple-400' :
                link.color === 'cyan' ? 'text-cyan-400' :
                'text-primary'
              }`} />
              <p className="text-[10px] sm:text-xs font-medium text-foreground">{link.name}</p>
            </motion.button>
          ))}
        </div>

        {/* Personal Analytics */}
        <div className="mb-4 p-4 rounded-xl bg-card/20 border border-primary/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Your Analytics</span>
            <div className={`ml-auto flex items-center gap-1 text-xs ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}>
              {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositiveTrend ? '+' : ''}{earningsTrend}%</span>
            </div>
           </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">{Math.floor(todayEarnings)}</p>
              <p className="text-[10px] text-muted-foreground">Today's ARX-P</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">{Math.floor(weeklyEarnings.current)}</p>
              <p className="text-[10px] text-muted-foreground">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">{activeSessions}</p>
              <p className="text-[10px] text-muted-foreground">Active Sessions</p>
            </div>
          </div>

        {/* Activity Chart */}
        <div className="h-28 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--primary) / 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} ARX-P`, 'Earned']}
              />
              <Area 
                type="monotone" 
                dataKey="points" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPoints)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        </div>
 
        {/* Start Mining CTA - Only show if not mining */}
        {!isMining && (
          <motion.button
            onClick={() => navigate('/mining')}
            className="w-full mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-between group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <Pickaxe className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Start Mining</p>
                <p className="text-xs text-muted-foreground">Earn 10 ARX-P/hour</p>
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </motion.button>
         )}

         {/* Community Section */}
        <div className="rounded-xl bg-card/10 border border-primary/10 p-4">
          <p className="text-xs text-muted-foreground text-center mb-3">Join our community</p>
          <div className="flex items-center justify-center gap-3">
            {[
              { icon: Send, href: 'https://t.me/Arxonofficial', label: 'Telegram' },
              { icon: XIcon, href: 'https://x.com/arxonarx', label: 'X' },
              { icon: Users, href: 'https://discord.gg/7FXxFDTqwj', label: 'Discord' },
            ].map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <social.icon className="h-4 w-4" />
              </motion.a>
            ))}
           </div>
        </div>
       </main>
     </div>
   );
 }
