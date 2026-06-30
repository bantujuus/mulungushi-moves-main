import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { getDrivers } from "@/lib/api/vehicles";

export const Route = createFileRoute("/admin/drivers")({
  component: AdminDriversPage,
});

function AdminDriversPage() {
  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers() });

  return (
    <AppShell title="Drivers" subtitle="All registered university drivers">
      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
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