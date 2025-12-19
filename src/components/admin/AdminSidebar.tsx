import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings2, 
  FileCheck, 
  Gift, 
  Coins, 
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Miners", path: "/admin/miners" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings2, label: "Controls", path: "/admin/controls" },
  { icon: FileCheck, label: "Merkle / Eligibility", path: "/admin/merkle" },
  { icon: Gift, label: "Claim Manager", path: "/admin/claims" },
  { icon: Coins, label: "Founder Allocation", path: "/admin/allocations" },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <aside 
      className={cn(
        "min-h-screen bg-sidebar border-r border-border/50 py-6 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="px-4 mb-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-foreground">ARXON Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]",
                !isActive && "text-muted-foreground hover:text-foreground",
                collapsed && "justify-center"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 space-y-1 mt-auto border-t border-border/50 pt-4">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-muted-foreground",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@arxon.io</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
