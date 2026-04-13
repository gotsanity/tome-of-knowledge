import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "@/lib/db/schema";
import { importVault } from "@/lib/vault/importer";
import {
  getNode,
  listNodesByType,
  getRelated,
  getLexiconTerm,
  listLexiconTerms,
  getCompanion,
} from "@/lib/vault/loaders";
import type { Viewer } from "@/lib/vault/can-see";

const FIXTURE_VAULT = path.resolve(__dirname, "../fixtures/vault");

const anonymous: Viewer = null;
const regularUser: Viewer = { role: "user" };
const gm: Viewer = { role: "gm" };

describe("vault loaders", () => {
  let db: LibSQLDatabase<typeof schema>;
  let client: Client;
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "tome-loaders-"));
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
      // Windows file lock — let OS clean up
    }
  });

  describe("getNode", () => {
    it("returns a published node for everyone", async () => {
      for (const viewer of [anonymous, regularUser, gm]) {
        const node = await getNode(db, "fort-ashby", viewer);
        expect(node?.slug).toBe("fort-ashby");
      }
    });

    it("returns null for a draft node when viewed anonymously or as a user", async () => {
      expect(await getNode(db, "hidden-revenant", anonymous)).toBeNull();
      expect(await getNode(db, "hidden-revenant", regularUser)).toBeNull();
    });

    it("returns a draft node for a GM", async () => {
      const node = await getNode(db, "hidden-revenant", gm);
      expect(node?.slug).toBe("hidden-revenant");
    });

    it("returns null for a gm-only node when viewed anonymously or as a user", async () => {
      expect(
        await getNode(db, "fort-commander-gm-notes", regularUser),
      ).toBeNull();
    });

    it("returns the gm-only node for a GM", async () => {
      const node = await getNode(db, "fort-commander-gm-notes", gm);
      expect(node?.slug).toBe("fort-commander-gm-notes");
    });

    it("returns null for a missing slug without leaking existence", async () => {
      expect(await getNode(db, "does-not-exist", gm)).toBeNull();
    });

    it("returns a node with its sections in order", async () => {
      const node = await getNode(db, "fort-commander", regularUser);
      expect(node?.sections.map((s) => s.heading)).toEqual([
        "Overview",
        "Appearance",
        "Relationships",
      ]);
    });
  });

  describe("listNodesByType", () => {
    it("lists only published npcs for a regular user", async () => {
      const npcs = await listNodesByType(db, "npc", regularUser);
      const slugs = npcs.map((n) => n.slug).sort();
      expect(slugs).toEqual(["fort-commander"]);
    });

    it("lists published + draft + gm-only npcs for a GM", async () => {
      const npcs = await listNodesByType(db, "npc", gm);
      const slugs = npcs.map((n) => n.slug).sort();
      expect(slugs).toEqual([
        "fort-commander",
        "fort-commander-gm-notes",
        "hidden-revenant",
      ]);
    });
  });

  describe("getRelated", () => {
    it("returns both outgoing and inverse edges visible to the viewer", async () => {
      const related = await getRelated(db, "fort-ashby", regularUser);
      const bySlug = related.map((r) => r.slug).sort();
      expect(bySlug).toContain("fort-commander");
      expect(bySlug).toContain("red-valley");
    });

    it("filters out hidden nodes from the result set", async () => {
      const related = await getRelated(db, "order-of-mending", regularUser);
      // hidden-revenant is a draft member — not visible to user
      expect(related.map((r) => r.slug)).not.toContain("hidden-revenant");
    });

    it("returns the draft member to a GM", async () => {
      const related = await getRelated(db, "order-of-mending", gm);
      expect(related.map((r) => r.slug)).toContain("hidden-revenant");
    });
  });

  describe("getLexiconTerm / listLexiconTerms", () => {
    it("loads a lexicon term by slug", async () => {
      const term = await getLexiconTerm(db, "mantle");
      expect(term?.term).toBe("Mantle");
      expect(term?.aliases).toEqual(["divine mantle", "office"]);
    });

    it("returns null for a missing term", async () => {
      expect(await getLexiconTerm(db, "not-a-term")).toBeNull();
    });

    it("lists every term", async () => {
      const all = await listLexiconTerms(db);
      expect(all.length).toBe(5);
    });
  });

  describe("getCompanion", () => {
    it("returns the companion node for a GM", async () => {
      const companion = await getCompanion(db, "fort-commander", gm);
      expect(companion?.slug).toBe("fort-commander-gm-notes");
    });

    it("returns null for a regular user even when a companion exists", async () => {
      const companion = await getCompanion(db, "fort-commander", regularUser);
      expect(companion).toBeNull();
    });

    it("returns null when there is no companion", async () => {
      expect(await getCompanion(db, "red-valley", gm)).toBeNull();
    });
  });
});
