import { ChevronDown, Users, Copy, Camera, LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

const Header = ({ onConnectWallet, isWalletConnected }: HeaderProps) => {
  const [referrals] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { profile, uploadAvatar } = useProfile();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const getInitial = () => {
    if (profile?.username) return profile.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
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

        {/* User Avatar with Dropdown */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <Avatar className="w-9 h-9 border-2 border-accent">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="User avatar" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-medium text-foreground">
                      {getInitial()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleAvatarClick} className="cursor-pointer">
              <Camera className="mr-2 h-4 w-4" />
              Change Avatar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;