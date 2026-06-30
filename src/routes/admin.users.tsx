import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAllUsers, approveUser, rejectUser, updateUserRole, getAuditLogs } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Shield, Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: () => getAllUsers() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ["auditLogs"], queryFn: () => getAuditLogs() });

  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; currentRole: string }>({ open: false, userId: "", currentRole: "staff" });
  const [newRole, setNewRole] = useState("staff");

  // ── Filters: Approved users ──
  const [approvedSearch, setApprovedSearch] = useState("");
  const [approvedRole, setApprovedRole] = useState<string>("all");

  // ── Filters: Audit log ──
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState<string>("all");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const approveMutation = useMutation({
    mutationFn: (vars: { userId: string; role: string }) => approveUser({ data: { userId: vars.userId, adminId: adminUser!.id, role: vars.role } }),
    onSuccess: () => { toast.success("User approved"); invalidate(); },
    onError: () => toast.error("Failed to approve user"),
  });
  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectUser({ data: { userId, adminId: adminUser!.id } }),
    onSuccess: () => { toast.success("User rejected"); invalidate(); },
    onError: () => toast.error("Failed to reject user"),
  });
  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: string }) => updateUserRole({ data: { userId: vars.userId, adminId: adminUser!.id, role: vars.role } }),
    onSuccess: () => { toast.success("Role updated"); setRoleDialog({ open: false, userId: "", currentRole: "staff" }); invalidate(); },
    onError: () => toast.error("Failed to update role"),
  });

  const pending = allUsers.filter((u) => u.status === "pending");
  const approved = allUsers.filter((u) => u.status === "approved");
  const rejected = allUsers.filter((u) => u.status === "rejected");

  const filteredApproved = useMemo(() => {
    return approved.filter((u) => {
      if (approvedRole !== "all" && u.role !== approvedRole) return false;
      if (approvedSearch) {
        const q = approvedSearch.toLowerCase();
        if (!`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [approved, approvedRole, approvedSearch]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditAction !== "all" && log.action !== auditAction) return false;
      if (auditSearch) {
        const q = auditSearch.toLowerCase();
        if (!`${log.detail ?? ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, auditAction, auditSearch]);

  const ACTION_LABELS: Record<string, string> = {
    register: "Registered", login: "Logged in", logout: "Logged out",
    approve_account: "Account approved", reject_account: "Account rejected",
    assign_role: "Role assigned", deactivate_account: "Account deactivated", reactivate_account: "Account reactivated",
  };

  return (
    <AppShell title="User Management" subtitle="Approve registrations and manage user roles">
      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending {pending.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-3">
            {pending.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No pending registrations.</Card>}
            {pending.map((u) => (
              <Card key={u.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-medium">{u.name}</h3>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">Registered: {format(new Date(u.createdAt), "PPp")}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select defaultValue="staff" onValueChange={(v) => approveMutation.mutate({ userId: u.id, role: v })}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Approve as..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Approve as Staff</SelectItem>
                        <SelectItem value="transport">Approve as Transport</SelectItem>
                        <SelectItem value="security">Approve as Security</SelectItem>
                        <SelectItem value="admin">Approve as Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => approveMutation.mutate({ userId: u.id, role: "staff" })} disabled={approveMutation.isPending}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(u.id)} disabled={rejectMutation.isPending}><X className="w-4 h-4 mr-1" /> Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Name or email..." value={approvedSearch} onChange={(e) => setApprovedSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={approvedRole} onValueChange={setApprovedRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(approvedSearch || approvedRole !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setApprovedSearch(""); setApprovedRole("all"); }}>Clear filters</Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredApproved.length} of {approved.length} users</div>
          </Card>
          <div className="space-y-3">
            {filteredApproved.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No users match your filters.</Card>}
            {filteredApproved.map((u) => (
              <Card key={u.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{u.name}</h3>
                      <StatusBadge status={u.role} />
                    </div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Approved: {u.approvedAt ? format(new Date(u.approvedAt), "PPp") : "—"}
                      {u.lastLoginAt && ` · Last login: ${format(new Date(u.lastLoginAt), "PPp")}`}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setRoleDialog({ open: true, userId: u.id, currentRole: u.role }); setNewRole(u.role); }}><Shield className="w-4 h-4 mr-1" /> Change Role</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="space-y-3">
            {rejected.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No rejected users.</Card>}
            {rejected.map((u) => (
              <Card key={u.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-medium">{u.name}</h3>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">Registered: {format(new Date(u.createdAt), "PPp")}</div>
                  </div>
                  <Button size="sm" onClick={() => approveMutation.mutate({ userId: u.id, role: "staff" })} disabled={approveMutation.isPending}><Check className="w-4 h-4 mr-1" /> Re-approve</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs flex items-center gap-1"><Search className="w-3 h-3" /> Search</Label>
                <Input placeholder="Search detail text..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Action</Label>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(auditSearch || auditAction !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setAuditSearch(""); setAuditAction("all"); }}>Clear filters</Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">{filteredAudit.length} of {auditLogs.length} entries</div>
          </Card>
          <div className="space-y-2">
            {filteredAudit.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No audit logs match your filters.</Card>}
            {filteredAudit.slice().reverse().map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm"><span className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</span>{log.detail && <span className="text-muted-foreground ml-2">— {log.detail}</span>}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "PPp")}</div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={roleDialog.open} onOpenChange={(o) => setRoleDialog({ ...roleDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change User Role</DialogTitle></DialogHeader>
          <div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="transport">Transport Officer</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: "", currentRole: "staff" })}>Cancel</Button>
            <Button onClick={() => roleMutation.mutate({ userId: roleDialog.userId, role: newRole })} disabled={roleMutation.isPending}>
              {roleMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}