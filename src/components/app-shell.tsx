import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, ShieldCheck, Car, LogOut, ClipboardCheck, ScanLine, Users } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { logoutUser } from "@/lib/api/auth";
import { getRequests } from "@/lib/api/vehicles";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import type { ReactNode } from "react";

const NAV: Record<Role, { to: string; label: string; icon: any }[]> = {
  staff: [
    { to: "/staff", label: "My Requests", icon: FileText },
  ],
transport: [
  { to: "/transport", label: "Approvals", icon: ClipboardCheck },
  { to: "/transport/fleet", label: "Fleet Status", icon: Car },
  { to: "/admin/reports", label: "Reports", icon: FileText },
],
  security: [
    { to: "/security", label: "Gate Control", icon: ScanLine },
    { to: "/security/logs", label: "Gate Logs", icon: FileText },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/vehicles", label: "Vehicles", icon: Car },
    { to: "/admin/drivers", label: "Drivers", icon: ShieldCheck },
    { to: "/admin/reports", label: "Reports", icon: FileText },
  ],
};

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, sessionId, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Pending count for transport officers
  const { data: requests = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => getRequests(),
    enabled: user?.role === "transport" || user?.role === "admin",
    refetchInterval: 5000,
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Update browser tab title with pending count
  useEffect(() => {
    if ((user?.role === "transport" || user?.role === "admin") && pendingCount > 0) {
      document.title = `(${pendingCount}) MU Fleet & Gate System`;
    } else {
      document.title = "MU Fleet & Gate System";
    }
  }, [pendingCount, user?.role]);

  if (!user) {
    navigate({ to: "/" });
    return null;
  }

  const items = NAV[user.role];

  const handleLogout = async () => {
    if (sessionId) {
      try { await logoutUser({ data: { sessionId, userId: user.id } }); } catch {}
    }
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-display font-bold">MU</div>
            <div>
              <div className="font-display font-semibold text-sm leading-tight">Mulungushi</div>
              <div className="text-xs opacity-70">Fleet & Gate System</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            const showBadge = item.to === "/transport" && pendingCount > 0;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground/85"
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-semibold">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs opacity-70 hover:opacity-100 px-2 py-2 w-full">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="border-b bg-card">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role} portal</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
            </div>
          </div>
          <div className="md:hidden px-6 pb-3 flex gap-2 overflow-x-auto">
            {items.map((item) => (
              <Button key={item.to} asChild size="sm" variant={pathname === item.to ? "default" : "outline"}>
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    dispatched: "bg-primary/10 text-primary border-primary/30",
    returned: "bg-muted text-muted-foreground border-border",
    available: "bg-success/15 text-success border-success/30",
    "in-use": "bg-primary/10 text-primary border-primary/30",
    maintenance: "bg-warning/15 text-warning-foreground border-warning/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] ?? "bg-muted"}`}>
      {status.replace("-", " ")}
    </span>
  );
}
