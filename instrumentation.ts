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

  if (process.env.VAULT_IMPORT_ON_BOOT === "true" && process.env.VAULT_PATH) {
    try {
      const { spawn } = await import("child_process");
      const budget = process.env.VAULT_IMPORT_WARNING_BUDGET ?? "500";
      console.log(
        `[instrumentation] importing vault from ${process.env.VAULT_PATH}`,
      );
      await new Promise<void>((resolve) => {
        const child = spawn(
          "npm",
          ["run", "vault:import", "--", "--warning-budget", budget],
          { stdio: "inherit", env: process.env },
        );
        child.on("exit", (code) => {
          if (code === 0) {
            console.log("[instrumentation] vault import complete");
          } else {
            console.error(
              `[instrumentation] vault import exited with code ${code}`,
            );
          }
          resolve();
        });
        child.on("error", (err) => {
          console.error("[instrumentation] vault import spawn failed", err);
          resolve();
        });
      });
    } catch (err) {
      console.error("[instrumentation] vault import failed", err);
    }
  }
}
