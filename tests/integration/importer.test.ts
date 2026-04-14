import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, and } from "drizzle-orm";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { importVault } from "@/lib/vault/importer";
import * as schema from "@/lib/db/schema";

const FIXTURE_VAULT = path.resolve(__dirname, "../fixtures/vault");

async function setupDb(): Promise<{
  db: LibSQLDatabase<typeof schema>;
  client: Client;
  dir: string;
}> {
  const dir = mkdtempSync(path.join(tmpdir(), "tome-importer-"));
  const dbPath = path.join(dir, "tome.db");
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../../lib/db/migrations"),
  });
  return { db, client, dir };
}

describe("importVault", () => {
  let db: LibSQLDatabase<typeof schema>;
  let client: Client;
  let dir: string;

  beforeEach(async () => {
    ({ db, client, dir } = await setupDb());
  });

  afterEach(() => {
    client.close();
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may keep a lock on the file briefly — leave it for OS cleanup
    }
  });

  it("imports every node in the fixture vault", async () => {
    const result = await importVault(db, FIXTURE_VAULT);
    expect(result.errors).toEqual([]);

    const rows = await db.select().from(schema.nodes);
    const slugs = rows.map((r) => r.slug).sort();
    expect(slugs).toEqual([
      "amber-drift-sea",
      "fort-ashby",
      "fort-commander",
      "fort-commander-gm-notes",
      "hidden-revenant",
      "order-of-mending",
      "red-valley",
    ]);
    expect(result.stats.nodesImported).toBe(7);
  });

  it("imports geography nodes (type: geography)", async () => {
    await importVault(db, FIXTURE_VAULT);
    const geo = await db.query.nodes.findFirst({
      where: eq(schema.nodes.slug, "amber-drift-sea"),
    });
    expect(geo).toBeDefined();
    expect(geo?.type).toBe("geography");
  });

  it("warns when a file has frontmatter 'type:' with an unknown value", async () => {
    // Build a throwaway vault with a single rogue-typed file. Copy the base
    // fixture so wikilinks still resolve cleanly, then add one broken node.
    const tmpVault = mkdtempSync(path.join(tmpdir(), "tome-importer-vault-"));
    cpSync(FIXTURE_VAULT, tmpVault, { recursive: true });
    const stowaway = path.join(tmpVault, "geography", "unknown-feature.md");
    mkdirSync(path.dirname(stowaway), { recursive: true });
    writeFileSync(
      stowaway,
      `---\ncws_version: 3.0\ntype: fhtagn\nname: unknown-feature\nvisibility: published\n---\n\n## Overview\n\nSchema drift canary.\n`,
    );

    try {
      const result = await importVault(db, tmpVault);
      const typeWarnings = result.warnings.filter((w) =>
        w.includes("not a known node type"),
      );
      expect(typeWarnings.length).toBe(1);
      expect(typeWarnings[0]).toContain("unknown-feature.md");
      expect(typeWarnings[0]).toContain("fhtagn");

      // The rogue file must not produce a node row.
      const rogue = await db.query.nodes.findFirst({
        where: eq(schema.nodes.slug, "unknown-feature"),
      });
      expect(rogue).toBeUndefined();
    } finally {
      rmSync(tmpVault, { recursive: true, force: true });
    }
  });

  it("silently skips markdown files with no 'type:' frontmatter", async () => {
    const tmpVault = mkdtempSync(path.join(tmpdir(), "tome-importer-vault-"));
    cpSync(FIXTURE_VAULT, tmpVault, { recursive: true });
    writeFileSync(
      path.join(tmpVault, "world-overview.md"),
      `---\ncws_version: 3.0\nname: world-overview\n---\n\n## Pillars\n\nNot a node.\n`,
    );

    try {
      const result = await importVault(db, tmpVault);
      // Must not surface as a type warning — absence of type is benign.
      const typeWarnings = result.warnings.filter((w) =>
        w.includes("not a known node type"),
      );
      expect(typeWarnings).toEqual([]);
    } finally {
      rmSync(tmpVault, { recursive: true, force: true });
    }
  });

  it("splits each node into sections", async () => {
    await importVault(db, FIXTURE_VAULT);
    const sections = await db.select().from(schema.nodeSections);
    expect(sections.length).toBeGreaterThan(0);

    const node = await db.query.nodes.findFirst({
      where: eq(schema.nodes.slug, "fort-commander"),
    });
    const nodeSections = sections
      .filter((s) => s.nodeId === node!.id)
      .sort((a, b) => a.order - b.order);
    const headings = nodeSections.map((s) => s.heading);
    expect(headings).toContain("Overview");
    expect(headings).toContain("Appearance");
    expect(headings).toContain("Relationships");
  });

  it("persists explicit relationships and derives inverses", async () => {
    await importVault(db, FIXTURE_VAULT);

    // Explicit: fort-commander BASED_IN fort-ashby
    const explicit = await db.query.relationships.findFirst({
      where: and(
        eq(schema.relationships.fromSlug, "fort-commander"),
        eq(schema.relationships.toSlug, "fort-ashby"),
        eq(schema.relationships.relType, "BASED_IN"),
      ),
    });
    expect(explicit?.source).toBe("explicit");

    // Inverse: fort-ashby HOUSES fort-commander (already in fixture as explicit)
    const inverse = await db.query.relationships.findFirst({
      where: and(
        eq(schema.relationships.fromSlug, "fort-ashby"),
        eq(schema.relationships.toSlug, "fort-commander"),
        eq(schema.relationships.relType, "HOUSES"),
      ),
    });
    expect(inverse).toBeDefined();

    // Purely derived: red-valley CONTAINS fort-ashby (fort-ashby LOCATED_IN red-valley is explicit)
    const derived = await db.query.relationships.findFirst({
      where: and(
        eq(schema.relationships.fromSlug, "red-valley"),
        eq(schema.relationships.toSlug, "fort-ashby"),
        eq(schema.relationships.relType, "CONTAINS"),
      ),
    });
    expect(derived?.source).toBe("inverse");
  });

  it("links a node to its gm_companion via companion_slug", async () => {
    await importVault(db, FIXTURE_VAULT);
    const parent = await db.query.nodes.findFirst({
      where: eq(schema.nodes.slug, "fort-commander"),
    });
    expect(parent?.companionSlug).toBe("fort-commander-gm-notes");
  });

  it("imports the lexicon", async () => {
    const result = await importVault(db, FIXTURE_VAULT);
    const terms = await db.select().from(schema.lexiconTerms);
    expect(terms.length).toBe(5);
    expect(result.stats.lexiconTermsImported).toBe(5);

    const mantle = terms.find((t) => t.slug === "mantle");
    expect(mantle?.domain).toBe("World");
    expect(JSON.parse(mantle!.aliases)).toEqual(["divine mantle", "office"]);
  });

  it("is idempotent — running twice produces the same row counts", async () => {
    await importVault(db, FIXTURE_VAULT);
    const firstCounts = {
      nodes: (await db.select().from(schema.nodes)).length,
      sections: (await db.select().from(schema.nodeSections)).length,
      rels: (await db.select().from(schema.relationships)).length,
      lex: (await db.select().from(schema.lexiconTerms)).length,
    };

    await importVault(db, FIXTURE_VAULT);
    const secondCounts = {
      nodes: (await db.select().from(schema.nodes)).length,
      sections: (await db.select().from(schema.nodeSections)).length,
      rels: (await db.select().from(schema.relationships)).length,
      lex: (await db.select().from(schema.lexiconTerms)).length,
    };

    expect(secondCounts).toEqual(firstCounts);
  });

  it("warns on orphan wikilinks (references without a matching node)", async () => {
    const result = await importVault(db, FIXTURE_VAULT);
    // fort-commander body contains [[fort-ashby|Fort Ashby]] — not orphan.
    // order-of-mending body has none, fort-commander-gm-notes has none.
    // Currently none of the fixture bodies should generate orphan warnings.
    expect(result.warnings.filter((w) => w.includes("orphan")).length).toBe(0);
  });

  it("returns errors = [] and warnings = [] on the happy path", async () => {
    const result = await importVault(db, FIXTURE_VAULT);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

});
