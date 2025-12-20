import { Copy, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Mining = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(890);
  const [countdown, setCountdown] = useState({ minutes: 4, seconds: 34 });
  const [isMining] = useState(true);

  useEffect(() => {
    if (!isMining) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          setEarnings((e) => e + 10);
          return { minutes: 4, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining]);

  const copyReferralCode = () => {
    navigator.clipboard.writeText("ARX-REF-12345");
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated Background Glow Orbs - Smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full opacity-70"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.6) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.5) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.4) 0%, transparent 70%)',
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
        {/* Earnings Card */}
        <div 
          className="glass-card px-10 md:px-20 py-6 md:py-10 mb-8 md:mb-12 text-center animate-scale-in w-full"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-muted-foreground text-base md:text-xl mb-2 md:mb-3">Earning</p>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">{earnings}ARX</h2>
        </div>

        {/* Mining Circle */}
        <div 
          className="mining-circle w-44 h-44 md:w-56 md:h-56 animate-float"
          style={{ animationDelay: '0.2s' }}
        >
          <p className="text-muted-foreground text-xs md:text-sm mb-1 md:mb-2">Next roll call</p>
          <p className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            {String(countdown.minutes).padStart(2, "0")}m {String(countdown.seconds).padStart(2, "0")}s
          </p>
          <button className="status-connected mt-3 md:mt-4 text-xs md:text-sm px-3 py-1 md:px-4 md:py-1.5">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-foreground" />
            Connected
          </button>
        </div>

        {/* Copy Referral */}
        <button
          onClick={copyReferralCode}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-8 md:mt-12 animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <Copy className="h-4 w-4" />
          <span className="text-xs md:text-sm font-medium">Copy referral code</span>
        </button>
      </div>

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
