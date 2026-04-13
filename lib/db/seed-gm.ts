import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "./index";

export async function seedGm() {
  const username = process.env.GM_USERNAME;
  const email = process.env.GM_EMAIL;
  const password = process.env.GM_PASSWORD;
  const displayName = process.env.GM_DISPLAY_NAME ?? "Elder Thorne";

  if (!username || !email || !password) {
    console.warn(
      "[seed-gm] GM_USERNAME / GM_EMAIL / GM_PASSWORD not set — skipping GM seed."
    );
    return;
  }

  const existingGm = await db.query.users.findFirst({
    where: eq(schema.users.role, "gm"),
  });

  if (existingGm) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(schema.users).values({
    username,
    email,
    displayName,
    name: displayName,
    passwordHash,
    role: "gm",
  });

  console.log(`[seed-gm] GM user seeded: ${username}`);
}
