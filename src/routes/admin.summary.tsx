import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge, SectionHeader } from "@/components/app-shell";
import { getTripSummary } from "@/lib/api/summary";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from "recharts";

export const Route = createFileRoute("/admin/summary")({
  component: SummaryPage,
});

function StatBox({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color ?? "#0b1830", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SummaryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tripSummary"],
    queryFn: () => getTripSummary(),
    refetchInterval: 15000,
  });

  if (isLoading) return (
    <AppShell title="Trip Summary" subtitle="Operational overview and trip analytics">
      <div style={{ textAlign: "center", padding: 64, color: "rgba(11,24,48,0.45)" }}>Loading summary...</div>
    </AppShell>
  );

  if (!data) return null;

  const { totals, gate, fleet, drivers, vehicleUsage, driverUsage, dailyTrends } = data;

  return (
    <AppShell title="Trip Summary" subtitle="Operational overview and trip analytics">

      {/* Period stats */}
      <SectionHeader>Request Volume</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Today" value={totals.today} sub="requests submitted" />
        <StatBox label="This Week" value={totals.thisWeek} sub="last 7 days" />
        <StatBox label="This Month" value={totals.thisMonth} sub="last 30 days" />
        <StatBox label="All Time" value={totals.allTime} sub="total requests" />
      </div>

      {/* Status breakdown */}
      <SectionHeader>Status Breakdown</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Completed Trips" value={totals.completed} color="#047857" sub="successfully returned" />
        <StatBox label="Pending Approval" value={totals.pending} color="#d97706" sub="awaiting review" />
        <StatBox label="Rejected" value={totals.rejected} color="#dc2626" sub="not approved" />
        <StatBox label="Avg. Passengers" value={totals.avgPassengers} sub="per trip" />
      </div>

      {/* Daily trend chart */}
      <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <SectionHeader>Daily Request Trend (Last 14 Days)</SectionHeader>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,24,48,0.06)" />
            <XAxis dataKey="date" fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} />
            <YAxis fontSize={11} tick={{ fill: "rgba(11,24,48,0.45)" }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,24,48,0.10)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="total" fill="#0b1830" name="Total" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#047857" name="Completed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#d4a843" name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gate summary */}
      <SectionHeader>Gate Activity</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Today Exits" value={gate.todayExits} sub="vehicles left campus" />
        <StatBox label="Today Entries" value={gate.todayEntries} sub="vehicles returned" />
        <StatBox label="All-Time Exits" value={gate.totalExits} />
        <StatBox label="All-Time Entries" value={gate.totalEntries} />
      </div>

      {/* Fleet summary */}
      <SectionHeader>Fleet Status</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatBox label="Total Vehicles" value={fleet.total} />
        <StatBox label="Available" value={fleet.available} color="#047857" />
        <StatBox label="In Use" value={fleet.inUse} color="#0b1830" />
        <StatBox label="Maintenance" value={fleet.maintenance} color="#d97706" />
      </div>

      {/* Vehicle utilisation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
          <SectionHeader>Vehicle Utilisation (Completed Trips)</SectionHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicleUsage.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(11,24,48,0.06)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1830" }}>{v.registration}</div>
                  <div style={{ fontSize: 12, color: "rgba(11,24,48,0.50)" }}>{v.make} {v.model}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{v.trips} trip{v.trips !== 1 ? "s" : ""}</div>
                  <StatusBadge status={v.status} />
                </div>
              </div>
            ))}
            {vehicleUsage.length === 0 && <div style={{ fontSize: 14, color: "rgba(11,24,48,0.35)", padding: "8px 0" }}>No data yet.</div>}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
          <SectionHeader>Driver Utilisation (Completed Trips)</SectionHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {driverUsage.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(11,24,48,0.06)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1830" }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(11,24,48,0.50)" }}>{d.license}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{d.trips} trip{d.trips !== 1 ? "s" : ""}</div>
                  <StatusBadge status={d.available ? "available" : "in-use"} />
                </div>
              </div>
            ))}
            {driverUsage.length === 0 && <div style={{ fontSize: 14, color: "rgba(11,24,48,0.35)", padding: "8px 0" }}>No data yet.</div>}
          </div>
        </div>
      </div>

    </AppShell>
  );
}