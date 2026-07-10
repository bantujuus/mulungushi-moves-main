import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge, SectionHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRequests, getVehicles, getDrivers } from "@/lib/api/vehicles";
import { approveRequest, rejectRequest, addVehicle, updateVehicle, deleteVehicle, addDriver, updateDriver, deleteDriver } from "@/lib/api/mutations";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Check, X, ChevronRight, Pencil, Trash2, Search, Car, Users } from "lucide-react";

export const Route = createFileRoute("/transport")({
  component: TransportPage,
});

const EMPTY_VEHICLE = { registration: "", make: "", model: "", capacity: 4, status: "available" as const };
const EMPTY_DRIVER = { name: "", license: "", phone: "", available: true };

const TAB_STYLE = (active: boolean) => ({
  padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: active ? 600 : 500,
  background: active ? "#fff" : "transparent", color: active ? "#0b1830" : "rgba(11,24,48,0.55)",
  border: "none", cursor: "pointer", boxShadow: active ? "0 1px 3px rgba(11,24,48,0.10)" : "none",
  transition: "all 150ms ease",
});

function TransportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"requests" | "vehicles" | "drivers">("requests");

  const { data: requests = [], isLoading: loadingRequests } = useQuery({ queryKey: ["requests"], queryFn: () => getRequests(), refetchInterval: 5000 });
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers() });

  // Filters
  const [reqSearch, setReqSearch] = useState(""); const [reqStatus, setReqStatus] = useState("all");
  const [vehicleSearch, setVehicleSearch] = useState(""); const [vehicleStatus, setVehicleStatus] = useState("all");
  const [driverSearch, setDriverSearch] = useState(""); const [driverStatus, setDriverStatus] = useState("all");

  const filteredRequests = useMemo(() => (requests as any[]).filter((r) => {
    if (reqStatus !== "all" && r.status !== reqStatus) return false;
    if (reqSearch && !`${r.purpose} ${r.destination}`.toLowerCase().includes(reqSearch.toLowerCase())) return false;
    return true;
  }), [requests, reqStatus, reqSearch]);

  const filteredVehicles = useMemo(() => (vehicles as any[]).filter((v) => {
    if (vehicleStatus !== "all" && v.status !== vehicleStatus) return false;
    if (vehicleSearch && !`${v.registration} ${v.make} ${v.model}`.toLowerCase().includes(vehicleSearch.toLowerCase())) return false;
    return true;
  }), [vehicles, vehicleStatus, vehicleSearch]);

  const filteredDrivers = useMemo(() => (drivers as any[]).filter((d) => {
    if (driverStatus === "available" && !d.available) return false;
    if (driverStatus === "unavailable" && d.available) return false;
    if (driverSearch && !`${d.name} ${d.license} ${d.phone}`.toLowerCase().includes(driverSearch.toLowerCase())) return false;
    return true;
  }), [drivers, driverStatus, driverSearch]);

  // Dialogs
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
    mutationFn: () => approveRequest({ data: { id: approveDialog.requestId, vehicleId: approveForm.vehicleId, driverId: approveForm.driverId, note: approveForm.note, adminId: user!.id } }),
    onSuccess: () => { toast.success("Request approved"); setApproveDialog({ open: false, requestId: "" }); invalidate(); },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRequest({ data: { id: rejectDialog.requestId, note: rejectNote, adminId: user!.id } }),
    onSuccess: () => { toast.success("Request rejected"); setRejectDialog({ open: false, requestId: "" }); invalidate(); },
    onError: () => toast.error("Failed to reject"),
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
    onError: () => toast.error("Failed to delete"),
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
    onError: () => toast.error("Failed to delete"),
  });

  const pendingCount = (requests as any[]).filter((r) => r.status === "pending").length;
  const availableVehicles = (vehicles as any[]).filter((v) => v.status === "available");
  const availableDrivers = (drivers as any[]).filter((d) => d.available);

  return (
    <AppShell title="Transport Office" subtitle="Manage vehicle requests, fleet and drivers">
      <div style={{ background: "rgba(11,24,48,0.04)", borderRadius: 8, padding: 4, display: "inline-flex", gap: 2, marginBottom: 24 }}>
        <button style={TAB_STYLE(tab === "requests")} onClick={() => setTab("requests")}>
          Requests {pendingCount > 0 && <span style={{ background: "#d4a843", color: "#0b1830", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", marginLeft: 6 }}>{pendingCount}</span>}
        </button>
        <button style={TAB_STYLE(tab === "vehicles")} onClick={() => setTab("vehicles")}>Fleet</button>
        <button style={TAB_STYLE(tab === "drivers")} onClick={() => setTab("drivers")}>Drivers</button>
      </div>

      {/* ── REQUESTS ── */}
      {tab === "requests" && (
        <>
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Search size={13} /> Search</div>
                <Input placeholder="Purpose, destination..." value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Status</div>
                <Select value={reqStatus} onValueChange={setReqStatus}>
                  <SelectTrigger style={{ width: 140 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(reqSearch || reqStatus !== "all") && (
                <button onClick={() => { setReqSearch(""); setReqStatus("all"); }} style={{ background: "none", border: "none", color: "rgba(11,24,48,0.45)", fontSize: 13, cursor: "pointer" }}>Clear</button>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 10 }}>{filteredRequests.length} of {requests.length} requests</div>
          </div>

          {loadingRequests && <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)" }}>Loading...</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredRequests.slice().reverse().map((r: any) => (
              <div key={r.id} onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}
                style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, cursor: "pointer", transition: "border-color 150ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,67,0.40)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(11,24,48,0.08)")}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{r.purpose}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(11,24,48,0.55)" }}>{r.destination} · {r.passengerCount} passengers</div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", marginTop: 2 }}>Depart: {r.departureAt ? format(new Date(r.departureAt), "PPp") : "—"}</div>
                    {r.notes && <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", fontStyle: "italic" }}>Note: {r.notes}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => { setApproveDialog({ open: true, requestId: r.id }); setApproveForm({ vehicleId: "", driverId: "", note: "" }); }}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => { setRejectDialog({ open: true, requestId: r.id }); setRejectNote(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    <ChevronRight size={16} color="rgba(11,24,48,0.30)" />
                  </div>
                </div>
              </div>
            ))}
            {!loadingRequests && filteredRequests.length === 0 && (
              <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 48, textAlign: "center", color: "rgba(11,24,48,0.35)", fontSize: 14 }}>No requests match your filters.</div>
            )}
          </div>
        </>
      )}

      {/* ── FLEET ── */}
      {tab === "vehicles" && (
        <>
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Search size={13} /> Search</div>
                <Input placeholder="Registration, make, model..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Status</div>
                <Select value={vehicleStatus} onValueChange={setVehicleStatus}>
                  <SelectTrigger style={{ width: 160 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={() => { setVehicleForm(EMPTY_VEHICLE); setVehicleDialog({ open: true, editing: false }); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                <Plus size={16} /> Add Vehicle
              </button>
            </div>
            <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 10 }}>{filteredVehicles.length} of {vehicles.length} vehicles</div>
          </div>

          {loadingVehicles && <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)" }}>Loading...</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredVehicles.map((v: any) => (
              <div key={v.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(11,24,48,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Car size={18} color="rgba(11,24,48,0.40)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{v.make} {v.model}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{v.registration} · {v.capacity} seats</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setVehicleForm({ registration: v.registration, make: v.make, model: v.model, capacity: v.capacity, status: v.status }); setVehicleDialog({ open: true, editing: true, id: v.id }); }}
                    style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(11,24,48,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0b1830", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm({ open: true, type: "vehicle", id: v.id, name: `${v.make} ${v.model} (${v.registration})` })}
                    style={{ padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── DRIVERS ── */}
      {tab === "drivers" && (
        <>
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Search size={13} /> Search</div>
                <Input placeholder="Name, license, phone..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0b1830", marginBottom: 6 }}>Status</div>
                <Select value={driverStatus} onValueChange={setDriverStatus}>
                  <SelectTrigger style={{ width: 160 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={() => { setDriverForm(EMPTY_DRIVER); setDriverDialog({ open: true, editing: false }); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                <Plus size={16} /> Add Driver
              </button>
            </div>
            <div style={{ fontSize: 12, color: "rgba(11,24,48,0.45)", marginTop: 10 }}>{filteredDrivers.length} of {drivers.length} drivers</div>
          </div>

          {loadingDrivers && <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)" }}>Loading...</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredDrivers.map((d: any) => (
              <div key={d.id} style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(11,24,48,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={18} color="rgba(11,24,48,0.40)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#0b1830" }}>{d.name}</span>
                      <StatusBadge status={d.available ? "available" : "in-use"} />
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{d.license} · {d.phone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setDriverForm({ name: d.name, license: d.license, phone: d.phone, available: d.available }); setDriverDialog({ open: true, editing: true, id: d.id }); }}
                    style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(11,24,48,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0b1830", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm({ open: true, type: "driver", id: d.id, name: d.name })}
                    style={{ padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {!loadingDrivers && filteredDrivers.length === 0 && (
              <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 48, textAlign: "center", color: "rgba(11,24,48,0.35)", fontSize: 14 }}>No drivers match your filters.</div>
            )}
          </div>
        </>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(o) => setApproveDialog({ ...approveDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Request</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>Assign Vehicle</Label>
              <Select value={approveForm.vehicleId} onValueChange={(v) => setApproveForm({ ...approveForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{availableVehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign Driver</Label>
              <Select value={approveForm.driverId} onValueChange={(v) => setApproveForm({ ...approveForm, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{availableDrivers.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.license}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Note (optional)</Label><Input value={approveForm.note} onChange={(e) => setApproveForm({ ...approveForm, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, requestId: "" })}>Cancel</Button>
            <button onClick={() => approveMutation.mutate()} disabled={!approveForm.vehicleId || !approveForm.driverId || approveMutation.isPending}
              style={{ padding: "10px 16px", background: !approveForm.vehicleId || !approveForm.driverId ? "rgba(11,24,48,0.35)" : "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: !approveForm.vehicleId || !approveForm.driverId ? "not-allowed" : "pointer" }}>
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div><Label>Reason</Label><Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, requestId: "" })}>Cancel</Button>
            <button onClick={() => rejectMutation.mutate()} disabled={!rejectNote || rejectMutation.isPending}
              style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: !rejectNote ? "not-allowed" : "pointer" }}>
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialog.open} onOpenChange={(o) => setVehicleDialog({ ...vehicleDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{vehicleDialog.editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><Label>Registration</Label><Input value={vehicleForm.registration} onChange={(e) => setVehicleForm({ ...vehicleForm, registration: e.target.value })} placeholder="e.g. MU 001 ZM" /></div>
            <div><Label>Make</Label><Input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} /></div>
            <div><Label>Model</Label><Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" min={1} value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={vehicleForm.status} onValueChange={(v) => setVehicleForm({ ...vehicleForm, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialog({ open: false, editing: false })}>Cancel</Button>
            <button onClick={() => vehicleMutation.mutate()} disabled={vehicleMutation.isPending}
              style={{ padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {vehicleMutation.isPending ? "Saving..." : vehicleDialog.editing ? "Save Changes" : "Add Vehicle"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Dialog */}
      <Dialog open={driverDialog.open} onOpenChange={(o) => setDriverDialog({ ...driverDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{driverDialog.editing ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><Label>Full Name</Label><Input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} /></div>
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
            <button onClick={() => driverMutation.mutate()} disabled={driverMutation.isPending}
              style={{ padding: "10px 16px", background: "#0b1830", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {driverMutation.isPending ? "Saving..." : driverDialog.editing ? "Save Changes" : "Add Driver"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm.open} onOpenChange={(o) => setDeleteConfirm({ ...deleteConfirm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p style={{ fontSize: 14, color: "rgba(11,24,48,0.55)", margin: 0 }}>Are you sure you want to delete <strong style={{ color: "#0b1830" }}>{deleteConfirm.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
            <button onClick={() => { if (deleteConfirm.type === "vehicle") deleteVehicleMutation.mutate(deleteConfirm.id); else deleteDriverMutation.mutate(deleteConfirm.id); }}
              disabled={deleteVehicleMutation.isPending || deleteDriverMutation.isPending}
              style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}