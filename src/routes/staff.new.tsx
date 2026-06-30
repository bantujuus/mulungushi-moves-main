import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRequest } from "@/lib/api/mutations";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/staff/new")({
  component: NewRequestPage,
});

function NewRequestPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    requesterName: "", department: "", purpose: "", destination: "",
    passengers: 1, departAt: "", returnAt: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => createRequest({ data: form }),
    onSuccess: () => {
      toast.success("Request submitted");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      navigate({ to: "/staff" });
    },
    onError: () => toast.error("Failed to submit request"),
  });

  return (
    <AppShell title="New Vehicle Request" subtitle="Fill in the details below">
      <Card className="max-w-xl p-6 space-y-4">
        <div><Label>Your Name</Label><Input value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} /></div>
        <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
        <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
        <div><Label>Passengers</Label><Input type="number" min={1} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })} /></div>
        <div><Label>Departure</Label><Input type="datetime-local" value={form.departAt} onChange={(e) => setForm({ ...form, departAt: e.target.value })} /></div>
        <div><Label>Return</Label><Input type="datetime-local" value={form.returnAt} onChange={(e) => setForm({ ...form, returnAt: e.target.value })} /></div>
        <Button className="w-full" onClick={() => {
          if (!form.requesterName || !form.department || !form.purpose || !form.destination || !form.departAt || !form.returnAt) {
            toast.error("Please fill in all fields"); return;
          }
          mutate();
        }} disabled={isPending}>{isPending ? "Submitting..." : "Submit Request"}</Button>
      </Card>
    </AppShell>
  );
}