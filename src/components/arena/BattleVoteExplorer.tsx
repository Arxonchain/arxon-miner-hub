import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, Eye, EyeOff, Trophy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import type { ArenaMarket } from '@/hooks/useArenaMarkets';
import { formatDistanceToNow } from 'date-fns';

interface VoteEntry {
  id: string;
  side: 'a' | 'b';
  power_spent: number;
  created_at: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
}

interface BattleVoteExplorerProps {
  market: ArenaMarket;
  currentUserId?: string;
}

const BattleVoteExplorer = ({ market, currentUserId }: BattleVoteExplorerProps) => {
  const { isAdmin } = useAdmin();
  const [votes, setVotes] = useState<VoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'a' | 'b'>('all');

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      try {
        // Use the RPC function that returns votes with profile info
        const { data, error } = await supabase
          .rpc('get_arena_participation', { p_battle_id: market.id });

        if (error) throw error;

        const mapped = (data || []).map((v: any) => ({
          id: v.user_id + v.created_at,
          side: v.side || (v.power_spent > 0 ? 'a' : 'b'), // fallback
          power_spent: v.power_spent,
          created_at: v.created_at,
          user_id: v.user_id,
          username: v.username,
          avatar_url: v.avatar_url,
        }));

        // Sort by power spent descending
        mapped.sort((a: VoteEntry, b: VoteEntry) => b.power_spent - a.power_spent);
        setVotes(mapped);
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();

    // Real-time subscription for new votes
    const channel = supabase
      .channel(`battle-votes-${market.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_votes',
          filter: `battle_id=eq.${market.id}`,
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [market.id]);

  const filteredVotes = votes.filter(v => {
    if (activeTab === 'all') return true;
    return v.side === activeTab;
  });

  const sideACounts = votes.filter(v => v.side === 'a');
  const sideBCounts = votes.filter(v => v.side === 'b');

  const tabs = [
    { id: 'all' as const, label: 'All Votes', count: votes.length },
    { id: 'a' as const, label: market.side_a_name, count: sideACounts.length, color: market.side_a_color },
    { id: 'b' as const, label: market.side_b_name, count: sideBCounts.length, color: market.side_b_color },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Selection */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            style={tab.color && activeTab === tab.id ? { backgroundColor: tab.color } : undefined}
          >
            <Users className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id
                ? 'bg-primary-foreground/20'
                : 'bg-muted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
        <EyeOff className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Voter identities are private. Only stake amounts are visible.
        </span>
      </div>

      {/* Votes List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-secondary/30 animate-pulse"
                />
              ))}
            </div>
          ) : filteredVotes.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No votes yet. Be the first!</p>
            </div>
          ) : (
            filteredVotes.map((vote, index) => {
              const isCurrentUser = vote.user_id === currentUserId;
              const sideName = vote.side === 'a' ? market.side_a_name : market.side_b_name;
              const sideColor = vote.side === 'a' ? market.side_a_color : market.side_b_color;

              return (
                <motion.div
                  key={vote.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary/30 border-border/30'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {index < 3 ? (
                      <Trophy className={`w-4 h-4 ${
                        index === 0 ? 'text-yellow-400' : 
                        index === 1 ? 'text-gray-400' : 
                        'text-amber-600'
                      }`} />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>

                  {/* Team Badge */}
                  <div 
                    className="px-2 py-1 rounded-lg text-xs font-bold"
                    style={{ 
                      backgroundColor: `${sideColor}20`,
                      color: sideColor 
                    }}
                  >
                    {sideName}
                  </div>

                  {/* User Info - Hidden for privacy (except admin or self) */}
                  <div className="flex-1 min-w-0">
                    {isAdmin || isCurrentUser ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm truncate">
                          {vote.username || 'Anonymous'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            You
                          </span>
                        )}
                        {isAdmin && !isCurrentUser && (
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground text-sm">
                          Anonymous Voter
                        </span>
                        <EyeOff className="w-3 h-3 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Stake Amount */}
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background/50">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">
                      {vote.power_spent.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattleVoteExplorer;
