import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, ShieldCheck, Car, LogOut, ClipboardCheck, ScanLine, Users, ArrowUpRight, ArrowDownLeft, ClipboardList } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { logoutUser } from "@/lib/api/auth";
import { getRequests } from "@/lib/api/vehicles";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

const NAV: Record<Role, { to: string; label: string; icon: any }[]> = {
  staff: [
    { to: "/staff", label: "My Requests", icon: FileText },
  ],
  transport: [
    { to: "/transport", label: "Approvals", icon: ClipboardCheck },
    { to: "/transport/fleet", label: "Fleet Status", icon: Car },
    { to: "/admin/summary", label: "Trip Summary", icon: ClipboardList },
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
    { to: "/admin/summary", label: "Trip Summary", icon: ClipboardList },
    { to: "/admin/reports", label: "Reports", icon: FileText },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  staff: "STAFF PORTAL",
  transport: "TRANSPORT OFFICE",
  security: "SECURITY GATE",
  admin: "ADMINISTRATOR",
};

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, sessionId, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: requests = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: () => getRequests(),
    enabled: user?.role === "transport" || user?.role === "admin",
    refetchInterval: 5000,
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  useEffect(() => {
    if ((user?.role === "transport" || user?.role === "admin") && pendingCount > 0) {
      document.title = `(${pendingCount}) MU Fleet & Gate System`;
    } else {
      document.title = "MU Fleet & Gate System";
    }
  }, [pendingCount, user?.role]);

  if (!user) { navigate({ to: "/" }); return null; }

  const items = NAV[user.role];
  const initials = user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("");

  const handleLogout = async () => {
    if (sessionId) { try { await logoutUser({ data: { sessionId, userId: user.id } }); } catch {} }
    logout();
    navigate({ to: "/" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f5f6f8", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, flexShrink: 0, background: "#0b1830", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 40 }}>
        {/* Logo zone */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.10)", height: 68, display: "flex", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
  <img src="/mu-crest.png" alt="MU Crest" style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))", flexShrink: 0 }} />
  <div>
    <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>Mulungushi</div>
    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.10em" }}>Fleet & Gate System</div>
  </div>
</Link>
        </div>

        {/* Role label strip */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.15em" }}>{ROLE_LABELS[user.role]}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            const showBadge = item.to === "/transport" && pendingCount > 0;
            return (
              <Link key={item.to} to={item.to} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8,
                textDecoration: "none", transition: "all 150ms ease",
                background: active ? "#d4a843" : "transparent",
                color: active ? "#0b1830" : "rgba(255,255,255,0.70)",
                fontWeight: active ? 600 : 500, fontSize: 14,
              }}>
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {showBadge && (
                  <span style={{ background: active ? "#0b1830" : "#d4a843", color: active ? "#d4a843" : "#0b1830", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", lineHeight: "18px", height: 18 }}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <img src="/mu-crest.png" alt="MU" style={{ height: 32, width: 32, objectFit: "contain", opacity: 0.85 }} />
  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0b1830", color: "#d4a843", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
    {initials}
  </div>
</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "capitalize" }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.40)", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.80)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ background: "#ffffff", borderBottom: "1px solid rgba(11,24,48,0.08)", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0b1830", letterSpacing: "-0.01em" }}>{title}</h1>
            {subtitle && <p style={{ margin: 0, fontSize: 14, color: "rgba(11,24,48,0.50)", marginTop: 2 }}>{subtitle}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0b1830" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "rgba(11,24,48,0.45)", textTransform: "capitalize" }}>{user.role} portal</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0b1830", color: "#d4a843", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, maxWidth: 1144, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { background: string; color: string; border: string; text: string }> = {
    pending:     { background: "#fffbeb", color: "#d97706", border: "#fde68a", text: "Pending" },
    approved:    { background: "#ecfdf5", color: "#047857", border: "#6ee7b7", text: "Approved" },
    rejected:    { background: "#fef2f2", color: "#dc2626", border: "#fecaca", text: "Rejected" },
    dispatched:  { background: "rgba(11,24,48,0.08)", color: "#0b1830", border: "rgba(11,24,48,0.20)", text: "Dispatched" },
    returned:    { background: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", text: "Returned" },
    available:   { background: "#ecfdf5", color: "#047857", border: "#6ee7b7", text: "Available" },
    "in-use":    { background: "rgba(11,24,48,0.08)", color: "#0b1830", border: "rgba(11,24,48,0.20)", text: "In Use" },
    maintenance: { background: "#fffbeb", color: "#d97706", border: "#fde68a", text: "Maintenance" },
    staff:       { background: "#ecfdf5", color: "#047857", border: "#6ee7b7", text: "Staff" },
    transport:   { background: "rgba(11,24,48,0.08)", color: "#0b1830", border: "rgba(11,24,48,0.20)", text: "Transport" },
    security:    { background: "#fffbeb", color: "#d97706", border: "#fde68a", text: "Security" },
    admin:       { background: "#fef2f2", color: "#dc2626", border: "#fecaca", text: "Admin" },
  };
  const s = styles[status] ?? { background: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", text: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.background, color: s.color, border: `1px solid ${s.border}`, textTransform: "capitalize" }}>
      {s.text}
    </span>
  );
}

export function DirectionBadge({ direction }: { direction: "exit" | "entry" }) {
  return direction === "exit" ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#0b1830", color: "#d4a843" }}>
      <ArrowUpRight size={11} /> EXIT
    </span>
  ) : (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#047857" }}>
      <ArrowDownLeft size={11} /> ENTRY
    </span>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 4, height: 16, background: "#d4a843", borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#0b1830", textTransform: "uppercase", letterSpacing: "0.10em" }}>{children}</span>
    </div>
  );
}
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
      <span>⚠</span> {error}
    </div>
  );
}

