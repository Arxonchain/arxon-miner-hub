import { Copy, ArrowLeft, Play, Square, Clock, Zap, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useMining } from "@/hooks/useMining";
import { useAuth } from "@/contexts/AuthContext";
import { usePoints } from "@/hooks/usePoints";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";
import { useState, useMemo } from "react";

const Mining = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points } = usePoints();
  const { profile } = useProfile();
  const { 
    isMining, 
    loading, 
    settingsLoading,
    elapsedTime, 
    remainingTime, 
    earnedPoints, 
    maxTimeSeconds,
    startMining, 
    stopMining,
    claimPoints,
    formatTime,
    pointsPerSecond,
    pointsPerHour,
    totalBoostPercentage,
    miningSettings
  } = useMining({ tickMs: 250 });
  const [showAuth, setShowAuth] = useState(false);

  const miningDisabled = !settingsLoading && !miningSettings.publicMiningEnabled;
  const hasBoost = totalBoostPercentage > 0;

  const copyReferralCode = () => {
    const code = profile?.referral_code || "Loading...";
    if (!profile?.referral_code) {
      toast({
        title: "Not Ready",
        description: "Your referral code is still loading",
        variant: "destructive"
      });
      return;
    }
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const handleStartMining = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    startMining();
  };

  // Memoize progress to prevent unnecessary recalculations
  const progressPercentage = useMemo(() => {
    return isMining ? Math.min((elapsedTime / maxTimeSeconds) * 100, 100) : 0;
  }, [isMining, elapsedTime, maxTimeSeconds]);

  const isSessionComplete = elapsedTime >= maxTimeSeconds && !isMining;

  // Memoize formatted times
  const formattedRemainingTime = useMemo(() => formatTime(remainingTime), [remainingTime, formatTime]);
  const formattedElapsedTime = useMemo(() => formatTime(elapsedTime), [elapsedTime, formatTime]);

  // Format earned points - show fractional amounts with appropriate precision
  const formattedEarnedPoints = useMemo(() => {
    if (earnedPoints < 0.01) {
      return earnedPoints.toFixed(6); // Show 6 decimals for tiny amounts
    } else if (earnedPoints < 1) {
      return earnedPoints.toFixed(4); // Show 4 decimals for small amounts
    } else if (earnedPoints < 10) {
      return earnedPoints.toFixed(3); // Show 3 decimals for medium amounts  
    } else {
      return earnedPoints.toFixed(2); // Show 2 decimals for larger amounts
    }
  }, [earnedPoints]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated Background Glow Orbs - Blue Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main center glow */}
        <div 
          className="absolute w-[350px] md:w-[700px] h-[350px] md:h-[700px] rounded-full glow-orb-main"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.7) 0%, hsl(240 70% 50% / 0.3) 40%, transparent 70%)',
            filter: 'blur(60px)',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        
        {/* Right side glow */}
        <div 
          className="absolute w-[250px] md:w-[500px] h-[250px] md:h-[500px] rounded-full glow-orb-right"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.6) 0%, hsl(200 80% 50% / 0.2) 50%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: '5%',
            right: '-5%',
          }}
        />
        
        {/* Left side glow */}
        <div 
          className="absolute w-[300px] md:w-[550px] h-[300px] md:h-[550px] rounded-full glow-orb-left"
          style={{
            background: 'radial-gradient(circle, hsl(220 85% 55% / 0.5) 0%, hsl(240 60% 45% / 0.2) 50%, transparent 70%)',
            filter: 'blur(100px)',
            top: '20%',
            left: '-15%',
          }}
        />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
      >
        <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        <span className="text-sm md:text-base font-medium">Back</span>
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">

        {/* Total Balance Card */}
        <div 
          className="glass-card px-6 sm:px-10 md:px-20 py-4 sm:py-6 md:py-8 mb-4 sm:mb-6 md:mb-8 text-center w-full"
        >
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-1">Total Balance</p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {points?.total_points?.toLocaleString() || 0} <span className="text-lg sm:text-2xl md:text-3xl text-accent">ARX-P</span>
          </h2>
        </div>

        {/* Session Earnings - only show when actively mining */}
        {isMining && (
          <div 
            className="glass-card px-4 sm:px-6 py-3 sm:py-4 mb-4 sm:mb-6 text-center w-full border-green-500/30 bg-green-500/5"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-green-400" />
              <p className="text-xs sm:text-sm text-green-400">Session Earnings</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 font-mono tabular-nums">
              +{formattedEarnedPoints} ARX-P
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              +{pointsPerSecond.toFixed(6)} ARX-P/sec
              {hasBoost && <span className="text-yellow-400 ml-1">• {totalBoostPercentage}% boost</span>}
            </p>
            
            {/* Claim Button - claim anytime */}
            {earnedPoints >= 0.01 && (
              <Button
                onClick={claimPoints}
                className="mt-3 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm"
                size="sm"
              >
                <Zap className="h-3 w-3 mr-1" />
                Claim {Math.floor(earnedPoints)} ARX-P
              </Button>
            )}
          </div>
        )}

        {/* Mining Circle */}
        <div 
          className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-4 sm:mb-6"
        >
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={isMining ? "hsl(142 76% 36%)" : "hsl(var(--primary))"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-full border-2 border-border/50">
            {loading ? (
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : isMining ? (
              <>
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-0.5 sm:mb-1">Time Remaining</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight font-mono">
                  {formattedRemainingTime}
                </p>
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-green-400">Mining Active</span>
                </div>
              </>
            ) : (
              <>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-1 sm:mb-2" />
                <p className="text-muted-foreground text-[10px] sm:text-xs">Session Duration</p>
                <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">8 Hours Max</p>
                <p className="text-[10px] sm:text-xs text-accent mt-0.5 sm:mt-1">
                  +{pointsPerHour.toFixed(hasBoost ? 1 : 0)} ARX-P/hour
                  {hasBoost && <span className="text-yellow-400 ml-1">🔥</span>}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Mining Stats */}
        {isMining && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mb-4 sm:mb-6">
            <div className="glass-card p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Elapsed Time</p>
              <p className="text-sm sm:text-lg font-bold text-foreground font-mono">{formattedElapsedTime}</p>
            </div>
            <div className="glass-card p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Rate</p>
              <p className="text-sm sm:text-lg font-bold text-accent">
                +{pointsPerHour.toFixed(hasBoost ? 1 : 0)} ARX-P/hr
                {hasBoost && <span className="text-yellow-400 ml-1">🔥</span>}
              </p>
            </div>
          </div>
        )}

        {/* Start/Stop Button */}
        <div className="w-full mb-4 sm:mb-6">
          {miningDisabled ? (
            <div className="glass-card p-4 text-center border-destructive/30 bg-destructive/5">
              <p className="text-sm text-destructive font-medium mb-1">Mining Temporarily Disabled</p>
              <p className="text-xs text-muted-foreground">Public mining is currently paused by the admin. Check back later.</p>
            </div>
          ) : isMining ? (
            <Button
              onClick={stopMining}
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
              size="lg"
            >
              <Square className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Stop Mining & Collect
            </Button>
          ) : (
            <Button
              onClick={handleStartMining}
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0"
              size="lg"
            >
              {isSessionComplete ? (
                <>
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start New Session
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start Mining
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info Card */}
        <div className="glass-card p-3 sm:p-4 w-full text-center mb-4 sm:mb-6">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Mine for up to 8 hours per session. Earn {hasBoost ? `${pointsPerHour.toFixed(1)}` : '10'} ARX-P per hour. 
            {isMining ? " Stop anytime to collect your points." : " Start a new session after completion."}
          </p>
        </div>

        {/* Copy Referral */}
        <button
          onClick={copyReferralCode}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
            {profile?.referral_code || "Generating code..."}
          </span>
        </button>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      {/* CSS for glow orb animations - using CSS classes instead of inline styles to prevent flickering */}
      <style>{`
        .glow-orb-main {
          animation: glow-pulse 4s ease-in-out infinite;
        }
        
        .glow-orb-right {
          animation: glow-pulse 5s ease-in-out infinite 1s;
        }
        
        .glow-orb-left {
          animation: glow-pulse 6s ease-in-out infinite 2s;
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Mining;
