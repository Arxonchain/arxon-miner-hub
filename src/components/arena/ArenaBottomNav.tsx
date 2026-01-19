import { motion } from 'framer-motion';
import { LayoutGrid, Trophy, Wallet, Flame } from 'lucide-react';

export type ArenaTab = 'markets' | 'leaderboard' | 'bets' | 'vote';

interface ArenaBottomNavProps {
  activeTab: ArenaTab;
  onTabChange: (tab: ArenaTab) => void;
}

const tabs = [
  { id: 'markets' as const, label: 'Markets', icon: LayoutGrid },
  { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
  { id: 'bets' as const, label: 'My Bets', icon: Wallet },
  { id: 'vote' as const, label: 'Battle', icon: Flame },
];

const ArenaBottomNav = ({ activeTab, onTabChange }: ArenaBottomNavProps) => {
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors
              ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium truncate">{tab.label}</span>
            
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute top-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArenaBottomNav;
