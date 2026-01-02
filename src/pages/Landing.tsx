import { useState } from "react";
import { Zap, Shield, Users, TrendingUp, ArrowRight, Sparkles, Pickaxe, Gift, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth/AuthDialog";
import arxonLogo from "@/assets/arxon-logo.jpg";

const Landing = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const handleGetStarted = () => {
    setAuthMode("signup");
    setShowAuth(true);
  };

  const handleSignIn = () => {
    setAuthMode("signin");
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite 2s',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite 4s',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={arxonLogo} alt="ARXON" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-foreground">ARXON</span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignIn}
            className="border-border/50 hover:bg-secondary/50 text-foreground"
          >
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
              style={{ animation: 'fade-in 0.6s ease-out' }}
            >
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <span>The Future of Web3 Mining is Here</span>
            </div>

            {/* Main Heading */}
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight"
              style={{ animation: 'fade-in 0.6s ease-out 0.1s backwards' }}
            >
              <span className="text-foreground">Mine </span>
              <span className="text-gradient">ARX-P Points</span>
              <br />
              <span className="text-foreground">Earn </span>
              <span className="text-gradient">$ARX Tokens</span>
            </h1>

            {/* Subtitle */}
            <p 
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
              style={{ animation: 'fade-in 0.6s ease-out 0.2s backwards' }}
            >
              Join thousands of miners earning ARX-P points daily. Complete tasks, 
              refer friends, and climb the leaderboard. Your points convert to real $ARX tokens.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              style={{ animation: 'fade-in 0.6s ease-out 0.3s backwards' }}
            >
              <Button
                onClick={handleGetStarted}
                className="btn-glow bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-semibold rounded-xl group"
              >
                <Pickaxe className="h-5 w-5 mr-2" />
                Start Mining Now
                <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                onClick={handleSignIn}
                className="border-border/50 hover:bg-secondary/50 text-foreground px-8 py-6 text-lg rounded-xl"
              >
                I Have an Account
              </Button>
            </div>

            {/* Stats */}
            <div 
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-8 sm:pt-12"
              style={{ animation: 'fade-in 0.6s ease-out 0.4s backwards' }}
            >
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-accent">10</p>
                <p className="text-xs sm:text-sm text-muted-foreground">ARX-P/Hour</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-accent">8hr</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Max Session</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-accent">5%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Referral Boost</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Mine with ARXON?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The easiest way to earn $ARX rewards without expensive hardware
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: "Easy Mining",
                description: "Start mining with one click. No hardware required, just your browser.",
                gradient: "from-amber-500/20 to-orange-600/10",
                border: "border-amber-500/30",
                iconColor: "text-amber-400",
              },
              {
                icon: Gift,
                title: "Referral Rewards",
                description: "Earn bonus points and boost your mining rate by inviting friends.",
                gradient: "from-green-500/20 to-emerald-600/10",
                border: "border-green-500/30",
                iconColor: "text-green-400",
              },
              {
                icon: Trophy,
                title: "Leaderboard",
                description: "Compete with other miners and earn bonus rewards for top rankings.",
                gradient: "from-purple-500/20 to-violet-600/10",
                border: "border-purple-500/30",
                iconColor: "text-purple-400",
              },
              {
                icon: TrendingUp,
                title: "Token Conversion",
                description: "Convert your ARX-P points to real $ARX tokens when available.",
                gradient: "from-blue-500/20 to-sky-600/10",
                border: "border-blue-500/30",
                iconColor: "text-blue-400",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`glass-card p-6 sm:p-8 bg-gradient-to-br ${feature.gradient} ${feature.border} hover:scale-105 transition-transform duration-300`}
                style={{ animation: `fade-in 0.6s ease-out ${0.5 + index * 0.1}s backwards` }}
              >
                <div className={`p-3 rounded-lg bg-secondary/50 ${feature.border} w-fit mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Start Earning in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up with your email. It takes less than 30 seconds.",
              },
              {
                step: "02",
                title: "Start Mining",
                description: "Click the mining button and earn 10 ARX-P points per hour.",
              },
              {
                step: "03",
                title: "Earn Rewards",
                description: "Complete tasks, refer friends, and convert points to tokens.",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative glass-card p-6 sm:p-8 text-center group"
                style={{ animation: `fade-in 0.6s ease-out ${0.6 + index * 0.1}s backwards` }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground font-bold px-4 py-1 rounded-full text-sm">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mt-4 mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={handleGetStarted}
              className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl group"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </section>

        {/* Security Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="glass-card p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30">
                <Shield className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Secure & Transparent
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl">
                Built on blockchain technology, your mining rewards are tracked transparently. 
                All point balances and referral bonuses are verifiable on-chain when you convert to $ARX.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  On-chain Verification
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Real-time Tracking
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Ready to Start Mining?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join the ARXON community today and start earning ARX-P points. 
              The earlier you start, the more you can earn.
            </p>
            <Button
              onClick={handleGetStarted}
              className="btn-glow bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-7 text-xl font-semibold rounded-xl group"
            >
              <Pickaxe className="h-6 w-6 mr-3" />
              Create Free Account
              <ArrowRight className="h-6 w-6 ml-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={arxonLogo} alt="ARXON" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-foreground">ARXON</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ARXON. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
