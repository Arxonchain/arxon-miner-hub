import { LayoutGrid, BarChart3, Gift, Users, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
  { icon: Gift, label: "Claim", path: "/claim" },
  { icon: Users, label: "Referrals", path: "/referrals" },
];

const bottomItems = [
  { icon: Settings, label: "Setting", path: "/settings" },
  { icon: LogOut, label: "Logout", path: "/logout" },
];

const Sidebar = () => {
  return (
    <aside className="w-56 min-h-screen bg-sidebar flex flex-col py-6">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <span className="text-foreground font-bold text-sm">A</span>
        </div>
        <span className="text-lg font-bold text-foreground tracking-wide">ARXON</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-accent text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Nav */}
      <nav className="space-y-1 px-3 mt-auto">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;