import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, Clock, Search, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { ArenaParticipant } from '@/hooks/useArena';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface VoteExplorerProps {
  participants: ArenaParticipant[];
  totalVoters: number;
  totalPowerStaked: number;
  currentUserId?: string;
}

const VoteExplorer = ({ participants, totalVoters, totalPowerStaked, currentUserId }: VoteExplorerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredParticipants = participants.filter(p => 
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_id.includes(searchQuery)
  );

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass-card p-6 border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Vote Explorer</h3>
            <p className="text-sm text-muted-foreground">Track all participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <EyeOff className="w-4 h-4" />
          <span>Votes are private</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalVoters}</div>
          <div className="text-xs text-muted-foreground">Total Voters</div>
        </div>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent">{totalPowerStaked.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Staked</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50 border-border/50"
        />
      </div>

      {/* Participants List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No participants found' : 'No votes yet'}
          </div>
        ) : (
          filteredParticipants.map((participant, index) => (
            <motion.div
              key={participant.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg bg-background/30 border ${
                participant.user_id === currentUserId 
                  ? 'border-primary/50 bg-primary/10' 
                  : 'border-border/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarImage src={participant.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {participant.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {participant.user_id === currentUserId && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[8px] text-black font-bold">YOU</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {participant.username || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(participant.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Zap className="w-4 h-4" />
                  <span>{participant.power_spent.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <EyeOff className="w-3 h-3" />
                  <span>Vote hidden</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Activity Feed Preview */}
      {participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Recent Activity</span>
          </div>
          <div className="space-y-2">
            {participants.slice(0, 3).map((p, i) => (
              <div key={`activity-${i}`} className="text-xs text-muted-foreground">
                <span className="text-foreground">{p.username || 'Someone'}</span> staked{' '}
                <span className="text-primary">{p.power_spent.toLocaleString()} ARX-P</span> {formatTimeAgo(p.created_at)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteExplorer;
