import { LayoutDashboard, BarChart3, Gift, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Leaderboard", path: "/leaderboard" },
  { icon: Gift, label: "Claim", path: "/claim" },
  { icon: Users, label: "Referrals", path: "/referrals" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    console.log("Logout clicked");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar border-r border-border/50 p-0">
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
          </nav>

          <div className="px-3 mt-auto">
            <button
              onClick={handleLogout}
              className="nav-item w-full text-left hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
