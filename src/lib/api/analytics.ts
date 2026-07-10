import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, dispatchRequests, gateLogs } from "@/db/schema";
import { gte } from "drizzle-orm";
import { format, startOfWeek, subWeeks } from "date-fns";

export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const twelveWeeksAgo = subWeeks(new Date(), 12);
  const allRequests = await db.select().from(dispatchRequests).where(gte(dispatchRequests.createdAt, twelveWeeksAgo));
  const allVehicles = await db.select().from(vehicles);
  const allLogs = await db.select().from(gateLogs);

  // Weekly volume
  const weekBuckets: Record<string, { week: string; total: number; approved: number; rejected: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const key = format(weekStart, "MMM d");
    weekBuckets[key] = { week: key, total: 0, approved: 0, rejected: 0 };
  }
  allRequests.forEach((r) => {
    const key = format(startOfWeek(new Date(r.createdAt)), "MMM d");
    if (weekBuckets[key]) {
      weekBuckets[key].total += 1;
      if (r.status === "approved" || r.status === "completed") weekBuckets[key].approved += 1;
      if (r.status === "rejected") weekBuckets[key].rejected += 1;
    }
  });
  const weeklyVolume = Object.values(weekBuckets);

  // Fleet utilisation
  const totalCompleted = allRequests.filter((r) => r.status === "completed").length;
  const fleetUtilization = allVehicles.map((v) => {
    const trips = allLogs.filter((l) => l.vehicleId === v.id && l.direction === "entry").length;
    return {
      name: v.registration,
      label: `${v.make} ${v.model}`,
      trips,
      utilization: totalCompleted > 0 ? Math.round((trips / totalCompleted) * 100) : 0,
    };
  }).sort((a, b) => b.trips - a.trips);

  // Peak hours
  const hourBuckets: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourBuckets[h] = 0;
  allLogs.filter((l) => l.direction === "exit").forEach((l) => {
    const hour = new Date(l.loggedAt).getHours();
    hourBuckets[hour] += 1;
  });
  const peakHours = Object.entries(hourBuckets).map(([hour, count]) => ({
    hour: `${hour.padStart(2, "0")}:00`, count,
  }));

  return { weeklyVolume, fleetUtilization, peakHours };
});