import { ChevronDown, Users, Wallet, Copy } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

const Header = ({ onConnectWallet, isWalletConnected }: HeaderProps) => {
  const [referrals] = useState(0);

  return (
    <header className="h-16 bg-background flex items-center justify-between px-6">
      <h1 className="text-2xl font-semibold text-foreground">Overview</h1>

      <div className="flex items-center gap-3">
        {/* Referrals Badge */}
        <div className="flex items-center gap-2 bg-card/60 border border-border/50 rounded-full px-4 py-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Referrals: {referrals}</span>
        </div>

        {/* Share Button */}
        <button className="bg-accent hover:bg-accent/90 text-foreground px-5 py-2 rounded-full text-sm font-medium transition-colors">
          Share with friends
        </button>

        {/* Wallet Address */}
        <div className="flex items-center gap-2 bg-card/60 border border-border/50 rounded-full px-4 py-2">
          <Copy className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">arx1xyz...90f3</span>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-accent flex items-center justify-center overflow-hidden">
            <span className="text-xs font-medium text-foreground">A</span>
          </div>
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default Header;