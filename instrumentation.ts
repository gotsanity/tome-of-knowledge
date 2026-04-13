export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runMigrations } = await import("@/lib/db/migrate");
  const { seedGm } = await import("@/lib/db/seed-gm");

  try {
    await runMigrations();
    console.log("[instrumentation] migrations applied");
  } catch (err) {
    console.error("[instrumentation] migration failed", err);
    return;
  }

  try {
    await seedGm();
  } catch (err) {
    console.error("[instrumentation] GM seed failed", err);
  }
}
