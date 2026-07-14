import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge, DirectionBadge, SectionHeader } from "@/components/app-shell";
import { getRequests, getVehicles, getGateLogs } from "@/lib/api/vehicles";
import { getAnalytics } from "@/lib/api/analytics";
import { Car, Users, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { format } from "date-fns";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname === "/admin" ? <AdminPage /> : <Outlet />;
}

const COLORS = ["#d4a843", "#047857", "#d97706", "#9333ea", "#dc2626", "#0891b2"];

function StatCard({ label, value, icon: Icon, highlight }: { label: string; value: number; icon: any; highlight?: boolean }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid rgba(11,24,48,0.08)`, borderRadius: 12, padding: 20,
      minHeight: 96, display: "flex", flexDirection: "column", gap: 12,
      borderLeft: highlight && value > 0 ? "4px solid #d4a843" : undefined,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(11,24,48,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color="rgba(11,24,48,0.40)" />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#0b1830", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000 });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const { data: logs = [] } = useQuery({ queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 5000 });
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: () => getAnalytics(), refetchInterval: 15000 });

  const stats = [
    { label: "Total Requests", value: requests.length, icon: ClipboardList },
    { label: "Pending", value: requests.filter((r: any) => r.status === "pending").length, icon: ClipboardList, highlight: true },
    { label: "Vehicles", value: vehicles.length, icon: Car },
    { label: "Available", value: vehicles.filter((v: any) => v.status === "available").length, icon: Car },
    { label: "Gate Logs", value: logs.length, icon: ShieldCheck },
  ];

  return (
    <AppShell title="Admin Dashboard" subtitle="System-wide overview of Mulungushi Moves">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <SectionHeader>Weekly Request Volume</SectionHeader>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analytics.weeklyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,24,48,0.06)" />
                <XAxis dataKey="week" fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} />
                <YAxis fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,24,48,0.10)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#0b1830" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="approved" stroke="#047857" strokeWidth={2} name="Approved" dot={false} />
                <Line type="monotone" dataKey="rejected" stroke="#dc2626" strokeWidth={2} name="Rejected" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <SectionHeader>Fleet Utilisation</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.fleetUtilization} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,24,48,0.06)" />
                <XAxis type="number" fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,24,48,0.10)", fontSize: 12 }} />
                <Bar dataKey="trips" name="Trips" radius={[0, 4, 4, 0]}>
                  {analytics.fleetUtilization.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <SectionHeader>Peak Dispatch Hours</SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,24,48,0.06)" />
                <XAxis dataKey="hour" fontSize={10} tick={{ fill: "rgba(11,24,48,0.45)" }} interval={2} />
                <YAxis fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,24,48,0.10)", fontSize: 12 }} />
                <Bar dataKey="count" fill="#d4a843" name="Exits" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <SectionHeader>Recent Requests</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.slice().reverse().slice(0, 10).map((r: any) => (
            <div key={r.id}
              onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}
              style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, cursor: "pointer", transition: "border-color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,67,0.40)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(11,24,48,0.08)")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{r.purpose}</span>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ fontSize: 14, color: "rgba(11,24,48,0.55)" }}>{r.destination} · {r.passengerCount} passengers</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader>Recent Gate Logs</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {logs.slice().reverse().slice(0, 10).map((log: any) => (
            <div key={log.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <DirectionBadge direction={log.direction as "exit" | "entry"} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{log.vehicleId}</span>
              <span style={{ fontSize: 14, color: "rgba(11,24,48,0.55)", flex: 1 }}>
                {log.loggedAt ? format(new Date(log.loggedAt), "PPp") : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
