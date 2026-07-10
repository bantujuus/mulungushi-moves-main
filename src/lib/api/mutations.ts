import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, dispatchRequests, dispatchRequestVehicles, gateLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  userId: string; requesterName: string; department: string; purpose: string;
  destination: string; passengers: number; departAt: string; returnAt: string;
}}) => {
  const [request] = await db.insert(dispatchRequests).values({
    requesterId: data.userId,
    destination: data.destination,
    purpose: data.purpose,
    passengerCount: data.passengers,
    departureAt: new Date(data.departAt),
    returnAt: new Date(data.returnAt),
    status: "pending",
  }).returning();
  return request;
});

export const approveRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; vehicleId: string; driverId: string; note?: string; adminId: string;
}}) => {
  const [request] = await db.update(dispatchRequests).set({
    status: "approved",
    vehicleId: data.vehicleId || null,
    driverId: data.driverId || null,
    reviewedBy: data.adminId,
    reviewedAt: new Date(),
    notes: data.note,
  }).where(eq(dispatchRequests.id, data.id)).returning();

  if (data.vehicleId) {
    await db.update(vehicles).set({ status: "in_use" }).where(eq(vehicles.id, data.vehicleId));
    await db.insert(dispatchRequestVehicles).values({
      requestId: data.id, vehicleId: data.vehicleId, assignedBy: data.adminId,
    }).onConflictDoNothing();
  }

  if (data.driverId) {
    await db.update(drivers).set({ available: false }).where(eq(drivers.id, data.driverId));
  }

  return request;
});

export const rejectRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; note: string; adminId: string;
}}) => {
  const [request] = await db.update(dispatchRequests).set({
    status: "rejected", notes: data.note, reviewedBy: data.adminId, reviewedAt: new Date(),
  }).where(eq(dispatchRequests.id, data.id)).returning();
  return request;
});

export const logGate = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  vehicleId: string; officerId: string; direction: "exit" | "entry";
  requestId?: string; odometer?: number; note?: string;
}}) => {
  const [log] = await db.insert(gateLogs).values({
    vehicleId: data.vehicleId, officerId: data.officerId, direction: data.direction,
    requestId: data.requestId, odometer: data.odometer, notes: data.note,
  }).returning();

  if (data.requestId && data.direction === "entry") {
    const [request] = await db.select().from(dispatchRequests).where(eq(dispatchRequests.id, data.requestId));
    await db.update(dispatchRequests).set({ status: "completed" }).where(eq(dispatchRequests.id, data.requestId));
    if (request?.vehicleId) await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, request.vehicleId));
    if (request?.driverId) await db.update(drivers).set({ available: true }).where(eq(drivers.id, request.driverId));
  }

  return log;
});

export const addVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  registration: string; make: string; model: string; capacity: number; status: "available" | "in_use" | "maintenance";
}}) => {
  const [vehicle] = await db.insert(vehicles).values(data).returning();
  return vehicle;
});

export const updateVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; registration: string; make: string; model: string; capacity: number; status: "available" | "in_use" | "maintenance";
}}) => {
  const { id, ...rest } = data;
  const [vehicle] = await db.update(vehicles).set(rest).where(eq(vehicles.id, id)).returning();
  return vehicle;
});

export const deleteVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { id: string } }) => {
  await db.delete(vehicles).where(eq(vehicles.id, data.id));
  return { success: true };
});

export const addDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  name: string; license: string; phone: string; available: boolean;
}}) => {
  const [driver] = await db.insert(drivers).values(data).returning();
  return driver;
});

export const updateDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; name: string; license: string; phone: string; available: boolean;
}}) => {
  const { id, ...rest } = data;
  const [driver] = await db.update(drivers).set(rest).where(eq(drivers.id, id)).returning();
  return driver;
});

export const deleteDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { id: string } }) => {
  await db.delete(drivers).where(eq(drivers.id, data.id));
  return { success: true };
});