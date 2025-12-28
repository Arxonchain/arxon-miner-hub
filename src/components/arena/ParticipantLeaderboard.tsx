import { motion } from 'framer-motion';
import { Trophy, Zap, Medal, Award } from 'lucide-react';
import { ArenaParticipant } from '@/hooks/useArena';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ParticipantLeaderboardProps {
  participants: ArenaParticipant[];
  currentUserId?: string;
}

const getBadgeIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankTitle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'Arena Legend';
    case 2:
      return 'Power Elite';
    case 3:
      return 'Rising Force';
    default:
      return 'Warrior';
  }
};

const ParticipantLeaderboard = ({ participants, currentUserId }: ParticipantLeaderboardProps) => {
  if (participants.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground">No votes cast yet. Be the first to enter the Arena!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Arena Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Top voters this battle</p>
        </div>
      </div>

      <div className="space-y-3">
        {participants.slice(0, 10).map((participant, index) => {
          const rank = index + 1;
          const isCurrentUser = participant.user_id === currentUserId;

          return (
            <motion.div
              key={participant.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-background/30 hover:bg-background/50'
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {rank <= 3 ? (
                  getBadgeIcon(rank)
                ) : (
                  <span className="text-muted-foreground font-mono">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-border">
                <AvatarImage src={participant.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {participant.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {participant.username || 'Anonymous'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      You
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{getRankTitle(rank)}</span>
              </div>

              {/* Power */}
              <div className="flex items-center gap-1 text-primary font-bold">
                <Zap className="w-4 h-4" />
                <span>{participant.power_spent.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {participants.length > 10 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          +{participants.length - 10} more participants
        </p>
      )}
    </div>
  );
};

export default ParticipantLeaderboard;
