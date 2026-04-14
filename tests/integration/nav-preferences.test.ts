import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "@/lib/db/schema";
import {
  getNavPreferences,
  setNavItemExpanded,
  DEFAULT_NAV_PREFERENCES,
} from "@/lib/nav/preferences";

describe("nav preferences", () => {
  let db: LibSQLDatabase<typeof schema>;
  let client: Client;
  let dir: string;
  let userId: string;

  beforeEach(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "tome-nav-prefs-"));
    client = createClient({ url: `file:${path.join(dir, "tome.db")}` });
    db = drizzle(client, { schema });
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, "../../lib/db/migrations"),
    });
    userId = crypto.randomUUID();
    await db.insert(schema.users).values({
      id: userId,
      username: "test-user",
      email: "test@example.com",
    });
  });

  afterEach(() => {
    client.close();
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows file lock
    }
  });

  describe("getNavPreferences", () => {
    it("returns defaults when no row exists", async () => {
      const prefs = await getNavPreferences(db, userId);
      expect(prefs).toEqual(DEFAULT_NAV_PREFERENCES);
      expect(prefs.contentsExpanded).toBe(true);
    });

    it("returns defaults when userId is null", async () => {
      const prefs = await getNavPreferences(db, null);
      expect(prefs).toEqual(DEFAULT_NAV_PREFERENCES);
    });

    it("returns the stored preference after a write", async () => {
      await setNavItemExpanded(db, userId, "contents", false);
      const prefs = await getNavPreferences(db, userId);
      expect(prefs.contentsExpanded).toBe(false);
    });
  });

  describe("setNavItemExpanded", () => {
    it("inserts a row on first write", async () => {
      await setNavItemExpanded(db, userId, "contents", false);
      const rows = await db.select().from(schema.userNavPreferences);
      expect(rows.length).toBe(1);
      expect(rows[0]?.userId).toBe(userId);
      expect(rows[0]?.contentsExpanded).toBe(0);
    });

    it("updates an existing row on subsequent writes", async () => {
      await setNavItemExpanded(db, userId, "contents", false);
      await setNavItemExpanded(db, userId, "contents", true);
      const rows = await db.select().from(schema.userNavPreferences);
      expect(rows.length).toBe(1);
      expect(rows[0]?.contentsExpanded).toBe(1);
    });

    it("is a no-op when userId is null", async () => {
      await setNavItemExpanded(db, null, "contents", false);
      const rows = await db.select().from(schema.userNavPreferences);
      expect(rows.length).toBe(0);
    });

    it("ignores unknown nav keys without throwing", async () => {
      await setNavItemExpanded(
        db,
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "library" as any,
        false,
      );
      const rows = await db.select().from(schema.userNavPreferences);
      expect(rows.length).toBe(0);
    });
  });
});
