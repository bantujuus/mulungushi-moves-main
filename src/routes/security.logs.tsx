import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { getGateLogs } from "@/lib/api/vehicles";
import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/security/logs")({
  component: SecurityLogsPage,
});

function SecurityLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["gateLogs"],
    queryFn: () => getGateLogs(),
  });

  return (
    <AppShell title="Gate Logs" subtitle="Full history of vehicle movements">
      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading...</Card>}
      <div className="space-y-3">
        {logs.slice().reverse().map((log) => (
          <Card key={log.id} className="p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{log.vehiclePlate}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.direction === "exit" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                {log.direction === "exit" ? "EXIT" : "ENTRY"}
              </span>
              <span className="text-sm text-muted-foreground">{log.driverName} · {log.officer}</span>
              <span className="text-sm text-muted-foreground ml-auto">{format(new Date(log.timestamp), "PPp")}</span>
            </div>
            {log.note && <div className="text-sm text-muted-foreground mt-2 italic">Note: {log.note}</div>}
          </Card>
        ))}
        {!isLoading && logs.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No gate logs yet.</Card>
        )}
      </div>
    </AppShell>
  );
}