import { ChevronDown, Users, Copy, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

const Header = ({ onConnectWallet, isWalletConnected }: HeaderProps) => {
  const [referrals] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

        {/* User Avatar with Upload */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleAvatarClick}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative">
            <Avatar className="w-9 h-9 border-2 border-accent">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="User avatar" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-medium text-foreground">
                  A
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default Header;