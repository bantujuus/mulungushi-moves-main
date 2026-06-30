import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequests, getGateLogs } from "@/lib/api/vehicles";
import { logGate } from "@/lib/api/mutations";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ShieldCheck, Wifi, LogOut, LogIn, Search } from "lucide-react";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehiclePlate: "", driverName: "", direction: "exit" as "exit" | "entry",
    officer: "", requestId: "", odometer: "", note: "",
  });

  const { data: logs = [], isLoading: loadingLogs, dataUpdatedAt } = useQuery({
    queryKey: ["gateLogs"], queryFn: () => getGateLogs(), refetchInterval: 5000,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000,
  });

  // ── Filters: Gate Logs ──
  const [logSearch, setLogSearch] = useState("");
  const [logDirection, setLogDirection] = useState<string>("all");
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logDirection !== "all" && l.direction !== logDirection) return false;
      if (logFrom && new Date(l.timestamp) < new Date(logFrom)) return false;
      if (logTo && new Date(l.timestamp) > new Date(logTo + "T23:59:59")) return false;
      if (logSearch) {
        const q = logSearch.toLowerCase();
        if (!`${l.vehiclePlate} ${l.driverName} ${l.officer}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, logDirection, logFrom, logTo, logSearch]);

  const readyToExit = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const awaitingReturn = useMemo(() => requests.filter((r) => r.status === "dispatched"), [requests]);
  const relevantRequests = form.direction === "exit" ? readyToExit : awaitingReturn;

  const { mutate, isPending } = useMutation({
    mutationFn: () => logGate({
      data: {
        vehiclePlate: form.vehiclePlate, driverName: form.driverName, direction: form.direction,
        officer: form.officer, requestId: form.requestId || undefined,
        odometer: form.odometer ? Number(form.odometer) : undefined, note: form.note || undefined,
      },
    }),
    onSuccess: () => {
      toast.success(form.direction === "entry" ? "Vehicle returned and logged" : "Vehicle dispatched and logged");
      queryClient.invalidateQueries({ queryKey: ["gateLogs"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setOpen(false);
      setForm({ vehiclePlate: "", driverName: "", direction: "exit", officer: "", requestId: "", odometer: "", note: "" });
    },
    onError: (err) => { console.error(err); toast.error("Failed to record gate log"); },
  });

  const handleRequestSelect = (requestId: string) => setForm((f) => ({ ...f, requestId, driverName: "" }));
  const openDialog = (direction: "exit" | "entry") => {
    setForm({ vehiclePlate: "", driverName: "", direction, officer: "", requestId: "", odometer: "", note: "" });
    setOpen(true);
  };

  return (
    <AppShell title="Security Gate" subtitle="Record vehicle exits and entries">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="w-3.5 h-3.5 text-green-600" /> Live · updated {format(dataUpdatedAt, "p")}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openDialog("exit")}><LogOut className="w-4 h-4 mr-2" /> Log Exit</Button>
          <Button onClick={() => openDialog("entry")}><LogIn className="w-4 h-4 mr-2" /> Log Return</Button>
        </div>
      </div>

      {awaitingReturn.length > 0 && (
        <Card className="p-5 mb-6 border-orange-200 bg-orange-50/50">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2"><LogIn className="w-4 h-4 text-orange-600" /> Vehicles Currently Out — Awaiting Return</h3>
          <div className="space-y-2">
            {awaitingReturn.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2 text-sm border border-orange-100">
                <div><span className="font-medium">{r.requesterName}</span><span className="text-muted-foreground"> · {r.destination} · departed {format(new Date(r.departAt), "PPp")}</span></div>
                <Button size="sm" variant="outline" onClick={() => { setForm({ vehiclePlate: "", driverName: "", direction: "entry", officer: "", requestId: r.id, odometer: "", note: "" }); setOpen(true); }}>Log Return</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs defaultValue="logs">
        <TabsList className="mb-4"><TabsTrigger value="logs">Gate Log History</TabsTrigger></TabsList>
        <TabsContent value="logs">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Plate, driver, officer..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Direction</Label>
                <Select value={logDirection} onValueChange={setLogDirection}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="exit">Exit</SelectItem>
                    <SelectItem value="entry">Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">From</Label><Input type="date" value={logFrom} onChange={(e) => setLogFrom(e.target.value)} className="w-36" /></div>
              <div><Label className="text-xs">To</Label><Input type="date" value={logTo} onChange={(e) => setLogTo(e.target.value)} className="w-36" /></div>
              {(logSearch || logDirection !== "all" || logFrom || logTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setLogSearch(""); setLogDirection("all"); setLogFrom(""); setLogTo(""); }}>Clear filters</Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredLogs.length} of {logs.length} logs</div>
          </Card>

          {loadingLogs && <Card className="p-8 text-center text-sm text-muted-foreground">Loading logs...</Card>}
          <div className="space-y-3">
            {!loadingLogs && filteredLogs.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No logs match your filters.</Card>}
            {filteredLogs.slice().reverse().map((log) => (
              <Card key={log.id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">{log.vehiclePlate}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.direction === "exit" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {log.direction === "exit" ? "EXIT" : "ENTRY"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Driver: {log.driverName} · Officer: {log.officer}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(log.timestamp), "PPp")}</div>
                    {log.odometer && <div className="text-sm text-muted-foreground">Odometer: {log.odometer} km</div>}
                    {log.note && <div className="text-sm text-muted-foreground italic">Note: {log.note}</div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.direction === "exit" ? "Log Vehicle Exit" : "Log Vehicle Return"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
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
              <Label>{form.direction === "exit" ? "Approved Request (ready to dispatch)" : "Trip Awaiting Return"}</Label>
              <Select value={form.requestId} onValueChange={handleRequestSelect}>
                <SelectTrigger><SelectValue placeholder={relevantRequests.length === 0 ? "No matching requests" : "Select a request"} /></SelectTrigger>
                <SelectContent>{relevantRequests.map((r) => <SelectItem key={r.id} value={r.id}>{r.purpose} — {r.requesterName}</SelectItem>)}</SelectContent>
              </Select>
              {relevantRequests.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">{form.direction === "exit" ? "No approved requests are currently waiting to leave." : "No vehicles are currently out awaiting return."}</p>
              )}
            </div>
            <div><Label>Vehicle Plate</Label><Input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="e.g. MU 001 ZM" /></div>
            <div><Label>Driver Name</Label><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></div>
            <div><Label>Security Officer Name</Label><Input value={form.officer} onChange={(e) => setForm({ ...form, officer: e.target.value })} /></div>
            <div><Label>Odometer Reading {form.direction === "entry" ? "(recommended on return)" : "(optional)"}</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="km" /></div>
            <div><Label>Note (optional)</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.vehiclePlate || !form.driverName || !form.officer) { toast.error("Please fill in plate, driver and officer fields"); return; }
              mutate();
            }} disabled={isPending}>{isPending ? "Saving..." : form.direction === "exit" ? "Confirm Exit" : "Confirm Return"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}