import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge, SectionHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getMyRequests } from "@/lib/api/vehicles";
import { createRequest } from "@/lib/api/mutations";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, ChevronRight, Search, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    purpose: "", destination: "", passengers: 1, departAt: "", returnAt: "",
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["myRequests", user?.id],
    queryFn: () => getMyRequests({ data: { userId: user!.id } }),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const filteredRequests = useMemo(() => {
    return requests.filter((r: any) => {
      if (status !== "all" && r.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${r.purpose} ${r.destination}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requests, status, search]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createRequest({ data: {
      userId: user!.id,
      requesterName: user!.name,
      department: "",
      purpose: form.purpose,
      destination: form.destination,
      passengers: form.passengers,
      departAt: form.departAt,
      returnAt: form.returnAt,
    }}),
    onSuccess: () => {
      toast.success("Request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["myRequests", user?.id] });
      setOpen(false);
      setForm({ purpose: "", destination: "", passengers: 1, departAt: "", returnAt: "" });
    },
    onError: (err) => { console.error(err); toast.error("Failed to submit request"); },
  });

  return (
    <AppShell title="My Requests" subtitle="Submit and track your vehicle requests">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {requests.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Search size={13} /> Search</div>
            <Input placeholder="Purpose, destination..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger style={{ width: 160 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(search || status !== "all") && (
            <button onClick={() => { setSearch(""); setStatus("all"); }} style={{ background: "none", border: "none", color: "rgba(11,24,48,0.45)", fontSize: 13, cursor: "pointer" }}>Clear</button>
          )}
          <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginLeft: "auto", alignSelf: "center" }}>{filteredRequests.length} of {requests.length}</div>
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: "64px 32px", textAlign: "center" }}>
          <ClipboardList size={32} color="rgba(11,24,48,0.15)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: "rgba(11,24,48,0.35)" }}>No requests yet. Click New Request to get started.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredRequests.slice().reverse().map((r: any) => (
          <div key={r.id}
            onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}
            style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, cursor: "pointer", transition: "border-color 150ms ease", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,67,0.40)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(11,24,48,0.08)")}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{r.purpose}</span>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ fontSize: 14, color: "rgba(11,24,48,0.55)" }}>{r.destination} · {r.passengerCount} passengers</div>
              <div style={{ fontSize: 14, color: "rgba(11,24,48,0.45)", marginTop: 2 }}>
                Depart: {r.departureAt ? format(new Date(r.departureAt), "PPp") : "—"}
              </div>
            </div>
            <ChevronRight size={16} color="rgba(11,24,48,0.30)" />
          </div>
        ))}
        {!isLoading && requests.length > 0 && filteredRequests.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 48, textAlign: "center", color: "rgba(11,24,48,0.35)", fontSize: 14 }}>No requests match your filters.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Vehicle Request</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Reason for the trip" /></div>
            <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div><Label>Passengers</Label><Input type="number" min={1} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })} /></div>
            <div><Label>Departure Date & Time</Label><Input type="datetime-local" value={form.departAt} onChange={(e) => setForm({ ...form, departAt: e.target.value })} /></div>
            <div><Label>Return Date & Time</Label><Input type="datetime-local" value={form.returnAt} onChange={(e) => setForm({ ...form, returnAt: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <button onClick={() => {
              if (!form.purpose || !form.destination || !form.departAt || !form.returnAt) { toast.error("Please fill in all fields"); return; }
              mutate();
            }} disabled={isPending}
              style={{ padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {isPending ? "Submitting..." : "Submit Request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}