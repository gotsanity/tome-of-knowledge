import { describe, it, expect } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";

async function tablesIn(db: ReturnType<typeof drizzle>): Promise<Set<string>> {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table'`,
  );
  return new Set(rows.map((r) => r.name));
}

describe("migrations", () => {
  it("applies cleanly to an in-memory database and creates the vault tables", async () => {
    const client = createClient({ url: ":memory:" });
    const db = drizzle(client);

    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, "../../lib/db/migrations"),
    });

    const tables = await tablesIn(db);

    expect(tables.has("users")).toBe(true);
    expect(tables.has("invites")).toBe(true);

    expect(tables.has("nodes")).toBe(true);
    expect(tables.has("node_sections")).toBe(true);
    expect(tables.has("relationships")).toBe(true);
    expect(tables.has("lexicon_terms")).toBe(true);
    expect(tables.has("themes")).toBe(true);
    expect(tables.has("node_themes")).toBe(true);

    client.close();
  });

  it("has the expected indexes on nodes", async () => {
    const client = createClient({ url: ":memory:" });
    const db = drizzle(client);

    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, "../../lib/db/migrations"),
    });

    const rows = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'nodes'`,
    );
    const indexes = new Set(rows.map((r) => r.name));

    expect(indexes.has("nodes_slug_idx")).toBe(true);
    expect(indexes.has("nodes_type_idx")).toBe(true);
    expect(indexes.has("nodes_visibility_idx")).toBe(true);
    expect(indexes.has("nodes_type_visibility_idx")).toBe(true);

    client.close();
  });
});
