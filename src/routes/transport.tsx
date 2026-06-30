import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequests, getVehicles, getDrivers } from "@/lib/api/vehicles";
import { approveRequest, rejectRequest, addVehicle, updateVehicle, deleteVehicle, addDriver, updateDriver, deleteDriver } from "@/lib/api/mutations";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Check, X, ChevronRight, Pencil, Trash2, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/transport")({
  component: TransportPage,
});

const EMPTY_VEHICLE = { plate: "", make: "", model: "", capacity: 4, status: "available" as const };
const EMPTY_DRIVER = { name: "", license: "", phone: "", available: true };

function TransportPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: requests = [], isLoading: loadingRequests } = useQuery({ queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000 });
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers() });

  // ── Filters: Requests ──
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatus, setReqStatus] = useState<string>("all");
  const [reqDept, setReqDept] = useState<string>("all");
  const [reqFrom, setReqFrom] = useState("");
  const [reqTo, setReqTo] = useState("");

  const departments = useMemo(() => Array.from(new Set(requests.map((r) => r.department))).sort(), [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (reqStatus !== "all" && r.status !== reqStatus) return false;
      if (reqDept !== "all" && r.department !== reqDept) return false;
      if (reqFrom && new Date(r.departAt) < new Date(reqFrom)) return false;
      if (reqTo && new Date(r.departAt) > new Date(reqTo + "T23:59:59")) return false;
      if (reqSearch) {
        const q = reqSearch.toLowerCase();
        const haystack = `${r.requesterName} ${r.purpose} ${r.destination} ${r.department}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [requests, reqStatus, reqDept, reqFrom, reqTo, reqSearch]);

  // ── Filters: Vehicles ──
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState<string>("all");
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (vehicleStatus !== "all" && v.status !== vehicleStatus) return false;
      if (vehicleSearch) {
        const q = vehicleSearch.toLowerCase();
        if (!`${v.plate} ${v.make} ${v.model}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, vehicleStatus, vehicleSearch]);

  // ── Filters: Drivers ──
  const [driverSearch, setDriverSearch] = useState("");
  const [driverStatus, setDriverStatus] = useState<string>("all");
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (driverStatus === "available" && !d.available) return false;
      if (driverStatus === "unavailable" && d.available) return false;
      if (driverSearch) {
        const q = driverSearch.toLowerCase();
        if (!`${d.name} ${d.license} ${d.phone}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [drivers, driverStatus, driverSearch]);

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [approveForm, setApproveForm] = useState({ vehicleId: "", driverId: "", note: "" });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [rejectNote, setRejectNote] = useState("");
  const [vehicleDialog, setVehicleDialog] = useState<{ open: boolean; editing: boolean; id?: string }>({ open: false, editing: false });
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [driverDialog, setDriverDialog] = useState<{ open: boolean; editing: boolean; id?: string }>({ open: false, editing: false });
  const [driverForm, setDriverForm] = useState(EMPTY_DRIVER);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: "vehicle" | "driver"; id: string; name: string }>({ open: false, type: "vehicle", id: "", name: "" });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveRequest({ data: { id: approveDialog.requestId, ...approveForm } }),
    onSuccess: () => { toast.success("Request approved"); setApproveDialog({ open: false, requestId: "" }); invalidate(); },
    onError: () => toast.error("Failed to approve request"),
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectRequest({ data: { id: rejectDialog.requestId, note: rejectNote } }),
    onSuccess: () => { toast.success("Request rejected"); setRejectDialog({ open: false, requestId: "" }); invalidate(); },
    onError: () => toast.error("Failed to reject request"),
  });
  const vehicleMutation = useMutation({
    mutationFn: () => vehicleDialog.editing && vehicleDialog.id
      ? updateVehicle({ data: { id: vehicleDialog.id, ...vehicleForm, capacity: Number(vehicleForm.capacity) } })
      : addVehicle({ data: { ...vehicleForm, capacity: Number(vehicleForm.capacity) } }),
    onSuccess: () => { toast.success(vehicleDialog.editing ? "Vehicle updated" : "Vehicle added"); setVehicleDialog({ open: false, editing: false }); invalidate(); },
    onError: () => toast.error("Failed to save vehicle"),
  });
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle({ data: { id } }),
    onSuccess: () => { toast.success("Vehicle deleted"); setDeleteConfirm({ ...deleteConfirm, open: false }); invalidate(); },
    onError: () => toast.error("Failed to delete vehicle"),
  });
  const driverMutation = useMutation({
    mutationFn: () => driverDialog.editing && driverDialog.id
      ? updateDriver({ data: { id: driverDialog.id, ...driverForm } })
      : addDriver({ data: driverForm }),
    onSuccess: () => { toast.success(driverDialog.editing ? "Driver updated" : "Driver added"); setDriverDialog({ open: false, editing: false }); invalidate(); },
    onError: () => toast.error("Failed to save driver"),
  });
  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => deleteDriver({ data: { id } }),
    onSuccess: () => { toast.success("Driver deleted"); setDeleteConfirm({ ...deleteConfirm, open: false }); invalidate(); },
    onError: () => toast.error("Failed to delete driver"),
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const availableDrivers = drivers.filter((d) => d.available);

  return (
    <AppShell title="Transport Office" subtitle="Manage vehicle requests, fleet and drivers">
      <Tabs defaultValue="requests">
        <TabsList className="mb-6">
          <TabsTrigger value="requests">
            Requests {pendingRequests.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{pendingRequests.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="vehicles">Fleet</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        {/* Requests */}
        <TabsContent value="requests">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Name, purpose, destination..." value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={reqStatus} onValueChange={setReqStatus}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
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
              <div>
                <Label className="text-xs">Department</Label>
                <Select value={reqDept} onValueChange={setReqDept}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Depart From</Label>
                <Input type="date" value={reqFrom} onChange={(e) => setReqFrom(e.target.value)} className="w-36" />
              </div>
              <div>
                <Label className="text-xs">Depart To</Label>
                <Input type="date" value={reqTo} onChange={(e) => setReqTo(e.target.value)} className="w-36" />
              </div>
              {(reqSearch || reqStatus !== "all" || reqDept !== "all" || reqFrom || reqTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setReqSearch(""); setReqStatus("all"); setReqDept("all"); setReqFrom(""); setReqTo(""); }}>
                  Clear filters
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredRequests.length} of {requests.length} requests</div>
          </Card>

          {loadingRequests && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
          <div className="space-y-3">
            {filteredRequests.slice().reverse().map((r) => (
              <Card key={r.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{r.purpose}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{r.requesterName} · {r.department}</div>
                    <div className="text-sm text-muted-foreground">{r.destination} · {r.passengers} passengers</div>
                    <div className="text-sm text-muted-foreground">Depart: {format(new Date(r.departAt), "PPp")}</div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => { setApproveDialog({ open: true, requestId: r.id }); setApproveForm({ vehicleId: "", driverId: "", note: "" }); }}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectDialog({ open: true, requestId: r.id }); setRejectNote(""); }}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
            {!loadingRequests && filteredRequests.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">No requests match your filters.</Card>
            )}
          </div>
        </TabsContent>

        {/* Fleet */}
        <TabsContent value="vehicles">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Plate, make, model..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={vehicleStatus} onValueChange={setVehicleStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setVehicleForm(EMPTY_VEHICLE); setVehicleDialog({ open: true, editing: false }); }} className="ml-auto">
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredVehicles.length} of {vehicles.length} vehicles</div>
          </Card>

          {loadingVehicles && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
          <div className="space-y-3">
            {filteredVehicles.map((v) => (
              <Card key={v.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{v.make} {v.model}</h3>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{v.plate} · {v.capacity} seats</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setVehicleForm({ plate: v.plate, make: v.make, model: v.model, capacity: v.capacity, status: v.status });
                      setVehicleDialog({ open: true, editing: true, id: v.id });
                    }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm({ open: true, type: "vehicle", id: v.id, name: `${v.make} ${v.model} (${v.plate})` })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredVehicles.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No vehicles match your filters.</Card>}
          </div>
        </TabsContent>

        {/* Drivers */}
        <TabsContent value="drivers">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Name, license, phone..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={driverStatus} onValueChange={setDriverStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setDriverForm(EMPTY_DRIVER); setDriverDialog({ open: true, editing: false }); }} className="ml-auto">
                <Plus className="w-4 h-4 mr-2" /> Add Driver
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredDrivers.length} of {drivers.length} drivers</div>
          </Card>

          {loadingDrivers && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
          <div className="space-y-3">
            {filteredDrivers.map((d) => (
              <Card key={d.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{d.name}</h3>
                      <StatusBadge status={d.available ? "available" : "in-use"} />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{d.license} · {d.phone}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setDriverForm({ name: d.name, license: d.license, phone: d.phone, available: d.available });
                      setDriverDialog({ open: true, editing: true, id: d.id });
                    }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm({ open: true, type: "driver", id: d.id, name: d.name })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredDrivers.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No drivers match your filters.</Card>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs (unchanged) */}
      <Dialog open={approveDialog.open} onOpenChange={(o) => setApproveDialog({ ...approveDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Assign Vehicle</Label>
              <Select value={approveForm.vehicleId} onValueChange={(v) => setApproveForm({ ...approveForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{availableVehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign Driver</Label>
              <Select value={approveForm.driverId} onValueChange={(v) => setApproveForm({ ...approveForm, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{availableDrivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Note (optional)</Label><Input value={approveForm.note} onChange={(e) => setApproveForm({ ...approveForm, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, requestId: "" })}>Cancel</Button>
            <Button onClick={() => approveMutation.mutate()} disabled={!approveForm.vehicleId || !approveForm.driverId || approveMutation.isPending}>
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div><Label>Reason</Label><Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, requestId: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={!rejectNote || rejectMutation.isPending}>
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleDialog.open} onOpenChange={(o) => setVehicleDialog({ ...vehicleDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{vehicleDialog.editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Plate</Label><Input value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} /></div>
            <div><Label>Make</Label><Input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></div>
            <div><Label>Model</Label><Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" min={1} value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={vehicleForm.status} onValueChange={(v) => setVehicleForm({ ...vehicleForm, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialog({ open: false, editing: false })}>Cancel</Button>
            <Button onClick={() => vehicleMutation.mutate()} disabled={vehicleMutation.isPending}>
              {vehicleMutation.isPending ? "Saving..." : vehicleDialog.editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={driverDialog.open} onOpenChange={(o) => setDriverDialog({ ...driverDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{driverDialog.editing ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} /></div>
            <div><Label>License No.</Label><Input value={driverForm.license} onChange={(e) => setDriverForm({ ...driverForm, license: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={driverForm.available ? "available" : "unavailable"} onValueChange={(v) => setDriverForm({ ...driverForm, available: v === "available" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog({ open: false, editing: false })}>Cancel</Button>
            <Button onClick={() => driverMutation.mutate()} disabled={driverMutation.isPending}>
              {driverMutation.isPending ? "Saving..." : driverDialog.editing ? "Save Changes" : "Add Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm.open} onOpenChange={(o) => setDeleteConfirm({ ...deleteConfirm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">{deleteConfirm.name}</span>? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteConfirm.type === "vehicle") deleteVehicleMutation.mutate(deleteConfirm.id);
              else deleteDriverMutation.mutate(deleteConfirm.id);
            }} disabled={deleteVehicleMutation.isPending || deleteDriverMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}