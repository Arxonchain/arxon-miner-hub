import { Bell, ChevronDown, Users, Wallet, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import arxonLogo from "@/assets/arxon-logo-header.jpeg";
import MobileNav from "./MobileNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeaderProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

const Header = ({ onConnectWallet, isWalletConnected }: HeaderProps) => {
  const [referrals] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleWalletClick = () => {
    setShowWalletModal(true);
  };

  return (
    <>
      <header className="h-14 md:h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <MobileNav />
          <img src={arxonLogo} alt="ARXON" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Referrals Badge - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Referrals: {referrals}</span>
          </div>

          {/* Share Button - Hidden on mobile */}
          <button className="hidden md:block btn-share text-sm">
            Share with friends
          </button>

          {/* Connect Wallet Button */}
          <button 
            onClick={handleWalletClick}
            className="btn-wallet text-xs md:text-sm px-3 md:px-6 py-2 md:py-2.5"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{isWalletConnected ? "Wallet" : "Connect Wallet"}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-1.5 md:p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-1 md:gap-2 cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
              <span className="text-xs md:text-sm font-medium text-foreground">A</span>
            </div>
            <span className="hidden md:block w-2 h-2 bg-primary rounded-full" />
            <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Wallet Coming Soon Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20 overflow-hidden mx-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-center text-xl md:text-2xl font-bold text-foreground">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
                <span>Coming Soon</span>
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 py-4 md:py-6">
            {/* Animated wallet icon */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
                <Wallet className="h-10 w-10 md:h-12 md:w-12 text-primary" />
              </div>
              {/* Orbiting elements */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
                <Zap className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                <Sparkles className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            </div>
            
            {/* Text content */}
            <div className="text-center space-y-2 md:space-y-3 px-4">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                Wallet Connect
              </h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-xs">
                We're building something amazing! Wallet integration will be available soon.
              </p>
            </div>
            
            {/* Animated progress dots */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
