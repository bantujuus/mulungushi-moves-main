import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { users } from "./schema";
import bcrypt from "bcryptjs";

const client = postgres(
  "postgresql://postgres.lnvbulzuigkkngnmjaur:RaCheal%231mylove@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  { prepare: false }
);

const db = drizzle(client, { schema });

async function seedAdmin() {
  console.log("Creating admin account...");

  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  await db.insert(users).values({
    id: "admin-001",
    name: "System Administrator",
    email: "admin@mulungushi.ac.zm",
    passwordHash,
    role: "admin",
    status: "approved",
    createdAt: new Date(),
    approvedAt: new Date(),
  }).onConflictDoNothing();

  console.log("✓ Admin account created");
  console.log("  Email:    admin@mulungushi.ac.zm");
  console.log("  Password: Admin@1234");
  console.log("  Change this password after first login!");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});