import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Eye, Activity, Coins, Users, Calendar, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface XProfileData {
  id: string;
  username: string;
  profile_url: string;
  boost_percentage: number;
  average_engagement: number;
  viral_bonus: boolean;
  qualified_posts_today: number;
  historical_scanned: boolean;
  historical_posts_count: number;
  historical_arx_p_total: number;
  historical_boost_total: number;
  last_scanned_at: string | null;
  created_at: string;
}

interface BoostBreakdown {
  xScanBoost: number;
  xPostBoost: number;
  referralBoost: number;
  arenaBoost: number;
  totalBoostPercentage: number;
  effectiveMiningRate: number;
  claimedXPostsCount: number;
  referralCount: number;
}

interface UserSnapshot {
  userId: string;
  profile: any;
  points: any;
  wallets: any[];
  referrals: { given: any[]; received: any[]; count: number };
  xProfile: XProfileData | null;
  xRewards: any[];
  socialSubmissions: any[];
  miningSessions: any[];
  arenaVotes: any[];
  arenaBoosts: any[];
  badges: any[];
  boostBreakdown: BoostBreakdown;
  stats: {
    totalPoints: number;
    miningPoints: number;
    taskPoints: number;
    socialPoints: number;
    referralPoints: number;
    dailyStreak: number;
    totalSessions: number;
    activeSessions: number;
    totalArxMined: number;
    arenaVotesCount: number;
    arenaPowerSpent: number;
  };
}

interface UserData {
  user_id: string;
  email: string;
  username: string;
  created_at: string;
  wallet: string | null;
  total_points: number;
  mining_points: number;
  task_points: number;
  social_points: number;
  referral_points: number;
  daily_streak: number;
  referral_code: string | null;
  referral_count: number;
  total_sessions: number;
  active_session: boolean;
  last_active: string | null;
  total_arx_mined: number;
  x_profile: XProfileData | null;
  arena_votes: number;
  arena_power_spent: number;
  referral_bonus_percentage: number;
  x_post_boost_percentage: number;
}

