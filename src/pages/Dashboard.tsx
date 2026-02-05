 import { motion } from 'framer-motion';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { usePoints } from '@/hooks/usePoints';
 import { useProfile } from '@/hooks/useProfile';
 import { useMiningStatus } from '@/hooks/useMiningStatus';
 import { Button } from '@/components/ui/button';
 import { 
   LogOut, Zap, TrendingUp, Trophy, Send, Users, Target, Swords, 
  Pickaxe, ChevronRight, Sparkles, BarChart3, Coins, Shield, Settings
 } from 'lucide-react';
 import XIcon from '@/components/icons/XIcon';
 import arxonLogo from '@/assets/arxon-logo.jpg';
 import ResendBackground from '@/components/effects/ResendBackground';
 import ScrollReveal from '@/components/effects/ScrollReveal';
 import GlowCard from '@/components/effects/GlowCard';
 
 export default function Dashboard() {
   const { user, signOut } = useAuth();
   const navigate = useNavigate();
   const { points, rank, loading: pointsLoading } = usePoints();
   const { profile } = useProfile();
   const { isMining } = useMiningStatus();
 
   const handleSignOut = async () => {
     await signOut();
     navigate('/auth');
   };
 
   const quickLinks = [
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard', color: 'amber', desc: 'Top miners' },
    { name: 'Arena', icon: Swords, path: '/arena', color: 'purple', desc: 'Predict & win' },
    { name: 'Nexus', icon: Send, path: '/nexus', color: 'cyan', desc: 'Send ARX-P' },
    { name: 'Tasks', icon: Target, path: '/tasks', color: 'green', desc: 'Complete & earn' },
   ];
 
   if (pointsLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
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
     <div className="min-h-screen bg-background overflow-x-hidden">
       <ResendBackground variant="default" />
       
       {/* Header */}
       <header className="border-b border-border/20 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <motion.img 
               src={arxonLogo} 
               alt="Arxon" 
               className="h-10 w-10 rounded-lg"
               whileHover={{ scale: 1.05 }}
             />
             <span className="text-xl font-bold tracking-tight">ARXON</span>
           </div>
           <Button 
             variant="outline" 
             size="sm" 
             className="border-border/40 hover:bg-card/50" 
             onClick={handleSignOut}
           >
             <LogOut className="h-4 w-4 mr-2" />
             Sign Out
           </Button>
         </div>
       </header>
       
       <main className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
         {/* Welcome Section */}
         <ScrollReveal>
           <div className="mb-8">
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2 mb-2"
             >
               <Sparkles className="w-5 h-5 text-accent" />
               <span className="text-sm text-accent font-medium">Welcome back</span>
             </motion.div>
             <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
               Hello, {profile?.username || 'Miner'}!
             </h1>
             <p className="text-muted-foreground">{user?.email}</p>
           </div>
         </ScrollReveal>
 
         {/* Mining Status Banner */}
         {isMining && (
           <ScrollReveal delay={0.1}>
             <motion.div 
              className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between"
               animate={{ 
                boxShadow: ['0 0 20px hsl(var(--primary) / 0.1)', '0 0 40px hsl(var(--primary) / 0.2)', '0 0 20px hsl(var(--primary) / 0.1)']
               }}
               transition={{ duration: 2, repeat: Infinity }}
             >
               <div className="flex items-center gap-3">
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                 >
                  <Pickaxe className="w-6 h-6 text-primary" />
                 </motion.div>
                 <div>
                  <p className="font-bold text-primary">Mining Active</p>
                  <p className="text-xs text-primary/70">Earning ARX-P in the background</p>
                 </div>
               </div>
               <Button 
                 size="sm" 
                 onClick={() => navigate('/mining')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
               >
                 View Session
               </Button>
             </motion.div>
           </ScrollReveal>
         )}
         
         {/* Main Stats Grid */}
         <ScrollReveal delay={0.15}>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <GlowCard glowColor="accent" className="p-5">
               <div className="flex items-center gap-2 mb-2">
                 <Coins className="h-4 w-4 text-accent" />
                 <span className="text-xs text-muted-foreground">Total Balance</span>
               </div>
               <p className="text-2xl md:text-3xl font-bold text-foreground">
                 {Math.floor(points?.total_points || 0).toLocaleString()}
               </p>
               <p className="text-xs text-accent mt-1">ARX-P</p>
             </GlowCard>
             
             <GlowCard glowColor="primary" className="p-5">
               <div className="flex items-center gap-2 mb-2">
                 <Trophy className="h-4 w-4 text-primary" />
                 <span className="text-xs text-muted-foreground">Global Rank</span>
               </div>
               <p className="text-2xl md:text-3xl font-bold text-foreground">
                 #{rank || '—'}
               </p>
               <p className="text-xs text-primary mt-1">Leaderboard</p>
             </GlowCard>
             
              <GlowCard glowColor="primary" className="p-5">
               <div className="flex items-center gap-2 mb-2">
                  <Pickaxe className="h-4 w-4 text-primary" />
                 <span className="text-xs text-muted-foreground">Mining Points</span>
               </div>
               <p className="text-2xl md:text-3xl font-bold text-foreground">
                 {Math.floor(points?.mining_points || 0).toLocaleString()}
               </p>
                <p className="text-xs text-primary mt-1">Mined</p>
             </GlowCard>
             
             <GlowCard glowColor="amber" className="p-5">
               <div className="flex items-center gap-2 mb-2">
                 <TrendingUp className="h-4 w-4 text-amber-400" />
                 <span className="text-xs text-muted-foreground">Daily Streak</span>
               </div>
               <p className="text-2xl md:text-3xl font-bold text-foreground">
                 {points?.daily_streak || 0}
               </p>
               <p className="text-xs text-amber-400 mt-1">Days</p>
             </GlowCard>
           </div>
         </ScrollReveal>
 
         {/* Quick Actions */}
         <ScrollReveal delay={0.2}>
           <div className="mb-8">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-accent" />
                 Quick Actions
               </h2>
             </div>
             
              <div className="grid grid-cols-2 gap-3">
               {quickLinks.map((link, index) => (
                 <motion.button
                   key={link.path}
                   onClick={() => navigate(link.path)}
                    className={`relative p-4 md:p-5 rounded-2xl backdrop-blur-xl border text-left group overflow-hidden ${
                      link.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
                      link.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30' :
                      link.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30' :
                      link.color === 'green' ? 'bg-green-500/10 border-green-500/30' :
                      'bg-card/50 border-border/40'
                    }`}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 * index }}
                   whileHover={{ 
                     scale: 1.02,
                   }}
                 >
                   {/* Hover glow */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                      link.color === 'amber' ? 'bg-gradient-to-br from-amber-500/20 to-transparent' :
                      link.color === 'purple' ? 'bg-gradient-to-br from-purple-500/20 to-transparent' :
                      link.color === 'cyan' ? 'bg-gradient-to-br from-cyan-500/20 to-transparent' :
                      link.color === 'green' ? 'bg-gradient-to-br from-green-500/20 to-transparent' :
                      'bg-gradient-to-br from-primary/10 to-accent/5'
                    }`} />
                   
                   <div className="relative z-10">
                     <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                       link.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        link.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        link.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                        link.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        'bg-primary/20 text-primary'
                     }`}>
                       <link.icon className="w-5 h-5" />
                     </div>
                     <p className="font-bold text-foreground mb-0.5">{link.name}</p>
                     <p className="text-xs text-muted-foreground">{link.desc}</p>
                   </div>
                   
                   <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </motion.button>
               ))}
             </div>
           </div>
         </ScrollReveal>
 
         {/* Start Mining CTA - Only show if not mining */}
         {!isMining && (
           <ScrollReveal delay={0.25}>
             <motion.div
                className="mb-6 p-6 md:p-8 rounded-3xl relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))',
                 border: '1px solid hsl(var(--primary) / 0.3)',
               }}
             >
               {/* Background effect */}
               <div className="absolute inset-0 opacity-30">
                 <motion.div
                   className="absolute w-96 h-96 rounded-full bg-primary/30 blur-3xl"
                   animate={{
                     x: [-50, 50, -50],
                     y: [-30, 30, -30],
                   }}
                   transition={{ duration: 8, repeat: Infinity }}
                   style={{ left: '-10%', top: '-50%' }}
                 />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="text-center md:text-left">
                   <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                     Start Mining ARX-P
                   </h3>
                   <p className="text-muted-foreground text-sm md:text-base">
                     Earn 10 ARX-P per hour. Sessions run for up to 8 hours.
                   </p>
                 </div>
                 <Button
                   size="lg"
                   onClick={() => navigate('/mining')}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-6 text-lg font-bold"
                 >
                   <Pickaxe className="w-5 h-5 mr-2" />
                   Start Mining
                 </Button>
               </div>
             </motion.div>
           </ScrollReveal>
         )}

          {/* Additional Quick Links Row */}
          <ScrollReveal delay={0.3}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <motion.button
                onClick={() => navigate('/mining')}
                className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center group"
                whileHover={{ scale: 1.02 }}
              >
                <Pickaxe className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Mining</p>
              </motion.button>
              <motion.button
                onClick={() => navigate('/referrals')}
                className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-center group"
                whileHover={{ scale: 1.02 }}
              >
                <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
                <p className="text-sm font-medium text-foreground">Referrals</p>
              </motion.button>
              <motion.button
                onClick={() => navigate('/profile')}
                className="p-4 rounded-xl bg-muted/50 border border-border/30 text-center group"
                whileHover={{ scale: 1.02 }}
              >
                <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Profile</p>
              </motion.button>
            </div>
          </ScrollReveal>
 
         {/* Community Section */}
          <ScrollReveal delay={0.35}>
           <div className="rounded-2xl bg-card/30 border border-border/30 backdrop-blur-sm p-6">
             <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">Join our community</h3>
             <div className="flex items-center justify-center gap-4">
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
                   className="w-12 h-12 rounded-xl bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300"
                   whileHover={{ scale: 1.1, y: -2 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   <social.icon className="h-5 w-5" />
                 </motion.a>
               ))}
             </div>
           </div>
         </ScrollReveal>
       </main>
     </div>
   );
 }
