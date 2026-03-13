import { useState } from "react";
import { ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Bell,
  MessageSquare,
  CalendarDays,
  BookOpen,
} from "lucide-react";

interface AdminSidebarProps {
  className?: string;
}

type SidebarItem = {
  label: string;
  icon: ElementType;
  href: string;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

const sidebarSections: SidebarSection[] = [
  {
    title: "Main Menu",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Schools", icon: School, href: "/schools" },
      { label: "Users", icon: Users, href: "/users" },
      { label: "Billing Management", icon: Wallet, href: "/billing-management" },
    ],
  },
  {
    title: "Communications",
    items: [
      { label: "Notices", icon: Bell, href: "/notices" },
      { label: "Messages", icon: MessageSquare, href: "/messages" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "System", icon: Database, href: "/system" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

const bottomItems: SidebarItem[] = [
  { label: "Academic Calendar", icon: CalendarDays, href: "/academic-calendar" },
  { label: "Term", icon: BookOpen, href: "/term" },
];

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const renderItem = (item: SidebarItem) => {
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
  };

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <img
                src="/polymilesicon.png"
                alt="edunexus Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">edunexus</h2>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center">
            <img
              src="/polymilesicon.png"
              alt="edunexus Logo"
              className="h-6 w-6 object-contain"
            />
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
        <nav className="space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              ) : (
                <div className="mb-1 border-t border-border/40" />
              )}
              <div className="space-y-1">
                {section.items.map(renderItem)}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom pinned — Academic Calendar & Term (all roles) */}
      <div className="border-t px-3 py-3">
        {!collapsed && (
          <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Academic
          </p>
        )}
        <div className="space-y-1">
          {bottomItems.map(renderItem)}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium text-primary">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@edunexus.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}