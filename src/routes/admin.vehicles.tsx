import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { getVehicles } from "@/lib/api/vehicles";

export const Route = createFileRoute("/admin/vehicles")({
  component: AdminVehiclesPage,
});

function AdminVehiclesPage() {
  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => getVehicles() });

  return (
    <AppShell title="Vehicles" subtitle="All registered university vehicles">
      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
      <div className="space-y-3">
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
    </AppShell>
  );
}