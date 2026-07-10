import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, dispatchRequests, gateLogs } from "@/db/schema";
import { gte, lte, and } from "drizzle-orm";

export const getReportData = createServerFn({ method: "GET" }).handler(async ({ data }: {
  data: { from?: string; to?: string }
}) => {
  const fromDate = data.from ? new Date(data.from) : new Date(0);
  const toDate = data.to ? new Date(data.to) : new Date();

  const requests = await db.select().from(dispatchRequests)
    .where(and(gte(dispatchRequests.createdAt, fromDate), lte(dispatchRequests.createdAt, toDate)));

  const logs = await db.select().from(gateLogs)
    .where(and(gte(gateLogs.loggedAt, fromDate), lte(gateLogs.loggedAt, toDate)));

  const allVehicles = await db.select().from(vehicles);

  const statusCounts = ["pending", "approved", "rejected", "completed"].map((s) => ({
    label: s, count: requests.filter((r) => r.status === s).length,
  }));

  const vehicleUtil = allVehicles.map((v) => ({
    plate: v.registration, make: v.make, model: v.model,
    trips: logs.filter((l) => l.vehicleId === v.id && l.direction === "entry").length,
  }));

  const driverUtil: any[] = [];

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    requests, logs, statusCounts, vehicleUtil, driverUtil,
    totalExits: logs.filter((l) => l.direction === "exit").length,
    totalEntries: logs.filter((l) => l.direction === "entry").length,
  };
});