import { LayoutDashboard, Trophy, ListTodo, Users, User, Settings, LogOut, Menu, Swords } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import XIcon from "@/components/icons/XIcon";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Swords, label: "Arena", path: "/arena" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Users, label: "Referrals", path: "/referrals" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const xProfileItem = { label: "X Profile", path: "/x-profile" };

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors lg:hidden">
          <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 sm:w-64 bg-sidebar border-r border-border/50 p-0">
        <div className="flex flex-col h-full py-6">
          <nav className="space-y-1 px-3 flex-1">
            {navItems.map((item) => (
              <RouterNavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "nav-item-active" : ""}`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </RouterNavLink>
            ))}
            <RouterNavLink
              to={xProfileItem.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <XIcon className="h-5 w-5" />
              <span className="font-medium">{xProfileItem.label}</span>
            </RouterNavLink>
          </nav>

          {user && (
            <div className="px-3 mt-auto">
              <button
                onClick={handleLogout}
                className="nav-item w-full text-left hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
