import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRequestById } from "@/lib/api/vehicles";
import { format } from "date-fns";
import { ArrowLeft, Car, User, MapPin, Calendar, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/requests/")({
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => getRequestById({ data: { id: requestId } }),
  });

  if (isLoading) return (
    <AppShell title="Request Detail">
      <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>
    </AppShell>
  );

  if (!data) return (
    <AppShell title="Request Detail">
      <Card className="p-8 text-center text-sm text-muted-foreground">Request not found.</Card>
    </AppShell>
  );

  const { request, vehicle, driver, logs } = data;

  return (
    <AppShell title="Request Detail" subtitle={`Trip to ${request.destination}`}>
      <div className="max-w-3xl space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: -1 as any })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
            <StatusBadge status={request.status} />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Submitted</div>
            <div className="text-sm font-medium">{format(new Date(request.createdAt), "PPp")}</div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Trip Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Requester</div>
                <div className="text-sm font-medium">{request.requesterName}</div>
                <div className="text-xs text-muted-foreground">{request.department}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Destination</div>
                <div className="text-sm font-medium">{request.destination}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Departure</div>
                <div className="text-sm font-medium">{format(new Date(request.departAt), "PPp")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Return</div>
                <div className="text-sm font-medium">{format(new Date(request.returnAt), "PPp")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Passengers</div>
                <div className="text-sm font-medium">{request.passengers}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground mb-1">Purpose</div>
            <div className="text-sm">{request.purpose}</div>
          </div>
        </Card>

        {(vehicle || driver) && (
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle && (
                <div className="flex gap-3">
                  <Car className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Vehicle</div>
                    <div className="text-sm font-medium">{vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-muted-foreground">{vehicle.plate} · {vehicle.capacity} seats</div>
                  </div>
                </div>
              )}
              {driver && (
                <div className="flex gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Driver</div>
                    <div className="text-sm font-medium">{driver.name}</div>
                    <div className="text-xs text-muted-foreground">{driver.license} · {driver.phone}</div>
                  </div>
                </div>
              )}
            </div>
            {request.approverNote && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-1">Approver Note</div>
                <div className="text-sm italic">{request.approverNote}</div>
              </div>
            )}
            {request.approvedAt && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">Approved: {format(new Date(request.approvedAt), "PPp")}</div>
              </div>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Gate Activity</h2>
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No gate activity recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 flex-wrap py-2 border-b last:border-0">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.direction === "exit" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                    {log.direction === "exit" ? "EXIT" : "ENTRY"}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{log.vehiclePlate} · {log.driverName}</div>
                    <div className="text-xs text-muted-foreground">
                      Officer: {log.officer} · {format(new Date(log.timestamp), "PPp")}
                      {log.odometer && ` · Odometer: ${log.odometer} km`}
                    </div>
                    {log.note && <div className="text-xs text-muted-foreground italic">{log.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}