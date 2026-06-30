import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, vehicleRequests, gateLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getVehicles = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(vehicles);
});

export const getDrivers = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(drivers);
});

// All requests — used by transport/admin only
export const getRequests = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(vehicleRequests).orderBy(vehicleRequests.createdAt);
});

// Requests scoped to a single user — used by staff
export const getMyRequests = createServerFn({ method: "GET" }).handler(async ({ data }: { data: { userId: string } }) => {
  return await db.select().from(vehicleRequests).where(eq(vehicleRequests.userId, data.userId)).orderBy(vehicleRequests.createdAt);
});

export const getGateLogs = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(gateLogs).orderBy(gateLogs.timestamp);
});

export const getRequestById = createServerFn({ method: "GET" }).handler(async ({ data }: { data: { id: string } }) => {
  const [request] = await db.select().from(vehicleRequests).where(eq(vehicleRequests.id, data.id));
  if (!request) return null;
  const vehicle = request.vehicleId ? (await db.select().from(vehicles).where(eq(vehicles.id, request.vehicleId)))[0] ?? null : null;
  const driver = request.driverId ? (await db.select().from(drivers).where(eq(drivers.id, request.driverId)))[0] ?? null : null;
  const logs = await db.select().from(gateLogs).where(eq(gateLogs.requestId, request.id));
  return { request, vehicle, driver, logs };
});