import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Trophy, Zap, Calendar, CheckCircle2, ListTodo, Twitter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { useMining } from "@/hooks/useMining";
import { useCheckin } from "@/hooks/useCheckin";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import EarningStatistics from "@/components/dashboard/EarningStatistics";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";
import { useState } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points, loading: pointsLoading, rank } = usePoints();
  const { isMining, elapsedTime, formatTime, earnedPoints } = useMining();
  const { canCheckin, performCheckin, currentStreak, loading: checkinLoading } = useCheckin();
  const [showAuth, setShowAuth] = useState(false);

  const handleStartMining = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    navigate('/mining');
  };

  const handleCheckin = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    await performCheckin();
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Overview</h1>
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{currentStreak} day streak</span>
          </div>
        )}
      </div>

      <WelcomeCard
        title="Welcome to ARXON Points Mining! 🚀"
        description="Mine ARX-P points now, convert to $ARX tokens later. Check in daily, complete tasks, and climb the leaderboard!"
        isActive={isMining}
      />

      {/* Daily Check-in Card */}
      {user && (
        <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${canCheckin ? 'bg-primary/20' : 'bg-muted'}`}>
              <Calendar className={`h-5 w-5 ${canCheckin ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium text-foreground">Daily Check-in</p>
              <p className="text-xs text-muted-foreground">
                {canCheckin ? 'Claim your daily bonus!' : 'Come back tomorrow'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCheckin}
            disabled={!canCheckin || checkinLoading}
            className={canCheckin ? 'btn-mining' : 'btn-claimed'}
          >
            {canCheckin ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Check In
              </>
            ) : (
              'Checked In ✓'
            )}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <StatCard 
          label="ARX-P Balance" 
          value={pointsLoading ? '...' : `${points?.total_points?.toLocaleString() || 0}`}
          suffix=" ARX-P"
          icon={<Zap className="h-4 w-4 text-accent" />}
        />
        <StatCard 
          label="Mining Rate" 
          value="+10" 
          suffix=" ARX-P/hr" 
          icon={<Flame className="h-4 w-4 text-orange-500" />}
        />
        <StatCard 
          label="Daily Streak" 
          value={currentStreak.toString()} 
          suffix=" days"
          icon={<Calendar className="h-4 w-4 text-green-500" />}
        />
        <StatCard 
          label="Rank" 
          value={rank ? `#${rank}` : '-'}
          icon={<Trophy className="h-4 w-4 text-yellow-500" />}
        />
      </div>

      {/* Mining Status Card */}
      <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        {isMining ? (
          <>
            <div>
              <p className="text-sm font-medium text-foreground">
                ⛏️ Mining Active
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Session: {formatTime(elapsedTime)} | Earned: {earnedPoints} ARX-P
              </p>
            </div>
            <button 
              onClick={() => navigate('/mining')}
              className="btn-mining w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-2.5"
            >
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-400 animate-pulse" />
              View Mining
              <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Start mining to earn ARX-P points. Max 8 hours per session, 10 points/hour.
            </p>
            <button 
              onClick={handleStartMining}
              className="btn-mining w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-2.5"
            >
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-foreground" />
              Start Mining
              <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
          </>
        )}
      </div>

      {/* Quick Links - Tab Style */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
        <button
          onClick={() => navigate('/tasks')}
          className="relative overflow-hidden p-2 sm:p-3 md:p-4 text-left transition-all duration-200 group cursor-pointer
                     bg-gradient-to-br from-blue-500/20 to-blue-600/10 
                     border border-blue-500/30 rounded-lg sm:rounded-xl
                     shadow-md shadow-blue-500/10
                     hover:from-blue-500/30 hover:to-blue-600/20 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20
                     active:scale-95 active:from-blue-500/40
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 md:gap-3">
            <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-blue-500/20 border border-blue-500/30 shrink-0">
              <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="font-semibold text-[11px] sm:text-xs md:text-sm text-foreground group-hover:text-blue-300 transition-colors truncate">Tasks</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:block">Complete & earn</p>
            </div>
          </div>
          <ArrowRight className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400/50 
                                  group-hover:text-blue-300 group-hover:translate-x-1 transition-all hidden sm:block" />
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="relative overflow-hidden p-2 sm:p-3 md:p-4 text-left transition-all duration-200 group cursor-pointer
                     bg-gradient-to-br from-amber-500/20 to-orange-600/10 
                     border border-amber-500/30 rounded-lg sm:rounded-xl
                     shadow-md shadow-amber-500/10
                     hover:from-amber-500/30 hover:to-orange-600/20 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20
                     active:scale-95 active:from-amber-500/40
                     focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 md:gap-3">
            <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-amber-500/20 border border-amber-500/30 shrink-0">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="font-semibold text-[11px] sm:text-xs md:text-sm text-foreground group-hover:text-amber-300 transition-colors truncate">Leaderboard</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:block">Top 100 miners</p>
            </div>
          </div>
          <ArrowRight className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-amber-400/50 
                                  group-hover:text-amber-300 group-hover:translate-x-1 transition-all hidden sm:block" />
        </button>
        <button
          onClick={() => navigate('/x-profile')}
          className="relative overflow-hidden p-2 sm:p-3 md:p-4 text-left transition-all duration-200 group cursor-pointer
                     bg-gradient-to-br from-blue-500/20 to-sky-600/10 
                     border border-blue-500/30 rounded-lg sm:rounded-xl
                     shadow-md shadow-blue-500/10
                     hover:from-blue-500/30 hover:to-sky-600/20 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20
                     active:scale-95 active:from-blue-500/40
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 md:gap-3">
            <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-blue-500/20 border border-blue-500/30 shrink-0">
              <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="font-semibold text-[11px] sm:text-xs md:text-sm text-foreground group-hover:text-blue-300 transition-colors truncate">X Profile</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:block">Boost mining rate</p>
            </div>
          </div>
          <ArrowRight className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400/50 
                                  group-hover:text-blue-300 group-hover:translate-x-1 transition-all hidden sm:block" />
        </button>
      </div>

      <EarningStatistics />

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Dashboard;
