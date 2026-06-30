import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { getVehicles, getDrivers } from "@/lib/api/vehicles";

export const Route = createFileRoute("/transport/fleet")({
  component: FleetPage,
});

function FleetPage() {
  const { data: vehicles = [], isLoading: loadingV } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });
  const { data: drivers = [], isLoading: loadingD } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers() });

  return (
    <AppShell title="Fleet Status" subtitle="Current status of all vehicles and drivers">
      <h2 className="font-semibold text-lg mb-3">Vehicles</h2>
      {loadingV && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
      <div className="space-y-3 mb-8">
        {vehicles.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{v.make} {v.model}</h3>
                  <StatusBadge status={v.status} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{v.plate} · {v.capacity} seats</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="font-semibold text-lg mb-3">Drivers</h2>
      {loadingD && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
      <div className="space-y-3">
        {drivers.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{d.name}</h3>
                  <StatusBadge status={d.available ? "available" : "in-use"} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{d.license} · {d.phone}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}