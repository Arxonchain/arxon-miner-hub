import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Download, TrendingUp, TrendingDown, Activity, CheckCircle, Clock, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState<"24H" | "7D" | "30D">("7D");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch total active miners
  const { data: totalMiners = 0, isLoading: loadingMiners, refetch: refetchMiners } = useQuery({
    queryKey: ["admin-total-miners"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("mining_sessions")
        .select("user_id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60000,
  });

  // Fetch total ARX mined
  const { data: totalArxMined = 0, isLoading: loadingArx, refetch: refetchArx } = useQuery({
    queryKey: ["admin-total-arx-mined"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("total_points");
      if (error) throw error;
      return data?.reduce((sum, p) => sum + Number(p.total_points || 0), 0) || 0;
    },
    refetchInterval: 60000,
  });

  // Fetch mining settings
  const { data: miningSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-mining-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mining_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Fetch claims data
  const { data: claimsData, isLoading: loadingClaims, refetch: refetchClaims } = useQuery({
    queryKey: ["admin-claims-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("proof_status, claimed_amount");
      if (error) throw error;
      
      const successful = data?.filter(c => c.proof_status === "verified").length || 0;
      const pending = data?.filter(c => c.proof_status === "pending").length || 0;
      const failed = data?.filter(c => c.proof_status === "rejected").length || 0;
      const totalClaimed = data?.reduce((sum, c) => sum + Number(c.claimed_amount || 0), 0) || 0;
      
      return { successful, pending, failed, totalClaimed, total: data?.length || 0 };
    },
    refetchInterval: 60000,
  });

  // Fetch daily performance comparison
  const { data: performanceData, isLoading: loadingPerformance, refetch: refetchPerformance } = useQuery({
    queryKey: ["admin-performance-comparison", timeRange],
    queryFn: async () => {
      const days = timeRange === "24H" ? 1 : timeRange === "7D" ? 7 : 30;
      const currentEnd = new Date();
      const currentStart = subDays(currentEnd, days);
      const previousEnd = currentStart;
      const previousStart = subDays(previousEnd, days);

      // Current period miners
      const { data: currentMiners } = await supabase
        .from("mining_sessions")
        .select("user_id")
        .gte("started_at", currentStart.toISOString())
        .lte("started_at", currentEnd.toISOString());

      // Previous period miners
      const { data: previousMiners } = await supabase
        .from("mining_sessions")
        .select("user_id")
        .gte("started_at", previousStart.toISOString())
        .lte("started_at", previousEnd.toISOString());

      // Current period claims
      const { data: currentClaims } = await supabase
        .from("claims")
        .select("id")
        .gte("created_at", currentStart.toISOString());

      // Previous period claims
      const { data: previousClaims } = await supabase
        .from("claims")
        .select("id")
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", currentStart.toISOString());

      const currentMinerCount = new Set(currentMiners?.map(m => m.user_id)).size;
      const previousMinerCount = new Set(previousMiners?.map(m => m.user_id)).size;
      const currentClaimCount = currentClaims?.length || 0;
      const previousClaimCount = previousClaims?.length || 0;

      return {
        activeMiners: {
          current: currentMinerCount,
          previous: previousMinerCount,
          change: currentMinerCount - previousMinerCount,
          changePercent: previousMinerCount > 0 ? ((currentMinerCount - previousMinerCount) / previousMinerCount * 100).toFixed(1) : 0
        },
        claimsProcessed: {
          current: currentClaimCount,
          previous: previousClaimCount,
          change: currentClaimCount - previousClaimCount,
          changePercent: previousClaimCount > 0 ? ((currentClaimCount - previousClaimCount) / previousClaimCount * 100).toFixed(1) : 0
        }
      };
    },
    refetchInterval: 60000,
  });

  // Fetch recent claims for the sidebar
  const { data: recentClaims = [], refetch: refetchRecentClaims } = useQuery({
    queryKey: ["admin-recent-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("id, claimed_amount, proof_status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch recent mining sessions (points mined)
  const { data: recentPointsMined = [], refetch: refetchRecentPoints } = useQuery({
    queryKey: ["admin-recent-points-mined"],
    queryFn: async () => {
      // Fetch completed mining sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("mining_sessions")
        .select("id, user_id, arx_mined, ended_at, started_at")
        .eq("is_active", false)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(10);
      
      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(sessions.map(s => s.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      
      if (profilesError) throw profilesError;

      // Create a map of user_id to username
      const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      // Combine data
      return sessions.map(session => ({
        id: session.id,
        user_id: session.user_id,
        username: usernameMap.get(session.user_id) || `User-${session.user_id.slice(0, 6)}`,
        arx_mined: Number(session.arx_mined),
        claimed_at: session.ended_at,
        started_at: session.started_at,
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = loadingMiners || loadingArx || loadingClaims || loadingPerformance;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchMiners(),
      refetchArx(),
      refetchSettings(),
      refetchClaims(),
      refetchPerformance(),
      refetchRecentClaims(),
      refetchRecentPoints()
    ]);
    setIsRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const handleExportCSV = () => {
    const data = [
      ["Metric", "Value"],
      ["Total Active Miners", totalMiners],
      ["Total ARX Mined", totalArxMined],
      ["Successful Claims", claimsData?.successful || 0],
      ["Pending Claims", claimsData?.pending || 0],
      ["Failed Claims", claimsData?.failed || 0],
    ];
    const csv = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data for display (since we don't have infrastructure/blocks tables)
  const mockNodes = [
    { node: "node-01.arxon.io", region: "EU-West", status: "Healthy", uptime: "99.98%", latency: "42ms" },
    { node: "node-02.arxon.io", region: "US-East", status: "Healthy", uptime: "99.95%", latency: "38ms" },
    { node: "node-03.arxon.io", region: "APAC", status: "Healthy", uptime: "99.92%", latency: "56ms" },
    { node: "node-07.arxon.io", region: "US-West", status: "Degraded", uptime: "96.12%", latency: "120ms" },
  ];


  const mockEvents = [
    { time: "14:02 UTC", event: "Block reward adjusted (1000 → 500 ARX-P)", color: "border-primary" },
    { time: "13:45 UTC", event: "Node EU-03 recovered", color: "border-yellow-500" },
    { time: "12:10 UTC", event: "Claim spike detected (+18%)", color: "border-yellow-500" },
    { time: "09:32 UTC", event: "Consensus confirmed (PoW)", color: "border-primary" },
    { time: "08:15 UTC", event: "Mining difficulty adjusted", color: "border-primary" },
  ];

  const supplyDistribution = [
    { name: "Public Mining", percentage: 60, color: "bg-primary" },
    { name: "Founder Allocation", percentage: 20, color: "bg-purple-500" },
    { name: "Ecosystem Fund", percentage: 20, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border/50">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className="text-sm font-medium text-foreground">Mainnet</span>
            <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
          </div>
          <div className="flex bg-card border border-border/50 rounded-lg overflow-hidden">
            {(["24H", "7D", "30D"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range 
                    ? "bg-muted text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
            <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
              Custom
            </button>
          </div>
          <Button size="sm" onClick={handleExportCSV} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Description Card */}
      <div className="glass-card p-4 border-border/30 flex items-center justify-between">
        <p className="text-foreground">Network performance, mining activity, and protocol health.</p>
        <Button size="sm" onClick={handleExportCSV} className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Active Miners</p>
          <p className="text-4xl font-bold text-foreground">{formatNumber(totalMiners)}</p>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs">
            <TrendingUp className="h-3 w-3" />
            +{performanceData?.activeMiners.change || 0} vs {timeRange}
          </div>
          <p className="text-sm text-muted-foreground">Primary network participants contributing hashpower</p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Network Throughput</p>
          <p className="text-4xl font-bold text-foreground">48 <span className="text-xl">TPS</span></p>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs">
            <TrendingUp className="h-3 w-3" />
            +14.6% vs {timeRange}
          </div>
          <p className="text-sm text-muted-foreground">Transactions processed per second across all nodes</p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total ARX Mined</p>
          <p className="text-4xl font-bold text-foreground">{formatNumber(totalArxMined)}</p>
          <p className="text-sm text-muted-foreground mt-4">Cumulative mining rewards distributed to date</p>
          <p className="text-sm text-muted-foreground">38% of maximum supply (40M total)</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Protocol Health */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Protocol Health</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Block Production</span>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Block Time</span>
                <span className="text-sm text-foreground">
                  6.2s
                  <span className="ml-2 text-xs text-green-500 inline-flex items-center">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    -0.8s
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mining Participation</span>
                <span className="flex items-center gap-1 text-sm text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Stable
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network Hashrate</span>
                <span className="text-sm text-foreground">
                  4.2 TH/s
                  <span className="ml-2 text-xs text-green-500 inline-flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +12%
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Claim Throughput</span>
                <span className="flex items-center gap-1 text-sm text-yellow-500">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Elevated
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Claims Queue</span>
                <span className="text-sm text-foreground">{claimsData?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Consensus Mechanism</span>
                <span className="text-sm text-foreground">{miningSettings?.consensus_mode || "Proof of Work"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chain Height</span>
                <span className="text-sm text-foreground">
                  2,843,210
                  <span className="ml-2 text-xs text-green-500 inline-flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +1,248
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Performance Comparison Table */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Performance Comparison</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-primary">Metric</TableHead>
                  <TableHead className="text-primary">Current Period</TableHead>
                  <TableHead className="text-primary">Previous Period</TableHead>
                  <TableHead className="text-primary">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border/30">
                  <TableCell className="text-foreground">Active Miners</TableCell>
                  <TableCell className="text-foreground">{performanceData?.activeMiners.current.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-foreground">{performanceData?.activeMiners.previous.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 ${Number(performanceData?.activeMiners.changePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Number(performanceData?.activeMiners.changePercent) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Number(performanceData?.activeMiners.changePercent) >= 0 ? '+' : ''}{performanceData?.activeMiners.change} ({performanceData?.activeMiners.changePercent}%)
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="border-border/30">
                  <TableCell className="text-foreground">Avg Block Time</TableCell>
                  <TableCell className="text-foreground">6.2s</TableCell>
                  <TableCell className="text-foreground">7.0s</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-green-500">
                      <TrendingDown className="h-3 w-3" />
                      -0.8s (-11%)
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="border-border/30">
                  <TableCell className="text-foreground">TPS</TableCell>
                  <TableCell className="text-foreground">48</TableCell>
                  <TableCell className="text-foreground">41</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      +7 (+17%)
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="border-border/30">
                  <TableCell className="text-foreground">Claims Processed</TableCell>
                  <TableCell className="text-foreground">{performanceData?.claimsProcessed.current.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-foreground">{performanceData?.claimsProcessed.previous.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 ${Number(performanceData?.claimsProcessed.changePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Number(performanceData?.claimsProcessed.changePercent) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Number(performanceData?.claimsProcessed.changePercent) >= 0 ? '+' : ''}{performanceData?.claimsProcessed.change} ({performanceData?.claimsProcessed.changePercent}%)
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="border-border/30">
                  <TableCell className="text-foreground">Failed Claims</TableCell>
                  <TableCell className="text-foreground">{claimsData?.failed || 0}</TableCell>
                  <TableCell className="text-foreground">189</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <TrendingUp className="h-3 w-3" />
                      +23 (+12%)
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Infrastructure Status */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Infrastructure Status</h3>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                View All Nodes →
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-primary">Node</TableHead>
                  <TableHead className="text-primary">Region</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Uptime</TableHead>
                  <TableHead className="text-primary">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNodes.map((node, idx) => (
                  <TableRow key={idx} className="border-border/30">
                    <TableCell className="text-foreground font-mono text-sm">{node.node}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${node.status === "Healthy" ? "bg-primary" : "bg-yellow-500"}`}></span>
                        <span className="text-foreground">{node.region}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={node.status === "Healthy" ? "text-green-500" : "text-red-500"}>
                        {node.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{node.uptime}</TableCell>
                    <TableCell className={node.status === "Healthy" ? "text-primary" : "text-red-500"}>
                      {node.latency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Recent Points Mined */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Recent Points Mined</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-primary">Session ID</TableHead>
                  <TableHead className="text-primary">Claimed At</TableHead>
                  <TableHead className="text-primary">Miner</TableHead>
                  <TableHead className="text-primary">Points Claimed</TableHead>
                  <TableHead className="text-primary">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPointsMined.length === 0 ? (
                  <TableRow className="border-border/30">
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No mining sessions recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPointsMined.map((session) => {
                    const claimedAt = session.claimed_at ? new Date(session.claimed_at) : null;
                    const startedAt = session.started_at ? new Date(session.started_at) : null;
                    const durationMs = claimedAt && startedAt ? claimedAt.getTime() - startedAt.getTime() : 0;
                    const durationMins = Math.floor(durationMs / 60000);
                    const durationSecs = Math.floor((durationMs % 60000) / 1000);
                    
                    return (
                      <TableRow key={session.id} className="border-border/30">
                        <TableCell className="text-primary font-mono">
                          #{session.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {claimedAt ? format(claimedAt, "MMM dd, HH:mm:ss") : "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.username}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {session.arx_mined.toLocaleString()} ARX-P
                        </TableCell>
                        <TableCell className="text-foreground">
                          {durationMins > 0 ? `${durationMins}m ${durationSecs}s` : `${durationSecs}s`}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-foreground">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Claims Success Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {claimsData?.total ? ((claimsData.successful / claimsData.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-green-500">Optimal performance</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold text-foreground">38s</p>
                <p className="text-xs text-yellow-500">Queue elevated</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network Uptime</p>
                <p className="text-2xl font-bold text-foreground">99.92%</p>
                <p className="text-xs text-green-500">Above SLA target</p>
              </div>
            </div>
          </div>

          {/* Supply Distribution */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Supply Distribution</h3>
            <div className="space-y-3">
              {supplyDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="text-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border/30">
              <p className="text-sm text-muted-foreground">Remaining Supply</p>
              <p className="text-xl font-bold text-foreground">24.8M ARX-P</p>
              <p className="text-xs text-muted-foreground">62% available for mining</p>
            </div>
          </div>

          {/* Claims Status */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Claims Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Successful
                </span>
                <span className="text-foreground font-medium">{claimsData?.successful.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pending
                </span>
                <span className="text-foreground font-medium">{claimsData?.pending.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Failed
                </span>
                <span className="text-foreground font-medium">{claimsData?.failed.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Network Events */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Recent Network Events</h3>
            <div className="space-y-3">
              {mockEvents.map((event, idx) => (
                <div key={idx} className={`pl-3 border-l-2 ${event.color}`}>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                  <p className="text-sm text-foreground">{event.event}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Claims */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Recent Claims</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-primary text-xs">ID</TableHead>
                  <TableHead className="text-primary text-xs">Amount</TableHead>
                  <TableHead className="text-primary text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClaims.map((claim, idx) => (
                  <TableRow key={idx} className="border-border/30">
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      CLM-{claim.id.slice(0, 4).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {Number(claim.claimed_amount).toLocaleString()} ARX-P
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        claim.proof_status === "verified" ? "text-green-500" : 
                        claim.proof_status === "pending" ? "text-yellow-500" : "text-red-500"
                      }`}>
                        {claim.proof_status === "verified" ? <CheckCircle className="h-3 w-3" /> : 
                         claim.proof_status === "pending" ? <Clock className="h-3 w-3" /> : 
                         <AlertTriangle className="h-3 w-3" />}
                        {claim.proof_status === "verified" ? "Success" : 
                         claim.proof_status === "pending" ? "Pending" : "Failed"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
