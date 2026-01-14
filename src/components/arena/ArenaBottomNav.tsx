import { motion } from 'framer-motion';
import { BookOpen, Trophy, Gift, ListTodo } from 'lucide-react';

export type ArenaTab = 'rules' | 'rankings' | 'prizes' | 'vote';

interface ArenaBottomNavProps {
  activeTab: ArenaTab;
  onTabChange: (tab: ArenaTab) => void;
}

const tabs = [
  { id: 'rules' as const, label: 'Battle Rules', icon: BookOpen },
  { id: 'rankings' as const, label: 'My Rankings', icon: Trophy },
  { id: 'prizes' as const, label: 'Prize Pool', icon: Gift },
  { id: 'vote' as const, label: 'Vote Now', icon: ListTodo },
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
