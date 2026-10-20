import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next.js's .env.local convention on its own.
config({ path: ".env.local" });

// `generate` only diffs this schema against the local migration snapshot —
// it needs no live connection. Only `migrate` actually requires a real
// DATABASE_URL, and will fail with a clear Postgres connection error if
// it's missing, so no need to guard it here too.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder/placeholder",
  },
});
