import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge, DirectionBadge, SectionHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getRequestById } from "@/lib/api/vehicles";
import { format } from "date-fns";
import { ArrowLeft, Car, User, MapPin, Calendar, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/requests/")({
  component: RequestDetailPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#0b1830" }}>{value}</div>
    </div>
  );
}

function RequestDetailPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => getRequestById({ data: { id: requestId } }),
  });

  if (isLoading) return (
    <AppShell title="Request Detail">
      <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)", fontSize: 14 }}>Loading...</div>
    </AppShell>
  );

  if (!data) return (
    <AppShell title="Request Detail">
      <div style={{ textAlign: "center", padding: 48, color: "rgba(11,24,48,0.45)", fontSize: 14 }}>Request not found.</div>
    </AppShell>
  );

  const { request, vehicle, driver, logs } = data;

  return (
    <AppShell title="Request Detail" subtitle={`Trip to ${request.destination}`}>
      <div style={{ maxWidth: 720 }}>
        <button onClick={() => navigate({ to: -1 as any })} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(11,24,48,0.15)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#0b1830", cursor: "pointer", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Status banner */}
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>Status</div>
            <StatusBadge status={request.status} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>Submitted</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0b1830" }}>{format(new Date(request.createdAt), "PPp")}</div>
          </div>
        </div>

        {/* Trip info */}
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader>Trip Information</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Requester" value={request.requesterName} />
            <Field label="Department" value={request.department} />
            <Field label="Destination" value={request.destination} />
            <Field label="Passengers" value={String(request.passengers)} />
            <Field label="Departure" value={format(new Date(request.departAt), "PPp")} />
            <Field label="Return" value={format(new Date(request.returnAt), "PPp")} />
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(11,24,48,0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>Purpose</div>
            <div style={{ fontSize: 14, color: "#0b1830", lineHeight: 1.6 }}>{request.purpose}</div>
          </div>
        </div>

        {/* Assignment */}
        {(vehicle || driver) && (
          <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SectionHeader>Assignment</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {vehicle && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(11,24,48,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Car size={16} color="rgba(11,24,48,0.40)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>Vehicle</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1830" }}>{vehicle.make} {vehicle.model}</div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{vehicle.plate} · {vehicle.capacity} seats</div>
                  </div>
                </div>
              )}
              {driver && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(11,24,48,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={16} color="rgba(11,24,48,0.40)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>Driver</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1830" }}>{driver.name}</div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.55)" }}>{driver.license} · {driver.phone}</div>
                  </div>
                </div>
              )}
            </div>
            {request.approverNote && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(11,24,48,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(11,24,48,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4 }}>Approver Note</div>
                <div style={{ fontSize: 14, color: "#0b1830", fontStyle: "italic" }}>{request.approverNote}</div>
              </div>
            )}
            {request.approvedAt && (
              <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", marginTop: 8 }}>Approved: {format(new Date(request.approvedAt), "PPp")}</div>
            )}
          </div>
        )}

        {/* Gate logs */}
        <div style={{ background: "#fff", border: "1px solid rgba(11,24,48,0.08)", borderRadius: 12, padding: 20 }}>
          <SectionHeader>Gate Activity</SectionHeader>
          {logs.length === 0 ? (
            <div style={{ fontSize: 14, color: "rgba(11,24,48,0.35)", padding: "8px 0" }}>No gate activity recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 0", borderBottom: i < logs.length - 1 ? "1px solid rgba(11,24,48,0.06)" : "none" }}>
                  <DirectionBadge direction={log.direction as "exit" | "entry"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1830" }}>{log.vehiclePlate} · {log.driverName}</div>
                    <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)" }}>
                      Officer: {log.officer} · {format(new Date(log.timestamp), "PPp")}
                      {log.odometer && ` · Odometer: ${log.odometer} km`}
                    </div>
                    {log.note && <div style={{ fontSize: 13, color: "rgba(11,24,48,0.45)", fontStyle: "italic" }}>{log.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}