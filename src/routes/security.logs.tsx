import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, DirectionBadge, SectionHeader } from "@/components/app-shell";
import { getGateLogs, getVehicles } from "@/lib/api/vehicles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/security/logs")({
  component: SecurityLogsPage,
});

function SecurityLogsPage() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 10000,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"], queryFn: () => getVehicles(),
  });

  const getVehicleLabel = (vehicleId: string) => {
    const v = (vehicles as any[]).find((v) => v.id === vehicleId);
    return v ? `${v.registration} — ${v.make} ${v.model}` : vehicleId;
  };

  const filtered = useMemo(() => (logs as any[]).filter((l) => {
    if (direction !== "all" && l.direction !== direction) return false;
    if (from && new Date(l.loggedAt) < new Date(from)) return false;
    if (to && new Date(l.loggedAt) > new Date(to + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      const vehicleLabel = getVehicleLabel(l.vehicleId).toLowerCase();
      if (!vehicleLabel.includes(q) && !l.notes?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [logs, direction, from, to, search, vehicles]);

  return (
    <AppShell title="Gate Logs" subtitle="Full searchable history of all vehicle movements">

      {/* Filter bar */}
      <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Search size={13} /> Search
            </div>
            <Input placeholder="Vehicle registration or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Direction</div>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger style={{ width: 140 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="exit">Exit only</SelectItem>
                <SelectItem value="entry">Entry only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>From</div>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 140 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>To</div>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 140 }} />
          </div>
          {(search || direction !== "all" || from || to) && (
            <button onClick={() => { setSearch(""); setDirection("all"); setFrom(""); setTo(""); }}
              style={{ background: "none", border: "none", color: "rgba(11,24,48,0.45)", fontSize: 13, cursor: "pointer", padding: "0 4px" }}>
              Clear
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 10 }}>
          {filtered.length} of {logs.length} logs
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Logs", value: logs.length },
          { label: "Exits", value: (logs as any[]).filter((l) => l.direction === "exit").length },
          { label: "Entries", value: (logs as any[]).filter((l) => l.direction === "entry").length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0b1830", letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <SectionHeader>Log History</SectionHeader>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)", fontSize: 14 }}>Loading...</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 48, textAlign: "center", color: "rgba(11,24,48,0.35)", fontSize: 14 }}>
            No logs match your filters.
          </div>
        )}
        {filtered.slice().reverse().map((log: any) => (
          <div key={log.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <DirectionBadge direction={log.direction as "exit" | "entry"} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>
                {getVehicleLabel(log.vehicleId)}
              </span>
              <span style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", marginLeft: "auto" }}>
                {log.loggedAt ? format(new Date(log.loggedAt), "PPp") : "—"}
              </span>
            </div>
            {log.odometer && (
              <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)", marginTop: 8 }}>
                Odometer: <strong>{log.odometer.toLocaleString()} km</strong>
              </div>
            )}
            {log.notes && (
              <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", fontStyle: "italic", marginTop: 4 }}>
                Note: {log.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}