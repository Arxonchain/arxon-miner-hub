import { useState, useEffect } from "react";
import { User, Wallet, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  username: string;
  avatar_url: string;
  wallet_address: string;
}

const ProfileSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    avatar_url: "",
    wallet_address: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: claimData } = await supabase
        .from("claims")
        .select("wallet_address")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile({
        username: profileData?.username || "",
        avatar_url: profileData?.avatar_url || "",
        wallet_address: claimData?.wallet_address || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in to update your profile",
          variant: "destructive",
        });
        return;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({
            username: profile.username,
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("profiles").insert({
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-accent/30">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="bg-accent/20 text-accent text-lg sm:text-xl">
            {profile.username?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatar_url" className="text-sm text-muted-foreground">
            Avatar URL
          </Label>
          <Input
            id="avatar_url"
            placeholder="https://example.com/avatar.png"
            value={profile.avatar_url}
            onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
            className="mt-1 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2 text-foreground">
          <User className="h-4 w-4 text-accent" />
          Username
        </Label>
        <Input
          id="username"
          placeholder="Enter your mining alias"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          className="bg-secondary/50 border-border/50"
        />
        <p className="text-xs text-muted-foreground">
          This will be displayed on the leaderboard
        </p>
      </div>

      {/* Wallet Address - Read Only */}
      <div className="space-y-2">
        <Label htmlFor="wallet" className="flex items-center gap-2 text-foreground">
          <Wallet className="h-4 w-4 text-accent" />
          Wallet Address
        </Label>
        <Input
          id="wallet"
          value={profile.wallet_address || "Not connected"}
          readOnly
          className="bg-secondary/30 border-border/30 text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Connect your wallet from the Claim page to receive ARX tokens
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Profile
      </Button>
    </div>
  );
};

export default ProfileSettings;
