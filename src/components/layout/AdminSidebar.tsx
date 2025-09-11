import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  School, 
  Users, 
  FileText, 
  Settings, 
  Database,
  ChevronLeft,
  ChevronRight,
  Wallet
} from "lucide-react";

interface AdminSidebarProps {
  className?: string;
}

const sidebarItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/"
  },
  {
    label: "Schools",
    icon: School,
    href: "/schools"
  },
  {
    label: "Users",
    icon: Users,
    href: "/users"
  },
  {
    label: "Finance",
    icon: Wallet,
    href: "/finance/billing"
  },
  {
    label: "System",
    icon: Database,
    href: "/system"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings"
  }
];

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "relative flex h-screen flex-col border-r bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Schomas</h2>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-left",
                  collapsed && "justify-center px-2"
                )}
                asChild
              >
                <Link to={item.href}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium text-primary">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@schomas.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}