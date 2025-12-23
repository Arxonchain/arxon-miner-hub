import { Copy, ArrowLeft, Play, Square, Clock, Zap, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useMining } from "@/hooks/useMining";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";
import { useState } from "react";

const Mining = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { points } = usePoints();
  const { 
    isMining, 
    loading, 
    elapsedTime, 
    remainingTime, 
    earnedPoints, 
    maxTimeSeconds,
    startMining, 
    stopMining, 
    formatTime 
  } = useMining();
  const [showAuth, setShowAuth] = useState(false);

  const copyReferralCode = () => {
    navigator.clipboard.writeText("ARX-REF-12345");
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

  const progressPercentage = isMining 
    ? Math.min((elapsedTime / maxTimeSeconds) * 100, 100) 
    : 0;

  const isSessionComplete = elapsedTime >= maxTimeSeconds && !isMining;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated Background Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full opacity-70"
          style={{
            background: isMining 
              ? 'radial-gradient(circle, hsl(142 76% 36% / 0.6) 0%, transparent 70%)' 
              : 'radial-gradient(circle, hsl(217 91% 60% / 0.6) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'drift-1 15s ease-in-out infinite',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        
        <div 
          className="absolute w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full opacity-50"
          style={{
            background: isMining 
              ? 'radial-gradient(circle, hsl(142 76% 36% / 0.5) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(217 91% 60% / 0.5) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'drift-2 18s ease-in-out infinite',
            bottom: '10%',
            right: '-10%',
          }}
        />
        
        <div 
          className="absolute w-[250px] md:w-[500px] h-[250px] md:h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(210 40% 98% / 0.4) 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'drift-3 20s ease-in-out infinite',
            top: '30%',
            left: '-15%',
          }}
        />

        <div 
          className="absolute w-[175px] md:w-[350px] h-[175px] md:h-[350px] rounded-full opacity-40"
          style={{
            background: isMining 
              ? 'radial-gradient(circle, hsl(142 76% 36% / 0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, hsl(217 91% 60% / 0.4) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'drift-4 12s ease-in-out infinite',
            bottom: '20%',
            left: '30%',
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
      <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in w-full max-w-md">
        {/* Total Balance Card */}
        <div 
          className="glass-card px-6 sm:px-10 md:px-20 py-4 sm:py-6 md:py-8 mb-4 sm:mb-6 md:mb-8 text-center animate-scale-in w-full"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-1">Total Balance</p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {points?.total_points?.toLocaleString() || 0} <span className="text-lg sm:text-2xl md:text-3xl text-accent">ARX-P</span>
          </h2>
        </div>

        {/* Session Earnings */}
        {isMining && (
          <div 
            className="glass-card px-4 sm:px-6 py-3 sm:py-4 mb-4 sm:mb-6 text-center w-full border-green-500/30 bg-green-500/5"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-green-400" />
              <p className="text-xs sm:text-sm text-green-400">Session Earnings</p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400">+{earnedPoints} ARX-P</p>
          </div>
        )}

        {/* Mining Circle */}
        <div 
          className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-4 sm:mb-6"
          style={{ animationDelay: '0.2s' }}
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
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-full border-2 border-border/50">
            {loading ? (
              <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
            ) : isMining ? (
              <>
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-0.5 sm:mb-1">Time Remaining</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {formatTime(remainingTime)}
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
                <p className="text-[10px] sm:text-xs text-accent mt-0.5 sm:mt-1">+10 ARX-P/hour</p>
              </>
            )}
          </div>
        </div>

        {/* Mining Stats */}
        {isMining && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mb-4 sm:mb-6">
            <div className="glass-card p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Elapsed Time</p>
              <p className="text-sm sm:text-lg font-bold text-foreground">{formatTime(elapsedTime)}</p>
            </div>
            <div className="glass-card p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Rate</p>
              <p className="text-sm sm:text-lg font-bold text-accent">+10 ARX-P/hr</p>
            </div>
          </div>
        )}

        {/* Start/Stop Button */}
        <div className="w-full mb-4 sm:mb-6">
          {isMining ? (
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
              disabled={loading}
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
            Mine for up to 8 hours per session. Earn 10 ARX-P per hour. 
            {isMining ? " Stop anytime to collect your points." : " Start a new session after completion."}
          </p>
        </div>

        {/* Copy Referral */}
        <button
          onClick={copyReferralCode}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium">Copy referral code</span>
        </button>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      {/* CSS Keyframes for orb animations */}
      <style>{`
        @keyframes drift-1 {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          25% {
            transform: translateX(-30%) translateY(-20px);
          }
          50% {
            transform: translateX(-70%) translateY(10px);
          }
          75% {
            transform: translateX(-40%) translateY(-10px);
          }
        }
        
        @keyframes drift-2 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          33% {
            transform: translateX(-80px) translateY(-40px);
          }
          66% {
            transform: translateX(-40px) translateY(20px);
          }
        }
        
        @keyframes drift-3 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(100px) translateY(-50px);
          }
        }
        
        @keyframes drift-4 {
          0%, 100% {
            transform: translateX(0) translateY(0) scale(1);
          }
          50% {
            transform: translateX(60px) translateY(-30px) scale(1.1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Mining;