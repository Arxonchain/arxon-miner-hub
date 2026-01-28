import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Trophy, Zap, Calendar, CheckCircle2, Swords } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { useMining } from "@/hooks/useMining";
import { useCheckin } from "@/hooks/useCheckin";

import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import EarningStatistics from "@/components/dashboard/EarningStatistics";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points, loading: pointsLoading, rank } = usePoints();
  const { isMining, elapsedTime, formatTime, earnedPoints, miningSettings, settingsLoading, pointsPerHour } = useMining();
  const { canCheckin, performCheckin, currentStreak, streakBoost, loading: checkinLoading } = useCheckin();

  const miningDisabled = !settingsLoading && !miningSettings.publicMiningEnabled;

  // Calculate current mining rate with all boosts - real-time from useMining hook
  const currentMiningRate = useMemo(() => {
    return pointsPerHour;
  }, [pointsPerHour]);

  const handleStartMining = () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    navigate('/mining');
  };

  const handleCheckin = async () => {
    if (!user) {
      navigate('/auth?mode=signup');
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
        title="Welcome to ARXON Points Mining!"
        description="Mine ARX-P points now, convert to $ARX tokens later. Check in daily, complete tasks, and climb the leaderboard!"
        isActive={isMining}
      />

      {/* Daily Check-in Card */}
      {user && (
        <div className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${canCheckin ? 'bg-primary/20 animate-pulse' : 'bg-green-500/20'}`}>
              <Calendar className={`h-5 w-5 ${canCheckin ? 'text-primary' : 'text-green-500'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Daily Check-in</p>
                {currentStreak > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                    🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {canCheckin 
                  ? `Check in for +${5 + Math.min(currentStreak + 1, 30)} ARX-P & +${Math.min(currentStreak + 1, 30)}% boost` 
                  : `+${streakBoost}% mining boost active`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCheckin}
            disabled={!canCheckin || checkinLoading}
            className={canCheckin ? 'btn-glow btn-mining' : 'btn-claimed'}
          >
            {canCheckin ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Check In
              </>
            ) : (
              '✓ Checked In'
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
          value={`+${currentMiningRate.toFixed(currentMiningRate % 1 === 0 ? 0 : 1)}`}
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
              className="btn-glow btn-mining w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-2.5"
            >
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-400 animate-pulse" />
              View Mining
              <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {miningDisabled
                ? "Mining is currently paused by the admin."
                : "Start mining to earn ARX-P points. Max 8 hours per session, 10 points/hour."}
            </p>
            <button
              onClick={miningDisabled ? undefined : handleStartMining}
              disabled={miningDisabled}
              className={`btn-glow btn-mining w-full sm:w-auto justify-center text-xs sm:text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-2.5 ${miningDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${miningDisabled ? 'bg-muted-foreground' : 'bg-foreground'}`} />
              {miningDisabled ? 'Mining Disabled' : 'Start Mining'}
              <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </button>
          </>
        )}
      </div>

      {/* Quick Links - Tab Style */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
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
          onClick={() => navigate('/arena')}
          className="relative overflow-hidden p-2 sm:p-3 md:p-4 text-left transition-all duration-200 group cursor-pointer
                     bg-gradient-to-br from-purple-500/20 to-pink-600/10 
                     border border-purple-500/30 rounded-lg sm:rounded-xl
                     shadow-md shadow-purple-500/10
                     hover:from-purple-500/30 hover:to-pink-600/20 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20
                     active:scale-95 active:from-purple-500/40
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 md:gap-3">
            <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-purple-500/20 border border-purple-500/30 shrink-0">
              <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="font-semibold text-[11px] sm:text-xs md:text-sm text-foreground group-hover:text-purple-300 transition-colors truncate">Arena</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:block">Stake & earn</p>
            </div>
          </div>
          <ArrowRight className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-purple-400/50 
                                  group-hover:text-purple-300 group-hover:translate-x-1 transition-all hidden sm:block" />
        </button>
      </div>

      <EarningStatistics />
    </div>
  );
};

export default Dashboard;
