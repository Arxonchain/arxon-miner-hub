import { useState } from "react";
import { Twitter, Link2, Unlink, Check, RefreshCw, Zap, Loader2 } from "lucide-react";
import { useXProfile } from "@/hooks/useXProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/auth/AuthDialog";

const XProfilePage = () => {
  const { user } = useAuth();
  const { 
    xProfile, 
    loading, 
    scanning,
    connectXProfile, 
    disconnectXProfile,
    refreshBoost
  } = useXProfile();
  const [showAuth, setShowAuth] = useState(false);
  const [xProfileInput, setXProfileInput] = useState('');

  const handleConnect = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const success = await connectXProfile(xProfileInput);
    if (success) {
      setXProfileInput('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Connect X Account</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Link your X profile to boost your mining rate
        </p>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-3 sm:p-4 md:p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 shrink-0">
            <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-foreground">Why Connect Your X Account?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Post about Arxon on X and earn up to 800% mining boost! Your posts are scanned every 6 hours 
              to calculate your boost based on qualified posts, engagement, and viral potential.
            </p>
          </div>
        </div>
      </div>

      {/* Boost Info */}
      <div className="glass-card p-3 sm:p-4 md:p-6">
        <h3 className="font-medium text-sm sm:text-base text-foreground mb-2 sm:mb-3">How to Earn Boost</h3>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
          <p>• Post with hashtags: <span className="text-blue-400">#ArxonMining</span>, <span className="text-blue-400">#Arxon</span>, <span className="text-blue-400">#Arxonchain</span></p>
          <p>• Mention: <span className="text-blue-400">@Arxonarx</span></p>
          <p>• More posts = higher boost (up to 800%)</p>
          <p>• Higher engagement = bonus multiplier</p>
          <p>• Viral posts (1000+ likes) = extra bonus</p>
        </div>
      </div>

      {!xProfile ? (
        <div className="glass-card p-6 sm:p-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Twitter className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          </div>
          <h3 className="font-medium text-sm sm:text-base text-foreground mb-2 text-center">Connect Your X Profile</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">
            Enter your X username or profile URL to start earning boost
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              placeholder="@username or x.com/username"
              value={xProfileInput}
              onChange={(e) => setXProfileInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleConnect}
              disabled={scanning || !xProfileInput}
              className="btn-mining text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Connected Profile */}
          <div className="glass-card p-3 sm:p-4 md:p-5 border-blue-500/50 bg-blue-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 shrink-0">
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className="font-medium text-sm sm:text-base text-foreground">
                      @{xProfile.username}
                    </p>
                    <span className="shrink-0 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs rounded-full">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Connected
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Last scanned {xProfile.last_scanned_at ? new Date(xProfile.last_scanned_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  onClick={refreshBoost}
                  disabled={scanning}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 ${scanning ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={disconnectXProfile}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 sm:h-8 px-2 sm:px-3"
                >
                  <Unlink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Boost Stats */}
          <div className="glass-card p-3 sm:p-4 md:p-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h3 className="font-medium text-sm sm:text-base text-foreground">Your Boost Stats</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{xProfile.boost_percentage}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Current Boost</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{xProfile.qualified_posts_today}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Posts Today</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{xProfile.average_engagement}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Engagement</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {xProfile.viral_bonus ? '🔥' : '—'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Viral Bonus</p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your mining rate: <span className="text-yellow-400 font-semibold">{(10 * (1 + xProfile.boost_percentage / 100)).toFixed(1)} ARX-P/hour</span>
                <span className="text-muted-foreground"> (base 10 ARX-P/hour + {xProfile.boost_percentage}% boost)</span>
              </p>
            </div>
          </div>
        </>
      )}

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default XProfilePage;
