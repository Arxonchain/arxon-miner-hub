import { Rocket, Clock, Sparkles } from "lucide-react";

const Claim = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Claiming Rewards</h1>

      <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-orb glow-orb-blue w-64 h-64 -top-20 -left-20 animate-pulse" />
          <div className="glow-orb glow-orb-blue w-48 h-48 -bottom-10 -right-10 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          {/* Animated icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center">
              <Rocket className="h-12 w-12 text-accent animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Animated text */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-in">
                Claiming Coming Soon
              </h2>
              <Sparkles className="h-5 w-5 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <p className="text-lg text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Reward claiming will be available once the <span className="text-accent font-semibold">ARXON mainnet</span> goes live.
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-secondary/50 border border-border/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Clock className="h-5 w-5 text-muted-foreground animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-muted-foreground">Mainnet launch in progress...</span>
          </div>

          {/* Decorative dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-accent/60 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Claim;
