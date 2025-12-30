import { useState, useEffect } from "react";
import { Power, Coins, RefreshCw, Megaphone, AlertTriangle, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminControls = () => {
  const [settings, setSettings] = useState({
    publicMiningEnabled: true,
    claimingEnabled: false,
    blockReward: 1000,
    consensusMode: "PoW" as "PoW" | "PoS",
    arenaPublicAccess: false,
  });
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("mining_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          publicMiningEnabled: data.public_mining_enabled,
          claimingEnabled: data.claiming_enabled,
          blockReward: data.block_reward,
          consensusMode: data.consensus_mode as "PoW" | "PoS",
          arenaPublicAccess: (data as any).arena_public_access ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const columnMap: Record<string, string> = {
        publicMiningEnabled: "public_mining_enabled",
        claimingEnabled: "claiming_enabled",
        blockReward: "block_reward",
        consensusMode: "consensus_mode",
        arenaPublicAccess: "arena_public_access",
      };

      // First get the settings row ID
      const { data: existingSettings } = await supabase
        .from("mining_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existingSettings) {
        throw new Error("No settings found");
      }

      const { error } = await supabase
        .from("mining_settings")
        .update({ 
          [columnMap[key]]: value, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", existingSettings.id);

      if (error) throw error;

      // If disabling public mining, stop all active mining sessions
      if (key === "publicMiningEnabled" && value === false) {
        const { error: stopError } = await supabase
          .from("mining_sessions")
          .update({ 
            is_active: false, 
            ended_at: new Date().toISOString() 
          })
          .eq("is_active", true);

        if (stopError) {
          console.error("Error stopping active sessions:", stopError);
        } else {
          toast({
            title: "All Mining Sessions Stopped",
            description: "All active mining sessions have been terminated.",
          });
        }
      }

      setSettings((prev) => ({ ...prev, [key]: value }));
      
      const friendlyNames: Record<string, string> = {
        publicMiningEnabled: "Public Mining",
        claimingEnabled: "$ARX Token Claiming",
        blockReward: "Block Reward",
        consensusMode: "Consensus Mode",
        arenaPublicAccess: "Arena Public Access",
      };
      
      toast({
        title: "Setting Updated",
        description: `${friendlyNames[key] || key} has been ${typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : `set to ${value}`}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    try {
      const { error } = await supabase.from("announcements").insert({
        title: "Network Broadcast",
        message: broadcastMessage,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Message Broadcasted",
        description: "Your message has been sent to all miners.",
      });
      setBroadcastMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to broadcast message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mining Controls</h1>
        <p className="text-muted-foreground">Manage ARX-P mining settings and $ARX token controls</p>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 border-primary/30 bg-primary/5">
        <p className="text-sm">
          <span className="font-medium text-foreground">Current Rate:</span> +10 ARX-P/hour | 
          <span className="font-medium text-foreground ml-2">Max Session:</span> 8 hours | 
          <span className="font-medium text-foreground ml-2">Token:</span> ARX-P → $ARX at TGE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Toggle Controls */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Power className="h-5 w-5 text-primary" />
            Network Toggles
          </h3>

          <div className="space-y-4">
            {/* Public Mining */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Public Mining</p>
                <p className="text-sm text-muted-foreground">Enable or disable public mining</p>
              </div>
              <Switch
                checked={settings.publicMiningEnabled}
                onCheckedChange={(checked) => updateSetting("publicMiningEnabled", checked)}
              />
            </div>

            {/* Claiming */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">$ARX Token Claiming</p>
                <p className="text-sm text-muted-foreground">Enable or disable ARX-P to $ARX conversion</p>
              </div>
              <Switch
                checked={settings.claimingEnabled}
                onCheckedChange={(checked) => updateSetting("claimingEnabled", checked)}
              />
            </div>

            {/* Arena Public Access */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Swords className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Arena Public Access</p>
                  <p className="text-sm text-muted-foreground">Enable or disable public access to the Arena</p>
                </div>
              </div>
              <Switch
                checked={settings.arenaPublicAccess}
                onCheckedChange={(checked) => updateSetting("arenaPublicAccess", checked)}
              />
            </div>

            {/* Consensus Mode */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Consensus Mode</p>
                  <p className="text-sm text-muted-foreground">Switch between PoW and PoS</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  settings.consensusMode === "PoW" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent"
                }`}>
                  {settings.consensusMode}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={settings.consensusMode === "PoW" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("consensusMode", "PoW")}
                  className="flex-1"
                >
                  Proof of Work
                </Button>
                <Button
                  variant={settings.consensusMode === "PoS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("consensusMode", "PoS")}
                  className="flex-1"
                >
                  Proof of Stake
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Block Reward */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Mining Reward Settings
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <div>
                <Label htmlFor="blockReward">Block Reward (ARX-P)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="blockReward"
                    type="number"
                    value={settings.blockReward}
                    onChange={(e) => setSettings((prev) => ({ ...prev, blockReward: parseInt(e.target.value) || 0 }))}
                    className="bg-background"
                  />
                  <Button onClick={() => updateSetting("blockReward", settings.blockReward)}>
                    Update
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-500">
                  Changing block rewards affects all active miners immediately. Current rate: +10 ARX-P/hour.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[500, 750, 1000].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting("blockReward", value)}
                  className={settings.blockReward === value ? "border-primary" : ""}
                >
                  {value} ARX-P
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Broadcast Message */}
        <div className="glass-card p-6 space-y-6 lg:col-span-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Broadcast to All Miners
          </h3>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter your message to broadcast to all active miners..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="bg-muted/50 min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleBroadcast} disabled={!broadcastMessage.trim()}>
                <Megaphone className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;
