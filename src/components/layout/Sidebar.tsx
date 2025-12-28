import { LayoutDashboard, Trophy, ListTodo, Users, User, Settings, LogOut, Swords } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import XIcon from "@/components/icons/XIcon";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Swords, label: "Arena", path: "/arena" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Users, label: "Referrals", path: "/referrals" },
  { icon: User, label: "Profile", path: "/profile" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
];

const xProfileItem = { label: "X Profile", path: "/x-profile" };

const Sidebar = () => {
  const { user, signOut } = useAuth();
  return (
    <aside className="hidden lg:flex w-48 xl:w-56 min-h-screen bg-sidebar border-r border-border/50 py-4 xl:py-6 flex-col">
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
        <NavLink
          to={xProfileItem.path}
          className={({ isActive }) =>
            `nav-item text-sm xl:text-base py-2.5 xl:py-3 ${isActive ? "nav-item-active" : ""}`
          }
        >
          <XIcon className="h-4 w-4 xl:h-5 xl:w-5" />
          <span className="font-medium">{xProfileItem.label}</span>
        </NavLink>
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
