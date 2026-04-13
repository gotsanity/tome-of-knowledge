#!/usr/bin/env node
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { importVault } from "@/lib/vault/importer";
import * as schema from "@/lib/db/schema";

function parseArgs(argv: string[]): {
  vaultPath: string | null;
  warningBudget: number | null;
} {
  let vaultPath: string | null = null;
  let warningBudget: number | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--path" || arg === "-p") {
      vaultPath = argv[++i] ?? null;
    } else if (arg === "--warning-budget" || arg === "-w") {
      const raw = argv[++i];
      const parsed = raw ? Number.parseInt(raw, 10) : NaN;
      warningBudget = Number.isFinite(parsed) ? parsed : null;
    }
  }
  return { vaultPath, warningBudget };
}

async function main() {
  const { vaultPath: flagPath, warningBudget } = parseArgs(
    process.argv.slice(2),
  );
  const vaultPath = flagPath ?? process.env.VAULT_PATH ?? null;
  if (!vaultPath) {
    console.error(
      "vault:import requires a vault path via --path <dir> or VAULT_PATH env var",
    );
    process.exit(2);
  }

  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/tome.db";
  const client = createClient({ url: databaseUrl });
  const db = drizzle(client, { schema });

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../lib/db/migrations"),
  });

  const absolutePath = path.resolve(vaultPath);
  console.log(`Importing vault from ${absolutePath}`);
  const result = await importVault(db, absolutePath, {
    warningBudget: warningBudget ?? undefined,
  });

  console.log(`\nStats: ${JSON.stringify(result.stats, null, 2)}`);

  if (result.warnings.length > 0) {
    console.warn(`\n${result.warnings.length} warning(s):`);
    for (const w of result.warnings) console.warn(`  - ${w}`);
  }

  if (result.errors.length > 0) {
    console.error(`\n${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  - ${e}`);
    client.close();
    process.exit(1);
  }

  client.close();
  console.log("\nImport complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
