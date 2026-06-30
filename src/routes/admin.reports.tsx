import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReportData } from "@/lib/api/reports";
import { exportExcel, exportPdf } from "@/lib/api/export";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { format, startOfMonth, startOfWeek } from "date-fns";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
});

function downloadBase64(base64: string, filename: string, mime: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AdminReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", from, to],
    queryFn: () => getReportData({ data: { from: from || undefined, to: to || undefined } }),
  });

  const applyPreset = (preset: "week" | "month" | "all") => {
    if (preset === "week") setFrom(format(startOfWeek(new Date()), "yyyy-MM-dd"));
    else if (preset === "month") setFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    else setFrom("");
    setTo("");
  };

  const handleExcel = async () => {
    setExportingExcel(true);
    try {
      const result = await exportExcel({ data: { from: from || undefined, to: to || undefined } });
      downloadBase64(result.base64, result.filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast.success("Excel report downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel report");
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePdf = async () => {
    setExportingPdf(true);
    try {
      const result = await exportPdf({ data: { from: from || undefined, to: to || undefined } });
      downloadBase64(result.base64, result.filename, "application/pdf");
      toast.success("PDF report downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <AppShell title="Reports" subtitle="Operational summary and exports">
      {/* Filters */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => applyPreset("week")}>This Week</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("month")}>This Month</Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("all")}>All Time</Button>
          <div className="flex-1" />
          <Button onClick={handleExcel} disabled={exportingExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> {exportingExcel ? "Generating..." : "Export Excel"}
          </Button>
          <Button onClick={handlePdf} disabled={exportingPdf} variant="secondary">
            <FileText className="w-4 h-4 mr-2" /> {exportingPdf ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </Card>

      {isLoading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading report...</Card>}

      {data && (
        <div className="space-y-8">
          <div>
            <h2 className="font-semibold text-lg mb-3">Request Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.statusCounts.map(({ label, count }) => (
                <Card key={label} className="p-4 text-center">
                  <div className="text-3xl font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">{label}</div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-3">Vehicle Utilisation</h2>
            <div className="space-y-3">
              {data.vehicleUtil.map(({ plate, make, model, trips }) => (
                <Card key={plate} className="p-4 flex items-center justify-between">
                  <span className="font-medium">{plate} — {make} {model}</span>
                  <span className="text-sm text-muted-foreground">{trips} completed trip{trips !== 1 ? "s" : ""}</span>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-3">Driver Utilisation</h2>
            <div className="space-y-3">
              {data.driverUtil.map(({ name, license, trips }) => (
                <Card key={license} className="p-4 flex items-center justify-between">
                  <span className="font-medium">{name} ({license})</span>
                  <span className="text-sm text-muted-foreground">{trips} completed trip{trips !== 1 ? "s" : ""}</span>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-3">Gate Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-semibold">{data.totalExits}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Exits</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-semibold">{data.totalEntries}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Entries</div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}