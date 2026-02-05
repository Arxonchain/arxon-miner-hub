 import { motion } from 'framer-motion';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { usePoints } from '@/hooks/usePoints';
 import { useProfile } from '@/hooks/useProfile';
 import { useMiningStatus } from '@/hooks/useMiningStatus';
import { useLeaderboard } from '@/hooks/useLeaderboard';
 import { Button } from '@/components/ui/button';
 import { 
  LogOut, Zap, TrendingUp, Trophy, Send, Swords, 
  Pickaxe, Sparkles, Coins, Activity, Users
 } from 'lucide-react';
 import XIcon from '@/components/icons/XIcon';
 import arxonLogo from '@/assets/arxon-logo.jpg';
 
 export default function Dashboard() {
   const { user, signOut } = useAuth();
   const navigate = useNavigate();
   const { points, rank, loading: pointsLoading } = usePoints();
   const { profile } = useProfile();
   const { isMining } = useMiningStatus();
  const { leaderboard } = useLeaderboard();
 
   const handleSignOut = async () => {
     await signOut();
     navigate('/auth');
   };
 
  const quickLinks = [
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard', color: 'amber' },
    { name: 'Arena', icon: Swords, path: '/arena', color: 'purple' },
    { name: 'Nexus', icon: Send, path: '/nexus', color: 'cyan' },
    { name: 'Mining', icon: Pickaxe, path: '/mining', color: 'primary' },
  ];

  // Calculate real-time stats
  const totalMiners = leaderboard?.length || 0;
  const totalMined = leaderboard?.reduce((sum, u) => sum + (u.total_points || 0), 0) || 0;
 
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
      {/* Subtle background effects */}
      <div className="fixed inset-0 pointer-events-none">
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
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: '800px',
            height: '400px',
            background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>
       
       {/* Header */}
      <header className="border-b border-border/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <motion.img 
               src={arxonLogo} 
               alt="Arxon" 
              className="h-8 w-8 rounded-lg"
               whileHover={{ scale: 1.05 }}
             />
            <span className="text-lg font-bold tracking-tight hidden sm:block">ARXON</span>
           </div>
           <Button 
            variant="ghost" 
             size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs" 
             onClick={handleSignOut}
           >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
             Sign Out
           </Button>
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
            className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between"
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
        <div className="mb-4 p-4 rounded-xl bg-card/30 border border-border/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Total Balance</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Rank</span>
              <span className="text-primary font-medium">#{rank || '—'}</span>
            </div>
           </div>
          <p className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
            {Math.floor(points?.total_points || 0).toLocaleString()}
            <span className="text-lg sm:text-xl text-accent ml-1">ARX-P</span>
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

        {/* Real-time Analytics */}
        <div className="mb-4 p-4 rounded-xl bg-card/30 border border-border/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Live Analytics</span>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto"
            />
           </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">{totalMiners}</p>
              <p className="text-[10px] text-muted-foreground">Active Miners</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">{(totalMined / 1000).toFixed(1)}K</p>
              <p className="text-[10px] text-muted-foreground">Total Mined</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground">10/hr</p>
              <p className="text-[10px] text-muted-foreground">ARX-P Rate</p>
            </div>
          </div>
        </div>
 
         {/* Start Mining CTA - Only show if not mining */}
         {!isMining && (
          <motion.button
            onClick={() => navigate('/mining')}
            className="w-full mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 flex items-center justify-between group"
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
        <div className="rounded-xl bg-card/20 border border-border/10 p-4">
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
                className="w-10 h-10 rounded-lg bg-card/30 border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
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
