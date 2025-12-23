import { LayoutDashboard, Trophy, ListTodo, Users, Wallet, User, Settings, LogOut, Menu, Pickaxe } from "lucide-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useMining } from "@/hooks/useMining";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Users, label: "Referrals", path: "/referrals" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isMining, elapsedTime, formatTime } = useMining();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
  };

  const handleMiningClick = () => {
    navigate('/mining');
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
          {/* Mining Status Card */}
          <div className="px-3 mb-4">
            <button
              onClick={handleMiningClick}
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
