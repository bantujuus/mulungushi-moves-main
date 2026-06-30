import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.lnvbulzuigkkngnmjaur:RaCheal%231mylove@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  },
});