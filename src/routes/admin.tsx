import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { getRequests, getVehicles, getDrivers, getGateLogs } from "@/lib/api/vehicles";
import { getAnalytics } from "@/lib/api/analytics";
import { Car, Users, ClipboardList, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/admin";
  return isIndex ? <AdminPage /> : <Outlet />;
}

const COLORS = ["#1d4ed8", "#16a34a", "#ea580c", "#9333ea", "#dc2626", "#0891b2"];

function AdminPage() {
  const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000 });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers() });
  const { data: logs = [] } = useQuery({ queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 5000 });
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: () => getAnalytics(), refetchInterval: 15000 });

  const stats = [
    { label: "Total Requests", value: requests.length, icon: ClipboardList },
    { label: "Pending", value: requests.filter((r) => r.status === "pending").length, icon: ClipboardList },
    { label: "Vehicles", value: vehicles.length, icon: Car },
    { label: "Available Vehicles", value: vehicles.filter((v) => v.status === "available").length, icon: Car },
    { label: "Drivers", value: drivers.length, icon: Users },
    { label: "Available Drivers", value: drivers.filter((d) => d.available).length, icon: Users },
    { label: "Gate Logs", value: logs.length, icon: ShieldCheck },
  ];

  return (
    <AppShell title="Admin Dashboard" subtitle="System-wide overview of Mulungushi Moves">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-3xl font-semibold">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly volume */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold mb-1">Weekly Request Volume</h2>
            <p className="text-xs text-muted-foreground mb-4">Last 12 weeks · total requests vs approved vs rejected</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.weeklyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#1d4ed8" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="approved" stroke="#16a34a" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#dc2626" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Fleet utilisation */}
          <Card className="p-5">
            <h2 className="font-semibold mb-1">Fleet Utilisation</h2>
            <p className="text-xs text-muted-foreground mb-4">Share of completed trips per vehicle</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.fleetUtilization} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                <Tooltip formatter={(value: any, name: any) => name === "utilization" ? [`${value}%`, "Utilisation"] : [value, "Trips"]} />
                <Bar dataKey="trips" name="Trips" radius={[0, 4, 4, 0]}>
                  {analytics.fleetUtilization.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Peak dispatch hours */}
          <Card className="p-5">
            <h2 className="font-semibold mb-1">Peak Dispatch Hours</h2>
            <p className="text-xs text-muted-foreground mb-4">Vehicle exits by hour of day</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hour" fontSize={10} interval={2} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ea580c" name="Exits" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      <h2 className="font-semibold text-lg mb-3">All Requests</h2>
      <div className="space-y-3 mb-8">
        {requests.slice().reverse().slice(0, 10).map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{r.purpose}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {r.requesterName} · {r.department} · {r.destination}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="font-semibold text-lg mb-3">Recent Gate Logs</h2>
      <div className="space-y-3">
        {logs.slice().reverse().slice(0, 10).map((log) => (
          <Card key={log.id} className="p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.direction === "exit" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                {log.direction === "exit" ? "EXIT" : "ENTRY"}
              </span>
              <span className="font-medium">{log.vehiclePlate}</span>
              <span className="text-sm text-muted-foreground">{log.driverName} · {log.officer}</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}