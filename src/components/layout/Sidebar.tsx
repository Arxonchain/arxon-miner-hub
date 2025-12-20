import { LayoutDashboard, BarChart3, Gift, Users, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
  { icon: Gift, label: "Claim", path: "/claim" },
  { icon: Users, label: "Referrals", path: "/referrals" },
];

const bottomItems = [
  { icon: Settings, label: "Setting", path: "/settings" },
];

const Sidebar = () => {
  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <aside className="hidden md:flex w-56 min-h-screen bg-sidebar border-r border-border/50 py-6 flex-col">
      <nav className="space-y-1 px-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section with Settings and Logout */}
      <div className="px-3 space-y-1 mt-auto">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
