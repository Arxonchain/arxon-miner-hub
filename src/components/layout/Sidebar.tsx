import { LayoutDashboard, BarChart3, Gift, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
  { icon: Gift, label: "Claim", path: "/claim" },
  { icon: Users, label: "Referrals", path: "/referrals" },
];

const Sidebar = () => {
  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-border/50 py-6">
      <nav className="space-y-1 px-3">
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
    </aside>
  );
};

export default Sidebar;
