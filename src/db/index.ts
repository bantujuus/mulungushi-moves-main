import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(
  "postgresql://postgres.lnvbulzuigkkngnmjaur:RaCheal%231mylove@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  { prepare: false }
);

export const db = drizzle(client, { schema });