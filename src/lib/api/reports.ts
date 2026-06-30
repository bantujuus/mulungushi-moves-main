import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, vehicleRequests, gateLogs } from "@/db/schema";
import { gte, lte, and } from "drizzle-orm";

export const getReportData = createServerFn({ method: "GET" }).handler(async ({ data }: {
  data: { from?: string; to?: string }
}) => {
  const fromDate = data.from ? new Date(data.from) : new Date(0);
  const toDate = data.to ? new Date(data.to) : new Date();

  const requests = await db.select().from(vehicleRequests)
    .where(and(gte(vehicleRequests.createdAt, fromDate), lte(vehicleRequests.createdAt, toDate)));

  const logs = await db.select().from(gateLogs)
    .where(and(gte(gateLogs.timestamp, fromDate), lte(gateLogs.timestamp, toDate)));

  const allVehicles = await db.select().from(vehicles);
  const allDrivers = await db.select().from(drivers);

  const statusCounts = ["pending", "approved", "rejected", "dispatched", "returned"].map((s) => ({
    label: s, count: requests.filter((r) => r.status === s).length,
  }));

  const vehicleUtil = allVehicles.map((v) => ({
    plate: v.plate, make: v.make, model: v.model,
    trips: requests.filter((r) => r.vehicleId === v.id && r.status === "returned").length,
  }));

  const driverUtil = allDrivers.map((d) => ({
    name: d.name, license: d.license,
    trips: requests.filter((r) => r.driverId === d.id && r.status === "returned").length,
  }));

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    requests, logs, statusCounts, vehicleUtil, driverUtil,
    totalExits: logs.filter((l) => l.direction === "exit").length,
    totalEntries: logs.filter((l) => l.direction === "entry").length,
  };
});