import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, dispatchRequests, gateLogs, dispatchRequestVehicles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getVehicles = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(vehicles);
});

export const getDrivers = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(drivers);
});

export const getRequests = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(dispatchRequests).orderBy(dispatchRequests.createdAt);
});

export const getMyRequests = createServerFn({ method: "GET" }).handler(async ({ data }: { data: { userId: string } }) => {
  return await db.select().from(dispatchRequests)
    .where(eq(dispatchRequests.requesterId, data.userId))
    .orderBy(dispatchRequests.createdAt);
});

export const getGateLogs = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(gateLogs).orderBy(gateLogs.loggedAt);
});

export const getRequestById = createServerFn({ method: "GET" }).handler(async ({ data }: { data: { id: string } }) => {
  const [request] = await db.select().from(dispatchRequests).where(eq(dispatchRequests.id, data.id));
  if (!request) return null;

  const vehicle = request.vehicleId
    ? (await db.select().from(vehicles).where(eq(vehicles.id, request.vehicleId)))[0] ?? null
    : null;

  const driver = request.driverId
    ? (await db.select().from(drivers).where(eq(drivers.id, request.driverId)))[0] ?? null
    : null;

  const logs = await db.select().from(gateLogs).where(eq(gateLogs.requestId, request.id));

  return { request, vehicle, driver, logs };
});