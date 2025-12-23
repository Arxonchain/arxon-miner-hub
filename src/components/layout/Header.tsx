import { Bell, ChevronDown, Wallet, Zap, LogIn, Pickaxe } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import arxonLogo from "@/assets/arxon-logo-header.jpeg";
import MobileNav from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { useMining } from "@/hooks/useMining";
import AuthDialog from "@/components/auth/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { points } = usePoints();
  const { isMining, elapsedTime, formatTime } = useMining();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return (
    <>
      <header className="h-14 lg:h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <img src={arxonLogo} alt="ARXON" className="h-7 md:h-8 lg:h-10 object-contain" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
          {/* Mining Status Indicator */}
          <button
            onClick={() => navigate('/mining')}
            className={`flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg transition-all ${
              isMining 
                ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30' 
                : 'bg-secondary/50 hover:bg-secondary/70'
            }`}
          >
            <div className="relative">
              <Pickaxe className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${isMining ? 'text-green-400' : 'text-muted-foreground'}`} />
              {isMining && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className={`text-[10px] sm:text-xs lg:text-sm font-medium ${isMining ? 'text-green-400' : 'text-muted-foreground'}`}>
              {isMining ? (
                <span className="hidden xs:inline">{formatTime(elapsedTime)}</span>
              ) : (
                <span className="hidden sm:inline">Mine</span>
              )}
            </span>
          </button>

          {/* Points Display */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 lg:gap-2 bg-secondary/50 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg">
              <Zap className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-accent" />
              <span className="text-xs lg:text-sm font-medium text-foreground">
                {points?.total_points?.toLocaleString() || 0} ARX-P
              </span>
            </div>
          )}

          {/* Connect Wallet Button */}
          <button 
            onClick={() => navigate('/wallet')}
            className="btn-wallet text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-2.5"
          >
            <Wallet className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="hidden xs:inline sm:inline">Wallet</span>
          </button>

          {/* Auth Button / User Menu */}
          {user ? (
            <>
              {/* Notifications */}
              <button className="relative p-1 sm:p-1.5 lg:p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 lg:top-1 lg:right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-primary rounded-full" />
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 lg:gap-2 cursor-pointer">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                      <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-primary-foreground">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="hidden md:block h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthDialog(true)}
              className="btn-mining text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2"
            >
              <LogIn className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  );
};

export default Header;
