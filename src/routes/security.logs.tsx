import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, DirectionBadge, SectionHeader } from "@/components/app-shell";
import { getGateLogs } from "@/lib/api/vehicles";
import { format } from "date-fns";

export const Route = createFileRoute("/security/logs")({
  component: SecurityLogsPage,
});

function SecurityLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 5000,
  });

  return (
    <AppShell title="Gate Logs" subtitle="Full history of vehicle movements">
      <SectionHeader>All Gate Activity</SectionHeader>
      {isLoading && <div style={{ textAlign: "center", padding: 32, color: "rgba(11,24,48,0.45)", fontSize: 14 }}>Loading...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {logs.slice().reverse().map((log) => (
          <div key={log.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <DirectionBadge direction={log.direction as "exit" | "entry"} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{log.vehiclePlate}</span>
              <span style={{ fontSize: 14, color: "rgba(11,24,48,0.55)" }}>Driver: {log.driverName} · Officer: {log.officer}</span>
              <span style={{ fontSize: 14, color: "rgba(11,24,48,0.45)", marginLeft: "auto" }}>{format(new Date(log.timestamp), "PPp")}</span>
            </div>
            {log.odometer && <div style={{ fontSize: 14, color: "rgba(11,24,48,0.45)", marginTop: 6 }}>Odometer: {log.odometer} km</div>}
            {log.note && <div style={{ fontSize: 14, color: "rgba(11,24,48,0.45)", fontStyle: "italic", marginTop: 4 }}>Note: {log.note}</div>}
          </div>
        ))}
        {!isLoading && logs.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.35)", fontSize: 14 }}>No gate logs yet.</div>
        )}
      </div>
    </AppShell>
  );
}