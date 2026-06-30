import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { vehicles, drivers, vehicleRequests, gateLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  userId: string; requesterName: string; department: string; purpose: string; destination: string;
  passengers: number; departAt: string; returnAt: string;
}}) => {
  const [request] = await db.insert(vehicleRequests).values({
    id: `r${Date.now()}`,
    userId: data.userId,
    requesterName: data.requesterName, department: data.department, purpose: data.purpose,
    destination: data.destination, passengers: data.passengers,
    departAt: new Date(data.departAt), returnAt: new Date(data.returnAt),
    status: "pending", createdAt: new Date(),
  }).returning();
  return request;
});

export const approveRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; vehicleId: string; driverId: string; note?: string;
}}) => {
  const [request] = await db.update(vehicleRequests).set({
    status: "approved", vehicleId: data.vehicleId, driverId: data.driverId,
    approverNote: data.note, approvedAt: new Date(),
  }).where(eq(vehicleRequests.id, data.id)).returning();
  await db.update(vehicles).set({ status: "in-use" }).where(eq(vehicles.id, data.vehicleId));
  await db.update(drivers).set({ available: false }).where(eq(drivers.id, data.driverId));
  return request;
});

export const rejectRequest = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; note: string;
}}) => {
  const [request] = await db.update(vehicleRequests).set({
    status: "rejected", approverNote: data.note,
  }).where(eq(vehicleRequests.id, data.id)).returning();
  return request;
});

export const logGate = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  vehiclePlate: string; driverName: string; direction: "exit" | "entry";
  officer: string; requestId?: string; odometer?: number; note?: string;
}}) => {
  const [log] = await db.insert(gateLogs).values({
    id: `g${Date.now()}`, vehiclePlate: data.vehiclePlate, driverName: data.driverName,
    direction: data.direction, officer: data.officer, requestId: data.requestId,
    odometer: data.odometer, note: data.note, timestamp: new Date(),
  }).returning();
  if (data.requestId) {
    if (data.direction === "exit") {
      await db.update(vehicleRequests).set({ status: "dispatched" }).where(eq(vehicleRequests.id, data.requestId));
    } else {
      const [request] = await db.select().from(vehicleRequests).where(eq(vehicleRequests.id, data.requestId));
      await db.update(vehicleRequests).set({ status: "returned" }).where(eq(vehicleRequests.id, data.requestId));
      if (request?.vehicleId) await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, request.vehicleId));
      if (request?.driverId) await db.update(drivers).set({ available: true }).where(eq(drivers.id, request.driverId));
    }
  }
  return log;
});

export const addVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  plate: string; make: string; model: string; capacity: number; status: "available" | "in-use" | "maintenance";
}}) => {
  const [vehicle] = await db.insert(vehicles).values({ id: `v${Date.now()}`, ...data }).returning();
  return vehicle;
});

export const updateVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; plate: string; make: string; model: string; capacity: number; status: "available" | "in-use" | "maintenance";
}}) => {
  const [vehicle] = await db.update(vehicles).set({
    plate: data.plate, make: data.make, model: data.model, capacity: data.capacity, status: data.status,
  }).where(eq(vehicles.id, data.id)).returning();
  return vehicle;
});

export const deleteVehicle = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { id: string } }) => {
  await db.delete(vehicles).where(eq(vehicles.id, data.id));
  return { success: true };
});

export const addDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  name: string; license: string; phone: string; available: boolean;
}}) => {
  const [driver] = await db.insert(drivers).values({ id: `d${Date.now()}`, ...data }).returning();
  return driver;
});

export const updateDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: {
  id: string; name: string; license: string; phone: string; available: boolean;
}}) => {
  const [driver] = await db.update(drivers).set({
    name: data.name, license: data.license, phone: data.phone, available: data.available,
  }).where(eq(drivers.id, data.id)).returning();
  return driver;
});

export const deleteDriver = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { id: string } }) => {
  await db.delete(drivers).where(eq(drivers.id, data.id));
  return { success: true };
});