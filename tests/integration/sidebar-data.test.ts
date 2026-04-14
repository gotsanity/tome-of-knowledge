import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "@/lib/db/schema";
import { importVault } from "@/lib/vault/importer";
import { loadSidebarSections } from "@/lib/nav/sidebar-data";
import type { Viewer } from "@/lib/vault/can-see";

const FIXTURE_VAULT = path.resolve(__dirname, "../fixtures/vault");

const anonymous: Viewer = null;
const regularUser: Viewer = { role: "user" };
const gm: Viewer = { role: "gm" };

describe("loadSidebarSections", () => {
  let db: LibSQLDatabase<typeof schema>;
  let client: Client;
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "tome-sidebar-"));
    client = createClient({ url: `file:${path.join(dir, "tome.db")}` });
    db = drizzle(client, { schema });
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, "../../lib/db/migrations"),
    });
    const result = await importVault(db, FIXTURE_VAULT);
    if (result.errors.length > 0) {
      throw new Error(`fixture import failed: ${result.errors.join(", ")}`);
    }
  });

  afterEach(() => {
    client.close();
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows file lock
    }
  });

  it("returns only populated categories with label and count", async () => {
    const sections = await loadSidebarSections(db, regularUser);
    const byType = Object.fromEntries(
      sections.map((s) => [s.type, { label: s.label, count: s.count }]),
    );
    expect(byType).toEqual({
      faction: { label: "Factions", count: 1 },
      geography: { label: "Geography", count: 1 },
      location: { label: "Places", count: 2 },
      npc: { label: "Figures", count: 1 },
    });
  });

  it("hides drafts and gm-only from anonymous viewers", async () => {
    const sections = await loadSidebarSections(db, anonymous);
    const npc = sections.find((s) => s.type === "npc");
    expect(npc?.count).toBe(1);
    expect(npc?.nodes.map((n) => n.slug)).toEqual(["fort-commander"]);
  });

  it("includes drafts for a GM but excludes gm-notes companions", async () => {
    const sections = await loadSidebarSections(db, gm);
    const npc = sections.find((s) => s.type === "npc");
    expect(npc?.count).toBe(2);
    expect(npc?.nodes.map((n) => n.slug).sort()).toEqual([
      "fort-commander",
      "hidden-revenant",
    ]);
  });

  it("sorts nodes alphabetically by display name within each section", async () => {
    const sections = await loadSidebarSections(db, gm);
    const location = sections.find((s) => s.type === "location");
    const names = location?.nodes.map((n) => n.displayName) ?? [];
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("orders sections using NODE_TYPES order, matching the contents page", async () => {
    const sections = await loadSidebarSections(db, regularUser);
    const order = sections.map((s) => s.type);
    expect(order).toEqual(["npc", "location", "geography", "faction"]);
  });

  it("returns an empty array when the vault has no visible nodes", async () => {
    await db.delete(schema.nodes);
    const sections = await loadSidebarSections(db, regularUser);
    expect(sections).toEqual([]);
  });
});
