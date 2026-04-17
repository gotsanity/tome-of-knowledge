import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "@/lib/db/schema";
import { importVault } from "@/lib/vault/importer";
import { loadScribeSubject } from "@/lib/vault/scribe";
import type { Viewer } from "@/lib/vault/can-see";

const FIXTURE_VAULT = path.resolve(__dirname, "../fixtures/vault");

const anonymous: Viewer = null;
const regularUser: Viewer = { role: "user" };
const gm: Viewer = { role: "gm" };

describe("loadScribeSubject", () => {
  let db: LibSQLDatabase<typeof schema>;
  let client: Client;
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "tome-scribe-"));
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

  describe("kind=node", () => {
    it("loads a vault-imported published node for a GM with origin=vault", async () => {
      const subject = await loadScribeSubject(db, "node", "fort-ashby", gm);
      expect(subject).not.toBeNull();
      expect(subject?.kind).toBe("node");
      expect(subject?.slug).toBe("fort-ashby");
      expect(subject?.origin).toBe("vault");
      expect(subject?.name).toBeTruthy();
    });

    it("marks a node with empty sourcePath as origin=app", async () => {
      await db.insert(schema.nodes).values({
        slug: "app-authored-example",
        type: "lore",
        name: "App Authored Example",
        visibility: "published",
        frontmatter: "{}",
        bodyMd: "# Hello",
        sourcePath: "",
      });
      const subject = await loadScribeSubject(
        db,
        "node",
        "app-authored-example",
        gm,
      );
      expect(subject?.origin).toBe("app");
    });

    it("returns null for a missing slug", async () => {
      const subject = await loadScribeSubject(db, "node", "does-not-exist", gm);
      expect(subject).toBeNull();
    });

    it("returns null for non-GM viewers (scribe is GM-only)", async () => {
      expect(await loadScribeSubject(db, "node", "fort-ashby", anonymous)).toBeNull();
      expect(await loadScribeSubject(db, "node", "fort-ashby", regularUser)).toBeNull();
    });

    it("returns null for a node the viewer cannot see (draft, non-GM)", async () => {
      // Even non-existent; this guarantees visibility filter runs before NotFound.
      // With GM we see it; without, null.
      expect(await loadScribeSubject(db, "node", "hidden-revenant", gm)).not.toBeNull();
      expect(
        await loadScribeSubject(db, "node", "hidden-revenant", regularUser),
      ).toBeNull();
    });
  });

  describe("kind=page", () => {
    it("loads a page for a GM with origin=app", async () => {
      await db.insert(schema.pages).values({
        slug: "house-rules",
        title: "House Rules",
        bodyMd: "# House rules\nBe kind.",
      });
      const subject = await loadScribeSubject(db, "page", "house-rules", gm);
      expect(subject).not.toBeNull();
      expect(subject?.kind).toBe("page");
      expect(subject?.slug).toBe("house-rules");
      expect(subject?.name).toBe("House Rules");
      expect(subject?.origin).toBe("app");
      expect(subject?.bodyMd).toContain("Be kind");
    });

    it("returns null for a missing page slug", async () => {
      const subject = await loadScribeSubject(db, "page", "no-such-page", gm);
      expect(subject).toBeNull();
    });

    it("returns null for non-GM viewers", async () => {
      await db.insert(schema.pages).values({
        slug: "house-rules",
        title: "House Rules",
        bodyMd: "body",
      });
      expect(
        await loadScribeSubject(db, "page", "house-rules", regularUser),
      ).toBeNull();
      expect(
        await loadScribeSubject(db, "page", "house-rules", anonymous),
      ).toBeNull();
    });
  });
});
