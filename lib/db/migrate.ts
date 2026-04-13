import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export async function runMigrations() {
  const url = process.env.DATABASE_URL ?? "file:./data/tome.db";
  const client = createClient({ url });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  client.close();
}
