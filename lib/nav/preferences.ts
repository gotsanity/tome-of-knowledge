import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

export type NavPreferences = {
  contentsExpanded: boolean;
};

export const DEFAULT_NAV_PREFERENCES: NavPreferences = {
  contentsExpanded: true,
};

export type ExpandableNavKey = "contents";

const EXPANDABLE_NAV_KEYS: readonly ExpandableNavKey[] = ["contents"] as const;

function isExpandableKey(key: string): key is ExpandableNavKey {
  return (EXPANDABLE_NAV_KEYS as readonly string[]).includes(key);
}

export async function getNavPreferences(
  db: LibSQLDatabase<typeof schema>,
  userId: string | null,
): Promise<NavPreferences> {
  if (!userId) return DEFAULT_NAV_PREFERENCES;
  const row = await db.query.userNavPreferences.findFirst({
    where: eq(schema.userNavPreferences.userId, userId),
  });
  if (!row) return DEFAULT_NAV_PREFERENCES;
  return {
    contentsExpanded: row.contentsExpanded === 1,
  };
}

export async function setNavItemExpanded(
  db: LibSQLDatabase<typeof schema>,
  userId: string | null,
  key: ExpandableNavKey,
  expanded: boolean,
): Promise<void> {
  if (!userId) return;
  if (!isExpandableKey(key)) return;
  const value = expanded ? 1 : 0;
  const now = new Date();
  await db
    .insert(schema.userNavPreferences)
    .values({
      userId,
      contentsExpanded: value,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.userNavPreferences.userId,
      set: {
        contentsExpanded: value,
        updatedAt: now,
      },
    });
}
