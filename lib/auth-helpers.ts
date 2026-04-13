import { auth } from "@/lib/auth";
import type { Role } from "@/lib/db/schema";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireGm() {
  const user = await getSessionUser();
  if (!user || user.role !== "gm") {
    return null;
  }
  return user;
}

export function isRole(value: unknown): value is Role {
  return value === "user" || value === "gm";
}
