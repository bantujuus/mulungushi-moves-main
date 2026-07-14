import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { dispatchRequests, gateLogs, vehicles, drivers } from "@/db/schema";
import { gte } from "drizzle-orm";
import { subDays, startOfDay, format } from "date-fns";

export const getTripSummary = createServerFn({ method: "GET" }).handler(async () => {
  const allRequests = await db.select().from(dispatchRequests);
  const allLogs = await db.select().from(gateLogs);
  const allVehicles = await db.select().from(vehicles);
  const allDrivers = await db.select().from(drivers);

  const today = startOfDay(new Date());
  const last7 = subDays(today, 7);
  const last30 = subDays(today, 30);

  const todayRequests = allRequests.filter((r) => new Date(r.createdAt) >= today);
  const weekRequests = allRequests.filter((r) => new Date(r.createdAt) >= last7);
  const monthRequests = allRequests.filter((r) => new Date(r.createdAt) >= last30);

  const completed = allRequests.filter((r) => r.status === "completed");
  const pending = allRequests.filter((r) => r.status === "pending");
  const rejected = allRequests.filter((r) => r.status === "rejected");

  // Vehicle most used
  const vehicleUsage = allVehicles.map((v) => ({
    id: v.id, registration: v.registration, make: v.make, model: v.model,
    trips: completed.filter((r) => r.vehicleId === v.id).length,
    status: v.status,
  })).sort((a, b) => b.trips - a.trips);

  // Driver most used
  const driverUsage = allDrivers.map((d) => ({
    id: d.id, name: d.name, license: d.license,
    trips: completed.filter((r) => r.driverId === d.id).length,
    available: d.available,
  })).sort((a, b) => b.trips - a.trips);

  // Daily trips last 14 days
  const dailyTrends = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayRequests = allRequests.filter((r) => new Date(r.createdAt) >= dayStart && new Date(r.createdAt) < dayEnd);
    return {
      date: format(day, "MMM d"),
      total: dayRequests.length,
      completed: dayRequests.filter((r) => r.status === "completed").length,
      pending: dayRequests.filter((r) => r.status === "pending").length,
    };
  });

  // Gate activity today
  const todayLogs = allLogs.filter((l) => new Date(l.loggedAt) >= today);

  // Average passengers
  const avgPassengers = allRequests.length > 0
    ? Math.round(allRequests.reduce((sum, r) => sum + r.passengerCount, 0) / allRequests.length)
    : 0;

  return {
    totals: {
      allTime: allRequests.length,
      today: todayRequests.length,
      thisWeek: weekRequests.length,
      thisMonth: monthRequests.length,
      completed: completed.length,
      pending: pending.length,
      rejected: rejected.length,
      avgPassengers,
    },
    gate: {
      totalExits: allLogs.filter((l) => l.direction === "exit").length,
      totalEntries: allLogs.filter((l) => l.direction === "entry").length,
      todayExits: todayLogs.filter((l) => l.direction === "exit").length,
      todayEntries: todayLogs.filter((l) => l.direction === "entry").length,
    },
    fleet: {
      total: allVehicles.length,
      available: allVehicles.filter((v) => v.status === "available").length,
      inUse: allVehicles.filter((v) => v.status === "in_use").length,
      maintenance: allVehicles.filter((v) => v.status === "maintenance").length,
    },
    drivers: {
      total: allDrivers.length,
      available: allDrivers.filter((d) => d.available).length,
    },
    vehicleUsage,
    driverUsage,
    dailyTrends,
  };
});