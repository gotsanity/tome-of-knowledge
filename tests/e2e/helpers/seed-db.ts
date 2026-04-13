import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Test-DB seeding helper. Creates a throwaway SQLite file for a Playwright
 * spec, runs the vault importer against tests/fixtures/vault/, and returns
 * the path + a cleanup function.
 *
 * Importer lands in step 3; until then this helper provisions the file only.
 */
export function seedTestDb(): { dbPath: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), "tome-e2e-"));
  const dbPath = path.join(dir, "tome.db");
  return {
    dbPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
