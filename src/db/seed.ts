import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { vehicles, drivers, vehicleRequests, gateLogs } from "./schema";

const client = postgres(
  "postgresql://postgres.lnvbulzuigkkngnmjaur:RaCheal%231mylove@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  { prepare: false }
);

const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(gateLogs);
  await db.delete(vehicleRequests);
  await db.delete(drivers);
  await db.delete(vehicles);

  // Seed vehicles
  await db.insert(vehicles).values([
    { id: "v1", plate: "MU 001 ZM", make: "Toyota", model: "Hiace", capacity: 14, status: "available" },
    { id: "v2", plate: "MU 002 ZM", make: "Toyota", model: "Land Cruiser", capacity: 7, status: "available" },
    { id: "v3", plate: "MU 003 ZM", make: "Nissan", model: "Hardbody", capacity: 4, status: "in-use" },
    { id: "v4", plate: "MU 004 ZM", make: "Toyota", model: "Coaster", capacity: 29, status: "maintenance" },
  ]);
  console.log("✓ Vehicles seeded");

  // Seed drivers
  await db.insert(drivers).values([
    { id: "d1", name: "Patrick Mwale", license: "ZM-DL-49281", phone: "+260 977 111 222", available: true },
    { id: "d2", name: "Joyce Banda", license: "ZM-DL-39120", phone: "+260 966 333 444", available: true },
    { id: "d3", name: "Kelvin Phiri", license: "ZM-DL-58213", phone: "+260 955 555 666", available: false },
  ]);
  console.log("✓ Drivers seeded");

  // Seed requests
  const now = Date.now();
  const iso = (offsetH: number) => new Date(now + offsetH * 3600_000);

  await db.insert(vehicleRequests).values([
    {
      id: "r1",
      requesterName: "Dr. Chanda Mulenga",
      department: "School of Engineering",
      purpose: "Field trip to ZESCO Kafue Gorge",
      destination: "Kafue Gorge",
      passengers: 12,
      departAt: iso(24),
      returnAt: iso(36),
      status: "pending",
      createdAt: iso(-2),
    },
    {
      id: "r2",
      requesterName: "Mrs. Tembo",
      department: "Registrar Office",
      purpose: "Deliver examination materials",
      destination: "Lusaka HQ",
      passengers: 2,
      departAt: iso(6),
      returnAt: iso(14),
      status: "approved",
      createdAt: iso(-6),
      vehicleId: "v2",
      driverId: "d1",
      approvedAt: iso(-1),
    },
    {
      id: "r3",
      requesterName: "Mr. Sakala",
      department: "Procurement",
      purpose: "Pickup laboratory equipment",
      destination: "Kabwe Industrial",
      passengers: 1,
      departAt: iso(-8),
      returnAt: iso(-2),
      status: "dispatched",
      createdAt: iso(-30),
      vehicleId: "v3",
      driverId: "d3",
      approvedAt: iso(-26),
    },
  ]);
  console.log("✓ Requests seeded");

  // Seed gate logs
  await db.insert(gateLogs).values([
    {
      id: "g1",
      vehiclePlate: "MU 003 ZM",
      driverName: "Kelvin Phiri",
      direction: "exit",
      timestamp: iso(-8),
      officer: "Sgt. Mumba",
      requestId: "r3",
      odometer: 84120,
    },
  ]);
  console.log("✓ Gate logs seeded");

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});