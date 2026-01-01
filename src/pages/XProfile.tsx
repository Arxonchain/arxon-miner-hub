import { useState } from "react";
import { Link2, Unlink, Check, RefreshCw, Zap, Loader2, Gift, Clock, Heart, Repeat, MessageCircle } from "lucide-react";
import XIcon from "@/components/icons/XIcon";
import { useXProfile } from "@/hooks/useXProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMining } from "@/hooks/useMining";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/auth/AuthDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const XProfilePage = () => {
  const { user } = useAuth();
  const { pointsPerHour, totalBoostPercentage, referralBonus, xProfileBoost, xPostBoost, totalArenaBoost } = useMining();
  const { 
    xProfile, 
    postRewards,
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
            <XIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
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
            <XIcon className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
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
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
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

          {/* Boost Stats with Breakdown */}
          <div className="glass-card p-3 sm:p-4 md:p-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h3 className="font-medium text-sm sm:text-base text-foreground">Your Boost Breakdown</h3>
            </div>
            
            {/* Boost Sources */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="text-center p-2 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{xProfileBoost}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">X Scan Boost</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{xPostBoost}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">X Post Boost</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xl sm:text-2xl font-bold text-green-400">{referralBonus}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Referral Boost</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-xl sm:text-2xl font-bold text-orange-400">{totalArenaBoost}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Arena Boost</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30 col-span-2 sm:col-span-1">
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{totalBoostPercentage}%</p>
                <p className="text-[10px] sm:text-xs text-yellow-400 font-medium">TOTAL BOOST</p>
              </div>
            </div>
            
            {/* X Profile Quick Stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{xProfile.qualified_posts_today}</p>
                <p className="text-[10px] text-muted-foreground">Posts Today</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{xProfile.average_engagement}</p>
                <p className="text-[10px] text-muted-foreground">Avg Engagement</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{xProfile.viral_bonus ? '🔥' : '—'}</p>
                <p className="text-[10px] text-muted-foreground">Viral Bonus</p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your mining rate: <span className="text-yellow-400 font-semibold">{pointsPerHour.toFixed(1)} ARX-P/hour</span>
                <span className="text-muted-foreground"> (base 10 + {totalBoostPercentage}% total boost)</span>
              </p>
            </div>
          </div>

          {/* Historical Rewards Section */}
          <div className="glass-card p-3 sm:p-4 md:p-6 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-400" />
                <h3 className="font-medium text-sm sm:text-base text-foreground">Prior ARXON Posts Rewards</h3>
              </div>
              {!xProfile.historical_scanned && !scanning && (
                <Button
                  onClick={refreshBoost}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 text-purple-400 hover:text-purple-300"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Scan Now
                </Button>
              )}
            </div>

            {scanning ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-400 mb-2" />
                <p className="text-xs text-muted-foreground">Scanning posts (takes ~6 seconds)...</p>
              </div>
            ) : postRewards.length > 0 ? (
              <>
                {/* Historical Totals */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-purple-400">{postRewards.length}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Prior Posts</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                      {postRewards.reduce((sum, r) => sum + Number(r.arx_p_reward), 0)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">ARX-P Earned</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                      +{postRewards.reduce((sum, r) => sum + Number(r.boost_reward), 0)}%
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Boost Earned</p>
                  </div>
                </div>

                {/* Individual Post Rewards */}
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Rewards breakdown per post:</p>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2 pr-3">
                      {postRewards.map((reward) => (
                        <div 
                          key={reward.id} 
                          className="p-3 bg-background/30 rounded-lg border border-border/30"
                        >
                          <p className="text-xs sm:text-sm text-foreground line-clamp-2 mb-2">
                            {reward.tweet_text}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reward.tweet_created_at ? new Date(reward.tweet_created_at).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-400" />
                              {reward.like_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Repeat className="h-3 w-3 text-green-400" />
                              {reward.retweet_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3 text-blue-400" />
                              {reward.reply_count}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
                            <span className="text-xs font-medium text-green-400">+{reward.arx_p_reward} ARX-P</span>
                            <span className="text-xs font-medium text-yellow-400">+{reward.boost_reward}% Boost</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <XIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {xProfile.historical_scanned ? 'No prior posts about ARXON found' : 'Historical posts not scanned yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {xProfile.historical_scanned 
                    ? <>Start posting with <span className="text-blue-400">#Arxon</span>, <span className="text-blue-400">#ArxonMining</span>, <span className="text-blue-400">#Arxonchain</span>, or <span className="text-blue-400">@Arxonarx</span> to earn rewards!</>
                    : 'Click "Scan Now" to check for prior ARXON posts'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default XProfilePage;