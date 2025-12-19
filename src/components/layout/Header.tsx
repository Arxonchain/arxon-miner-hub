import { Bell, ChevronDown, Users, Wallet } from "lucide-react";
import { useState } from "react";
import arxonLogo from "@/assets/arxon-logo-header.jpeg";

interface HeaderProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

const Header = ({ onConnectWallet, isWalletConnected }: HeaderProps) => {
  const [referrals] = useState(0);

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center">
        <img src={arxonLogo} alt="ARXON" className="h-10 object-contain" />
      </div>

      <div className="flex items-center gap-4">
        {/* Referrals Badge */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">Referrals: {referrals}</span>
        </div>

        {/* Share Button */}
        <button className="btn-share text-sm">
          Share with friends
        </button>

        {/* Connect Wallet Button */}
        <button 
          onClick={onConnectWallet}
          className="btn-wallet"
        >
          <Wallet className="h-4 w-4" />
          {isWalletConnected ? "Wallet" : "Connect Wallet"}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
            <span className="text-sm font-medium text-foreground">A</span>
          </div>
          <span className="w-2 h-2 bg-primary rounded-full" />
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default Header;
