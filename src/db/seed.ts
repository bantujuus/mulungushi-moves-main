import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { vehicles, drivers, dispatchRequests, dispatchRequestVehicles, gateLogs } from "./schema";

const client = postgres(
  "postgresql://postgres.lnvbulzuigkkngnmjaur:RaCheal%231mylove@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  { prepare: false }
);

const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Delete in correct order to respect foreign keys
  await db.delete(gateLogs);
  await db.delete(dispatchRequestVehicles);
  await db.delete(dispatchRequests);
  await db.delete(drivers);
  await db.delete(vehicles);

  // Seed vehicles
  await db.insert(vehicles).values([
    { registration: "MU 001 ZM", make: "Toyota", model: "Hiace", capacity: 14, status: "available" },
    { registration: "MU 002 ZM", make: "Toyota", model: "Land Cruiser", capacity: 7, status: "available" },
    { registration: "MU 003 ZM", make: "Nissan", model: "Hardbody", capacity: 4, status: "available" },
    { registration: "MU 004 ZM", make: "Toyota", model: "Coaster", capacity: 29, status: "maintenance" },
  ]);
  console.log("✓ Vehicles seeded");

  // Seed drivers
  await db.insert(drivers).values([
    { name: "Patrick Mwale", license: "ZM-DL-49281", phone: "+260 977 111 222", available: true },
    { name: "Joyce Banda", license: "ZM-DL-39120", phone: "+260 966 333 444", available: true },
    { name: "Kelvin Phiri", license: "ZM-DL-58213", phone: "+260 955 555 666", available: true },
  ]);
  console.log("✓ Drivers seeded");

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });