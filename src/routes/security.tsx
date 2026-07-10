import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, DirectionBadge, SectionHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRequests, getGateLogs, getVehicles } from "@/lib/api/vehicles";
import { logGate } from "@/lib/api/mutations";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { LogOut, LogIn, Search, Wifi } from "lucide-react";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "", direction: "exit" as "exit" | "entry",
    requestId: "", odometer: "", note: "",
  });
  const [logSearch, setLogSearch] = useState("");
  const [logDirection, setLogDirection] = useState("all");
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

  const { data: logs = [], isLoading: loadingLogs, dataUpdatedAt } = useQuery({
    queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 5000,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000,
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"], queryFn: () => getVehicles(),
  });

  const filteredLogs = useMemo(() => (logs as any[]).filter((l) => {
    if (logDirection !== "all" && l.direction !== logDirection) return false;
    if (logFrom && new Date(l.loggedAt) < new Date(logFrom)) return false;
    if (logTo && new Date(l.loggedAt) > new Date(logTo + "T23:59:59")) return false;
    if (logSearch && !`${l.vehicleId} ${l.officerId}`.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  }), [logs, logDirection, logFrom, logTo, logSearch]);

  const readyToExit = useMemo(() => (requests as any[]).filter((r) => r.status === "approved"), [requests]);
  const awaitingReturn = useMemo(() => (requests as any[]).filter((r) => r.status === "approved"), [requests]);
  const relevantRequests = form.direction === "exit" ? readyToExit : awaitingReturn;
  const availableVehicles = (vehicles as any[]).filter((v) => v.status === "available");

  const { mutate, isPending } = useMutation({
    mutationFn: () => logGate({
      data: {
        vehicleId: form.vehicleId,
        officerId: user!.id,
        direction: form.direction,
        requestId: form.requestId || undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined,
        note: form.note || undefined,
      },
    }),
    onSuccess: () => {
      toast.success(form.direction === "entry" ? "Vehicle returned and logged" : "Vehicle dispatched and logged");
      queryClient.invalidateQueries({ queryKey: ["gateLogs"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setOpen(false);
      setForm({ vehicleId: "", direction: "exit", requestId: "", odometer: "", note: "" });
    },
    onError: (err) => { console.error(err); toast.error("Failed to record gate log"); },
  });

  const openDialog = (direction: "exit" | "entry") => {
    setForm({ vehicleId: "", direction, requestId: "", odometer: "", note: "" });
    setOpen(true);
  };

  const getVehicleLabel = (vehicleId: string) => {
    const v = (vehicles as any[]).find((v) => v.id === vehicleId);
    return v ? `${v.registration} — ${v.make} ${v.model}` : vehicleId;
  };

  return (
    <AppShell title="Security Gate" subtitle="Record vehicle exits and entries">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(11,24,48,0.45)" }}>
          <Wifi size={13} color="#047857" /> Live · updated {dataUpdatedAt ? format(dataUpdatedAt, "p") : "—"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => openDialog("exit")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "transparent", color: "#0b1830", border: "1px solid rgba(11,24,48,0.15)", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <LogOut size={15} /> Log Exit
          </button>
          <button onClick={() => openDialog("entry")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <LogIn size={15} /> Log Return
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Search size={13} /> Search</div>
            <Input placeholder="Vehicle or officer..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Direction</div>
            <Select value={logDirection} onValueChange={setLogDirection}>
              <SelectTrigger style={{ width: 140 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="exit">Exit</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>From</div>
            <Input type="date" value={logFrom} onChange={(e) => setLogFrom(e.target.value)} style={{ width: 140 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>To</div>
            <Input type="date" value={logTo} onChange={(e) => setLogTo(e.target.value)} style={{ width: 140 }} />
          </div>
          {(logSearch || logDirection !== "all" || logFrom || logTo) && (
            <button onClick={() => { setLogSearch(""); setLogDirection("all"); setLogFrom(""); setLogTo(""); }} style={{ background: "none", border: "none", color: "rgba(11,24,48,0.45)", fontSize: 13, cursor: "pointer" }}>Clear</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 10 }}>{filteredLogs.length} of {logs.length} logs</div>
      </div>

      <SectionHeader>Gate Log History</SectionHeader>
      {loadingLogs && <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)", fontSize: 14 }}>Loading...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!loadingLogs && filteredLogs.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 48, textAlign: "center", color: "rgba(11,24,48,0.35)", fontSize: 14 }}>No logs match your filters.</div>
        )}
        {filteredLogs.slice().reverse().map((log: any) => (
          <div key={log.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <DirectionBadge direction={log.direction as "exit" | "entry"} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{getVehicleLabel(log.vehicleId)}</span>
              <span style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", marginLeft: "auto" }}>{log.loggedAt ? format(new Date(log.loggedAt), "PPp") : ""}</span>
            </div>
            {log.odometer && <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", marginTop: 6 }}>Odometer: {log.odometer} km</div>}
            {log.notes && <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", fontStyle: "italic", marginTop: 4 }}>Note: {log.notes}</div>}
          </div>
        ))}
      </div>

      {/* Log dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.direction === "exit" ? "Log Vehicle Exit" : "Log Vehicle Return"}</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as "exit" | "entry", requestId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exit">Exit (leaving campus)</SelectItem>
                  <SelectItem value="entry">Entry / Return (back on campus)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {(vehicles as any[]).map((v: any) => <SelectItem key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link to Request (optional)</Label>
              <Select value={form.requestId} onValueChange={(v) => setForm({ ...form, requestId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a request" /></SelectTrigger>
                <SelectContent>
                  {relevantRequests.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.purpose} — {r.destination}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Odometer {form.direction === "entry" ? "(recommended)" : "(optional)"}</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="km" /></div>
            <div><Label>Note (optional)</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <button onClick={() => {
              if (!form.vehicleId) { toast.error("Please select a vehicle"); return; }
              mutate();
            }} disabled={isPending}
              style={{ padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {isPending ? "Saving..." : form.direction === "exit" ? "Confirm Exit" : "Confirm Return"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}