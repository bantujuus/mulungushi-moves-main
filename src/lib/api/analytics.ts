import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, vehicleRequests, gateLogs } from "@/db/schema";
import { gte } from "drizzle-orm";
import { format, startOfWeek, subWeeks, startOfDay } from "date-fns";

export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const twelveWeeksAgo = subWeeks(new Date(), 12);
  const allRequests = await db.select().from(vehicleRequests).where(gte(vehicleRequests.createdAt, twelveWeeksAgo));
  const allVehicles = await db.select().from(vehicles);
  const allLogs = await db.select().from(gateLogs);

  // ── Weekly request volume (last 12 weeks) ──
  const weekBuckets: Record<string, { week: string; total: number; approved: number; rejected: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const key = format(weekStart, "MMM d");
    weekBuckets[key] = { week: key, total: 0, approved: 0, rejected: 0 };
  }
  allRequests.forEach((r) => {
    const weekStart = startOfWeek(new Date(r.createdAt));
    const key = format(weekStart, "MMM d");
    if (weekBuckets[key]) {
      weekBuckets[key].total += 1;
      if (r.status === "approved" || r.status === "dispatched" || r.status === "returned") weekBuckets[key].approved += 1;
      if (r.status === "rejected") weekBuckets[key].rejected += 1;
    }
  });
  const weeklyVolume = Object.values(weekBuckets);

  // ── Fleet utilisation rate (% of requests using each vehicle) ──
  const totalCompletedTrips = allRequests.filter((r) => r.status === "returned").length;
  const fleetUtilization = allVehicles.map((v) => {
    const trips = allRequests.filter((r) => r.vehicleId === v.id && r.status === "returned").length;
    return {
      name: `${v.plate}`,
      label: `${v.make} ${v.model}`,
      trips,
      utilization: totalCompletedTrips > 0 ? Math.round((trips / totalCompletedTrips) * 100) : 0,
    };
  }).sort((a, b) => b.trips - a.trips);

  // ── Peak dispatch hours (based on exit gate logs) ──
  const hourBuckets: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourBuckets[h] = 0;
  allLogs.filter((l) => l.direction === "exit").forEach((l) => {
    const hour = new Date(l.timestamp).getHours();
    hourBuckets[hour] += 1;
  });
  const peakHours = Object.entries(hourBuckets).map(([hour, count]) => ({
    hour: `${hour.padStart(2, "0")}:00`,
    count,
  }));

  return { weeklyVolume, fleetUtilization, peakHours };
});