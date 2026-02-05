 import { memo } from "react";
 import { Zap, Trophy, TrendingUp, ArrowLeft, Medal, Crown, Award } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { useLeaderboard } from "@/hooks/useLeaderboard";
 import { usePoints } from "@/hooks/usePoints";
 import { useAuth } from "@/contexts/AuthContext";
 import ResendBackground from "@/components/effects/ResendBackground";
 import ScrollReveal from "@/components/effects/ScrollReveal";
 import GlowCard from "@/components/effects/GlowCard";
 
 const getRankIcon = (index: number) => {
   if (index === 0) return <Crown className="w-5 h-5 text-amber-400" />;
   if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
   if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
   return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
 };
 
 const formatPoints = (value: number | string | undefined | null): string => {
   if (value === undefined || value === null) return "0";
   const num = typeof value === "string" ? parseFloat(value) : value;
   if (!isFinite(num) || isNaN(num)) return "0";
   const capped = Math.min(Math.max(num, 0), 1_000_000_000);
   return capped.toLocaleString();
 };
 
 const MinerEntry = memo(({ user, index }: { user: any; index: number }) => {
   const isTop3 = index < 3;
   
   return (
     <motion.div
       initial={{ opacity: 0, x: -20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: index * 0.03 }}
       className={`p-4 rounded-xl border transition-all ${
         isTop3 
           ? 'bg-gradient-to-r from-primary/10 to-accent/5 border-primary/30' 
           : 'bg-card/40 border-border/30 hover:border-primary/30'
       }`}
     >
       <div className="flex items-center justify-between gap-4">
         <div className="flex items-center gap-4">
           {/* Rank */}
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
             index === 0 ? 'bg-amber-500/20' :
             index === 1 ? 'bg-slate-400/20' :
             index === 2 ? 'bg-amber-700/20' :
             'bg-muted'
           }`}>
             {getRankIcon(index)}
           </div>
           
           {/* Avatar & Name */}
           <div className="flex items-center gap-3">
             <Avatar className={`w-10 h-10 border-2 ${
               index === 0 ? 'border-amber-400' :
               index === 1 ? 'border-slate-300' :
               index === 2 ? 'border-amber-600' :
               'border-border/50'
             }`}>
               <AvatarImage src={user.avatar_url} />
               <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                 {user.username?.charAt(0)?.toUpperCase() || "M"}
               </AvatarFallback>
             </Avatar>
             <div>
               <p className={`font-semibold ${isTop3 ? 'text-foreground' : 'text-foreground/90'}`}>
                 {user.username || `Miner ${user.user_id?.slice(0, 6)}`}
               </p>
               {isTop3 && (
                 <p className="text-xs text-accent">Top Miner</p>
               )}
             </div>
           </div>
         </div>
         
         {/* Points */}
         <div className="text-right">
           <div className="flex items-center gap-1.5">
             <Zap className={`w-4 h-4 ${isTop3 ? 'text-accent' : 'text-muted-foreground'}`} />
             <span className={`font-bold ${isTop3 ? 'text-lg text-foreground' : 'text-foreground/90'}`}>
               {formatPoints(user.total_points)}
             </span>
           </div>
           <p className="text-xs text-muted-foreground">ARX-P</p>
         </div>
       </div>
     </motion.div>
   );
 });
 MinerEntry.displayName = "MinerEntry";
 
 const Leaderboard = () => {
   const navigate = useNavigate();
   const { leaderboard: minerEntries, loading } = useLeaderboard(100);
   const { points, rank } = usePoints();
   const { user } = useAuth();
 
   const userInTop100 = user ? minerEntries.find(e => e.user_id === user.id) : null;
 
   return (
     <div className="min-h-screen bg-background relative overflow-hidden">
       <ResendBackground variant="subtle" />
       
       {/* Header */}
       <header className="relative z-20 flex items-center justify-between px-4 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
         <motion.button 
           onClick={() => navigate('/')} 
           className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
           whileHover={{ x: -3 }}
         >
           <ArrowLeft className="w-6 h-6" />
         </motion.button>
         <h1 className="font-bold text-foreground text-lg">Leaderboard</h1>
         <div className="w-10" />
       </header>
 
       <main className="relative z-10 px-4 py-6 space-y-6 max-w-2xl mx-auto">
         {/* Your Rank Card */}
         {user && points && (
           <ScrollReveal>
             <GlowCard glowColor="accent" className="p-5">
               <div className="flex items-center justify-between flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
                     <Trophy className="h-7 w-7 text-accent" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Your Global Rank</p>
                     <p className="text-3xl font-bold text-foreground">
                       #{rank || '—'}
                     </p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-sm text-muted-foreground">Your Points</p>
                   <p className="text-2xl font-bold text-accent flex items-center gap-1 justify-end">
                     <Zap className="h-5 w-5" />
                     {formatPoints(points.total_points)}
                   </p>
                 </div>
               </div>
               
               {!userInTop100 && rank && rank > 100 && (
                 <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-muted-foreground">
                   <TrendingUp className="h-4 w-4 text-green-400" />
                   <span className="text-sm">
                     <span className="text-green-400 font-bold">{rank - 100}</span> positions to reach Top 100
                   </span>
                 </div>
               )}
             </GlowCard>
           </ScrollReveal>
         )}
 
         {/* Stats */}
         <ScrollReveal delay={0.1}>
           <div className="grid grid-cols-3 gap-3">
             <div className="glass-card p-4 text-center">
               <p className="text-2xl font-bold text-foreground">{minerEntries.length}</p>
               <p className="text-xs text-muted-foreground">Total Miners</p>
             </div>
             <div className="glass-card p-4 text-center">
               <p className="text-2xl font-bold text-accent">10</p>
               <p className="text-xs text-muted-foreground">ARX-P/hr</p>
             </div>
             <div className="glass-card p-4 text-center">
               <p className="text-2xl font-bold text-foreground">∞</p>
               <p className="text-xs text-muted-foreground">Potential</p>
             </div>
           </div>
         </ScrollReveal>
 
         {/* Leaderboard List */}
         <ScrollReveal delay={0.15}>
           <div className="glass-card p-4 md:p-6">
             <div className="flex items-center gap-2 mb-5">
               <Crown className="h-5 w-5 text-amber-400" />
               <h2 className="text-lg font-bold text-foreground">Top 100 Miners</h2>
             </div>
 
             <div className="space-y-2">
               {loading ? (
                 <div className="flex items-center justify-center py-12">
                   <motion.div
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                   >
                     <Zap className="h-8 w-8 text-accent" />
                   </motion.div>
                 </div>
               ) : minerEntries.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground">
                   <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                   <p className="text-lg font-medium mb-1">No miners yet</p>
                   <p className="text-sm">Start mining to claim the #1 spot!</p>
                 </div>
               ) : (
                 minerEntries.map((miner, index) => (
                   <MinerEntry 
                     key={miner.user_id} 
                     user={miner} 
                     index={index} 
                   />
                 ))
               )}
             </div>
           </div>
         </ScrollReveal>
       </main>
     </div>
   );
 };
 
 export default Leaderboard;