interface MiningSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  arx_mined: number;
  is_active: boolean;
}

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch all users with comprehensive data
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-comprehensive"],
    queryFn: async () => {
      // Fetch profiles with auth info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, referral_code, created_at, avatar_url");

      if (profilesError) throw profilesError;

      // Fetch user points
      const { data: points, error: pointsError } = await supabase
        .from("user_points")
        .select("*");

      if (pointsError) throw pointsError;

      // Fetch wallets
      const { data: wallets, error: walletsError } = await supabase
        .from("user_wallets")
        .select("user_id, wallet_address, is_primary");

      if (walletsError) throw walletsError;

      // Fetch mining sessions aggregated
      const { data: sessions, error: sessionsError } = await supabase
        .from("mining_sessions")
        .select("user_id, arx_mined, is_active, started_at, ended_at");

      if (sessionsError) throw sessionsError;

      // Fetch referrals count
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("referrer_id");

      if (referralsError) throw referralsError;

      // Fetch X profiles with all data
      const { data: xProfiles, error: xError } = await supabase
        .from("x_profiles")
        .select("*");

      if (xError) throw xError;

      // Fetch arena votes aggregated
      const { data: arenaVotes, error: arenaError } = await supabase
        .from("arena_votes")
        .select("user_id, power_spent");

      if (arenaError) throw arenaError;

      // Build lookup maps
      const pointsMap = new Map(points?.map(p => [p.user_id, p]) || []);
      const walletMap = new Map(wallets?.filter(w => w.is_primary).map(w => [w.user_id, w.wallet_address]) || []);
      const xProfileMap = new Map<string, XProfileData>(xProfiles?.map(x => [x.user_id, {
        id: x.id,
        username: x.username,
        profile_url: x.profile_url,
        boost_percentage: x.boost_percentage,
        average_engagement: x.average_engagement,
        viral_bonus: x.viral_bonus,
        qualified_posts_today: x.qualified_posts_today,
        historical_scanned: x.historical_scanned,
        historical_posts_count: x.historical_posts_count,
        historical_arx_p_total: Number(x.historical_arx_p_total),
        historical_boost_total: x.historical_boost_total,
        last_scanned_at: x.last_scanned_at,
        created_at: x.created_at,
      }]) || []);
      
      // Aggregate referrals by referrer
      const referralCounts = new Map<string, number>();
      referrals?.forEach(r => {
        referralCounts.set(r.referrer_id, (referralCounts.get(r.referrer_id) || 0) + 1);
      });

      // Aggregate arena votes
      const arenaStats = new Map<string, { votes: number; power: number }>();
      arenaVotes?.forEach(v => {
        const existing = arenaStats.get(v.user_id) || { votes: 0, power: 0 };
        arenaStats.set(v.user_id, {
          votes: existing.votes + 1,
          power: existing.power + Number(v.power_spent || 0),
        });
      });

      // Aggregate sessions
      const sessionStats = new Map<string, {
        count: number;
        totalMined: number;
        active: boolean;
        lastActive: Date | null;
      }>();
      sessions?.forEach(s => {
        const existing = sessionStats.get(s.user_id) || {
          count: 0,
          totalMined: 0,
          active: false,
          lastActive: null,
        };
        const sessionEnd = s.ended_at ? new Date(s.ended_at) : new Date(s.started_at);
        sessionStats.set(s.user_id, {
          count: existing.count + 1,
          totalMined: existing.totalMined + Number(s.arx_mined || 0),
          active: existing.active || s.is_active,
          lastActive: !existing.lastActive || sessionEnd > existing.lastActive ? sessionEnd : existing.lastActive,
        });
      });

      // Build user data
      const userData: UserData[] = (profiles || []).map(profile => {
        const userPoints = pointsMap.get(profile.user_id);
        const xProfile = xProfileMap.get(profile.user_id);
        const arena = arenaStats.get(profile.user_id) || { votes: 0, power: 0 };
        const sessionData = sessionStats.get(profile.user_id) || {
          count: 0,
          totalMined: 0,
          active: false,
          lastActive: null,
        };

        return {
          user_id: profile.user_id,
          email: "hidden@email.com", // Email not accessible from profiles
          username: profile.username || "Anonymous",
          created_at: profile.created_at,
          wallet: walletMap.get(profile.user_id) || null,
          total_points: Number(userPoints?.total_points || 0),
          mining_points: Number(userPoints?.mining_points || 0),
          task_points: Number(userPoints?.task_points || 0),
          social_points: Number(userPoints?.social_points || 0),
          referral_points: Number(userPoints?.referral_points || 0),
          daily_streak: userPoints?.daily_streak || 0,
          referral_code: profile.referral_code,
          referral_count: referralCounts.get(profile.user_id) || 0,
          total_sessions: sessionData.count,
          active_session: sessionData.active,
          last_active: sessionData.lastActive?.toISOString() || null,
          total_arx_mined: sessionData.totalMined,
          x_profile: xProfileMap.get(profile.user_id) || null,
          arena_votes: arena.votes,
          arena_power_spent: arena.power,
          referral_bonus_percentage: userPoints?.referral_bonus_percentage || 0,
          x_post_boost_percentage: userPoints?.x_post_boost_percentage || 0,
        };
      });

      return userData.sort((a, b) => b.total_points - a.total_points);
    },
    refetchInterval: 30000,
  });

  // Fetch detailed user snapshot via admin endpoint
  const { data: userSnapshot, isLoading: loadingSnapshot } = useQuery({
    queryKey: ["admin-user-snapshot", selectedUser?.user_id],
    queryFn: async (): Promise<UserSnapshot | null> => {
      if (!selectedUser) return null;
      
      const { data, error } = await supabase.functions.invoke('admin-user-snapshot', {
        body: { userId: selectedUser.user_id }
      });

      if (error) {
        console.error('Error fetching user snapshot:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch user snapshot');
      }
      
      return data.data as UserSnapshot;
    },
    enabled: !!selectedUser,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const totalUsers = users.length;
      const activeMiners = users.filter(u => u.active_session).length;
      const totalPoints = users.reduce((sum, u) => sum + u.total_points, 0);

      return { totalUsers, activeMiners, totalPoints };
    },
    enabled: users.length > 0,
  });

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.wallet?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusBadge = (active: boolean) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
    }`}>
      {active ? "Mining" : "Offline"}
    </span>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Users & Miners</h1>
          <p className="text-sm md:text-base text-muted-foreground">View all users, their stats, and mining activity</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2 w-fit">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Data</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="glass-card p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatNumber(users.length)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
          </div>
        </div>
        <div className="glass-card p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatNumber(stats?.activeMiners || 0)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Mining Now</p>
          </div>
        </div>
        <div className="glass-card p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Coins className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatNumber(stats?.totalPoints || 0)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total ARX-P</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, ID, wallet, or referral code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Total ARX-P</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Sessions</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Referrals</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <>
                      <tr 
                        key={user.user_id} 
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => toggleRow(user.user_id)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{user.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.x_profile ? `@${user.x_profile.username}` : "No X linked"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-mono text-primary truncate max-w-[120px]" title={user.user_id}>
                            {user.user_id.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-bold text-accent">{formatNumber(user.total_points)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(user.mining_points)} mined
                          </p>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <p className="text-sm text-foreground">{user.total_sessions}</p>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <p className="text-sm text-foreground">{user.referral_count}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.referral_code || "-"}</p>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(user.active_session)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {expandedRows.has(user.user_id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row Details */}
                      {expandedRows.has(user.user_id) && (
                        <tr key={`${user.user_id}-expanded`}>
                          <td colSpan={7} className="bg-muted/10 px-4 py-3 border-b border-border/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Wallet</p>
                                <p className="font-mono text-xs truncate">{user.wallet ? `${user.wallet.slice(0, 8)}...${user.wallet.slice(-6)}` : "Not connected"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Mining Points</p>
                                <p className="font-medium">{formatNumber(user.mining_points)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Task Points</p>
                                <p className="font-medium">{formatNumber(user.task_points)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Social Points</p>
                                <p className="font-medium">{formatNumber(user.social_points)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Referral Points</p>
                                <p className="font-medium">{formatNumber(user.referral_points)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Daily Streak</p>
                                <p className="font-medium">{user.daily_streak} days</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Total Boost</p>
                                <p className="font-medium text-yellow-400">+{(user.referral_bonus_percentage || 0) + (user.x_post_boost_percentage || 0) + (user.x_profile?.boost_percentage || 0)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Arena Votes</p>
                                <p className="font-medium">{user.arena_votes}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Arena Power</p>
                                <p className="font-medium">{formatNumber(user.arena_power_spent)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Last Active</p>
                                <p className="font-medium">{user.last_active ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true }) : "Never"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Joined</p>
                                <p className="font-medium">{format(new Date(user.created_at), "MMM d, yyyy")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Total Mined (Sessions)</p>
                                <p className="font-medium">{formatNumber(user.total_arx_mined)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedUser?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedUser?.username}</p>
                <p className="text-sm text-muted-foreground font-mono">{selectedUser?.user_id}</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed view of user account and statistics
            </DialogDescription>
          </DialogHeader>

          {loadingSnapshot ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userSnapshot ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Total ARX-P</p>
                  <p className="text-xl font-bold text-accent">{formatNumber(userSnapshot.stats.totalPoints)}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Mining Points</p>
                  <p className="text-xl font-bold">{formatNumber(userSnapshot.stats.miningPoints)}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Sessions</p>
                  <p className="text-xl font-bold">{userSnapshot.stats.totalSessions}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Referrals</p>
                  <p className="text-xl font-bold">{userSnapshot.referrals.count}</p>
                </div>
              </div>

              {/* Boost Breakdown - NEW */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Mining Boost Breakdown
                </h3>
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">X Scan</p>
                      <p className="text-lg font-bold text-blue-400">+{userSnapshot.boostBreakdown.xScanBoost}%</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">X Posts ({userSnapshot.boostBreakdown.claimedXPostsCount})</p>
                      <p className="text-lg font-bold text-purple-400">+{userSnapshot.boostBreakdown.xPostBoost}%</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">Referrals ({userSnapshot.boostBreakdown.referralCount})</p>
                      <p className="text-lg font-bold text-green-400">+{userSnapshot.boostBreakdown.referralBoost}%</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">Arena</p>
                      <p className="text-lg font-bold text-red-400">+{userSnapshot.boostBreakdown.arenaBoost}%</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                      <p className="text-[10px] text-yellow-400 font-medium">TOTAL BOOST</p>
                      <p className="text-lg font-bold text-yellow-400">+{userSnapshot.boostBreakdown.totalBoostPercentage}%</p>
                    </div>
                  </div>
                  <div className="text-center pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Effective Mining Rate: <span className="text-yellow-400 font-bold">{userSnapshot.boostBreakdown.effectiveMiningRate.toFixed(1)} ARX-P/hour</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Account Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs">{userSnapshot.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span>{userSnapshot.profile?.username || "Anonymous"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet:</span>
                    <span className="font-mono text-xs">
                      {userSnapshot.wallets.find(w => w.is_primary)?.wallet_address 
                        ? `${userSnapshot.wallets.find(w => w.is_primary)?.wallet_address.slice(0, 8)}...`
                        : "Not connected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{userSnapshot.profile?.created_at ? format(new Date(userSnapshot.profile.created_at), "PPP") : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral Code:</span>
                    <span className="font-mono">{userSnapshot.profile?.referral_code || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">X Account:</span>
                    <span>{userSnapshot.xProfile ? `@${userSnapshot.xProfile.username}` : "Not linked"}</span>
                  </div>
                </div>
              </div>

              {/* X Profile Details */}
              {userSnapshot.xProfile && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 flex items-center justify-center">𝕏</span>
                    X Profile Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Scan Boost</p>
                      <p className="text-lg font-bold text-primary">+{userSnapshot.xProfile.boost_percentage}%</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Avg Engagement</p>
                      <p className="text-lg font-bold">{formatNumber(userSnapshot.xProfile.average_engagement)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Posts Today</p>
                      <p className="text-lg font-bold">{userSnapshot.xProfile.qualified_posts_today}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Viral Bonus</p>
                      <p className="text-lg font-bold">{userSnapshot.xProfile.viral_bonus ? "🔥" : "—"}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Historical Data</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Historical Posts</p>
                        <p className="font-medium">{userSnapshot.xProfile.historical_posts_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ARX-P from Posts</p>
                        <p className="font-medium text-accent">{formatNumber(userSnapshot.xProfile.historical_arx_p_total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Boost Earned</p>
                        <p className="font-medium text-primary">+{userSnapshot.xProfile.historical_boost_total}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Scanned</p>
                        <p className="font-medium">{userSnapshot.xProfile.historical_scanned ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Profile URL</p>
                        <a href={userSnapshot.xProfile.profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate block">
                          {userSnapshot.xProfile.profile_url}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Scanned</p>
                        <p className="font-medium text-xs">
                          {userSnapshot.xProfile.last_scanned_at 
                            ? formatDistanceToNow(new Date(userSnapshot.xProfile.last_scanned_at), { addSuffix: true })
                            : "Never"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!userSnapshot.xProfile && (
                <div className="bg-muted/20 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">No X profile connected</p>
                </div>
              )}

              {/* Points Breakdown */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Points Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Mining</p>
                    <p className="text-lg font-bold">{formatNumber(userSnapshot.stats.miningPoints)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="text-lg font-bold">{formatNumber(userSnapshot.stats.taskPoints)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Social</p>
                    <p className="text-lg font-bold">{formatNumber(userSnapshot.stats.socialPoints)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Referrals</p>
                    <p className="text-lg font-bold">{formatNumber(userSnapshot.stats.referralPoints)}</p>
                  </div>
                </div>
              </div>

              {/* Mining Sessions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Recent Mining Sessions</h3>
                {userSnapshot.miningSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No mining sessions</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userSnapshot.miningSessions.map((session: MiningSession) => (
                      <div key={session.id} className="flex items-center justify-between bg-muted/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${session.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{session.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.started_at), "MMM d, HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">{Math.round(session.arx_mined)} ARX-P</p>
                          <p className="text-xs text-muted-foreground">
                            {session.is_active ? "Active" : "Completed"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Submissions */}
              {userSnapshot.socialSubmissions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Social Submissions ({userSnapshot.socialSubmissions.length})</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {userSnapshot.socialSubmissions.slice(0, 5).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between bg-muted/20 rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            sub.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {sub.status}
                          </span>
                          <a href={sub.post_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                            {sub.post_url}
                          </a>
                        </div>
                        <span className="text-muted-foreground ml-2">+{sub.points_awarded}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load user data
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
