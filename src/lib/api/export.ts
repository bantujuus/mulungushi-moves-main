import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, vehicleRequests, gateLogs } from "@/db/schema";
import { gte, lte, and } from "drizzle-orm";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { format } from "date-fns";

async function fetchReportData(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : new Date(0);
  const toDate = to ? new Date(to) : new Date();
  const requests = await db.select().from(vehicleRequests)
    .where(and(gte(vehicleRequests.createdAt, fromDate), lte(vehicleRequests.createdAt, toDate)));
  const logs = await db.select().from(gateLogs)
    .where(and(gte(gateLogs.timestamp, fromDate), lte(gateLogs.timestamp, toDate)));
  const allVehicles = await db.select().from(vehicles);
  const allDrivers = await db.select().from(drivers);
  return { requests, logs, allVehicles, allDrivers, fromDate, toDate };
}

export const exportExcel = createServerFn({ method: "GET" }).handler(async ({ data }: {
  data: { from?: string; to?: string }
}) => {
  const { requests, logs, allVehicles, allDrivers, fromDate, toDate } = await fetchReportData(data.from, data.to);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Mulungushi Moves";
  wb.created = new Date();

  // Requests sheet
  const reqSheet = wb.addWorksheet("Requests");
  reqSheet.columns = [
    { header: "ID", key: "id", width: 14 },
    { header: "Requester", key: "requesterName", width: 22 },
    { header: "Department", key: "department", width: 20 },
    { header: "Purpose", key: "purpose", width: 30 },
    { header: "Destination", key: "destination", width: 20 },
    { header: "Passengers", key: "passengers", width: 12 },
    { header: "Depart", key: "departAt", width: 20 },
    { header: "Return", key: "returnAt", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Created", key: "createdAt", width: 20 },
  ];
  reqSheet.getRow(1).font = { bold: true };
  requests.forEach((r) => reqSheet.addRow({
    ...r,
    departAt: format(new Date(r.departAt), "PP p"),
    returnAt: format(new Date(r.returnAt), "PP p"),
    createdAt: format(new Date(r.createdAt), "PP p"),
  }));

  // Gate logs sheet
  const logSheet = wb.addWorksheet("Gate Logs");
  logSheet.columns = [
    { header: "Plate", key: "vehiclePlate", width: 16 },
    { header: "Driver", key: "driverName", width: 20 },
    { header: "Direction", key: "direction", width: 12 },
    { header: "Officer", key: "officer", width: 20 },
    { header: "Timestamp", key: "timestamp", width: 20 },
    { header: "Odometer", key: "odometer", width: 12 },
    { header: "Note", key: "note", width: 25 },
  ];
  logSheet.getRow(1).font = { bold: true };
  logs.forEach((l) => logSheet.addRow({ ...l, timestamp: format(new Date(l.timestamp), "PP p") }));

  // Fleet sheet
  const fleetSheet = wb.addWorksheet("Fleet");
  fleetSheet.columns = [
    { header: "Plate", key: "plate", width: 16 },
    { header: "Make", key: "make", width: 16 },
    { header: "Model", key: "model", width: 16 },
    { header: "Capacity", key: "capacity", width: 12 },
    { header: "Status", key: "status", width: 14 },
  ];
  fleetSheet.getRow(1).font = { bold: true };
  allVehicles.forEach((v) => fleetSheet.addRow(v));

  // Drivers sheet
  const driverSheet = wb.addWorksheet("Drivers");
  driverSheet.columns = [
    { header: "Name", key: "name", width: 22 },
    { header: "License", key: "license", width: 18 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Available", key: "available", width: 12 },
  ];
  driverSheet.getRow(1).font = { bold: true };
  allDrivers.forEach((d) => driverSheet.addRow(d));

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, filename: `mulungushi-moves-report-${format(new Date(), "yyyy-MM-dd")}.xlsx` };
});

export const exportPdf = createServerFn({ method: "GET" }).handler(async ({ data }: {
  data: { from?: string; to?: string }
}) => {
  const { requests, logs, allVehicles, fromDate, toDate } = await fetchReportData(data.from, data.to);

  const statusCounts = ["pending", "approved", "rejected", "dispatched", "returned"].map((s) => ({
    label: s, count: requests.filter((r) => r.status === s).length,
  }));

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const donePromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text("Mulungushi University", { align: "center" });
  doc.fontSize(12).font("Helvetica").text("Fleet & Gate Management — Operational Report", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#666").text(
    `Period: ${format(fromDate, "PP")} – ${format(toDate, "PP")}  ·  Generated: ${format(new Date(), "PPp")}`,
    { align: "center" }
  );
  doc.fillColor("#000").moveDown(1.5);

  // Summary
  doc.fontSize(13).font("Helvetica-Bold").text("Request Summary");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  statusCounts.forEach((s) => {
    doc.text(`${s.label.charAt(0).toUpperCase() + s.label.slice(1)}: ${s.count}`);
  });
  doc.moveDown(1);

  doc.fontSize(13).font("Helvetica-Bold").text("Gate Activity");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Total Exits: ${logs.filter((l) => l.direction === "exit").length}`);
  doc.text(`Total Entries: ${logs.filter((l) => l.direction === "entry").length}`);
  doc.moveDown(1);

  // Vehicle utilisation
  doc.fontSize(13).font("Helvetica-Bold").text("Vehicle Utilisation");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  allVehicles.forEach((v) => {
    const trips = requests.filter((r) => r.vehicleId === v.id && r.status === "returned").length;
    doc.text(`${v.plate} — ${v.make} ${v.model}: ${trips} completed trip${trips !== 1 ? "s" : ""}`);
  });
  doc.moveDown(1);

  // Requests table (simple list, capped to avoid huge PDFs)
  doc.fontSize(13).font("Helvetica-Bold").text("Request Log");
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica");
  requests.slice(0, 100).forEach((r) => {
    doc.text(
      `${format(new Date(r.createdAt), "PP")} · ${r.requesterName} (${r.department}) → ${r.destination} · ${r.status.toUpperCase()}`
    );
  });
  if (requests.length > 100) {
    doc.moveDown(0.5).fontSize(8).fillColor("#888").text(`...and ${requests.length - 100} more requests (see Excel export for full data)`);
  }

  doc.end();
  const buffer = await donePromise;
  const base64 = buffer.toString("base64");
  return { base64, filename: `mulungushi-moves-report-${format(new Date(), "yyyy-MM-dd")}.pdf` };
});