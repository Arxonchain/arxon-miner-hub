import { LayoutDashboard, Trophy, ListTodo, Users, Wallet, User, Settings, LogOut, Pickaxe } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMining } from "@/hooks/useMining";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Users, label: "Referrals", path: "/referrals" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: User, label: "Profile", path: "/profile" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const { isMining, elapsedTime, formatTime } = useMining();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex w-48 xl:w-56 min-h-screen bg-sidebar border-r border-border/50 py-4 xl:py-6 flex-col">
      {/* Mining Status Card */}
      <div className="px-2 xl:px-3 mb-4">
        <button
          onClick={() => navigate('/mining')}
          className={`w-full p-3 rounded-lg border transition-all ${
            isMining 
              ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
              : 'bg-secondary/30 border-border/50 hover:bg-secondary/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <Pickaxe className={`h-4 w-4 ${isMining ? 'text-green-400' : 'text-muted-foreground'}`} />
              {isMining && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className={`text-xs font-medium ${isMining ? 'text-green-400' : 'text-muted-foreground'}`}>
              {isMining ? 'Mining Active' : 'Start Mining'}
            </span>
          </div>
          {isMining && (
            <div className="text-left">
              <p className="text-lg font-bold text-foreground">{formatTime(elapsedTime)}</p>
              <p className="text-[10px] text-muted-foreground">Session time</p>
            </div>
          )}
        </button>
      </div>

      <nav className="space-y-0.5 xl:space-y-1 px-2 xl:px-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item text-sm xl:text-base py-2.5 xl:py-3 ${isActive ? "nav-item-active" : ""}`
            }
          >
            <item.icon className="h-4 w-4 xl:h-5 xl:w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section with Settings and Logout */}
      <div className="px-2 xl:px-3 space-y-0.5 xl:space-y-1 mt-auto">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item text-sm xl:text-base py-2.5 xl:py-3 ${isActive ? "nav-item-active" : ""}`
            }
          >
            <item.icon className="h-4 w-4 xl:h-5 xl:w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        {user && (
          <button
            onClick={signOut}
            className="nav-item w-full text-left hover:text-destructive text-sm xl:text-base py-2.5 xl:py-3"
          >
            <LogOut className="h-4 w-4 xl:h-5 xl:w-5" />
            <span className="font-medium">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
