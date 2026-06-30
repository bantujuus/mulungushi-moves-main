import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getMyRequests } from "@/lib/api/vehicles";
import { createRequest } from "@/lib/api/mutations";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    requesterName: user?.name ?? "", department: "", purpose: "", destination: "",
    passengers: 1, departAt: "", returnAt: "",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["myRequests", user?.id],
    queryFn: () => getMyRequests({ data: { userId: user!.id } }),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${r.purpose} ${r.destination} ${r.department}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requests, status, search]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createRequest({ data: { ...form, userId: user!.id } }),
    onSuccess: () => {
      toast.success("Request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["myRequests", user?.id] });
      setOpen(false);
      setForm({ requesterName: user?.name ?? "", department: "", purpose: "", destination: "", passengers: 1, departAt: "", returnAt: "" });
    },
    onError: (err) => { console.error(err); toast.error("Failed to submit request"); },
  });

  return (
    <AppShell title="My Requests" subtitle="Submit and track your vehicle requests">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Request</Button>
      </div>

      {requests.length > 0 && (
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
              <Input placeholder="Purpose, destination..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || status !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">{filteredRequests.length} of {requests.length} requests</div>
        </Card>
      )}

      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading requests...</Card>}

      <div className="space-y-3">
        {!isLoading && requests.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No requests yet. Click "New Request" to get started.</Card>
        )}
        {!isLoading && requests.length > 0 && filteredRequests.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No requests match your filters.</Card>
        )}
        {filteredRequests.slice().reverse().map((r) => (
          <Card key={r.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{r.purpose}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{r.department} · {r.destination} · {r.passengers} passengers</div>
                <div className="text-sm text-muted-foreground">Depart: {format(new Date(r.departAt), "PPp")}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Vehicle Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Your Name</Label><Input value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
            <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div><Label>Passengers</Label><Input type="number" min={1} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })} /></div>
            <div><Label>Departure Date & Time</Label><Input type="datetime-local" value={form.departAt} onChange={(e) => setForm({ ...form, departAt: e.target.value })} /></div>
            <div><Label>Return Date & Time</Label><Input type="datetime-local" value={form.returnAt} onChange={(e) => setForm({ ...form, returnAt: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.requesterName || !form.department || !form.purpose || !form.destination || !form.departAt || !form.returnAt) { toast.error("Please fill in all fields"); return; }
              mutate();
            }} disabled={isPending}>{isPending ? "Submitting..." : "Submit Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}