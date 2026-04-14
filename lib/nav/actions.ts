"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  setNavItemExpanded,
  type ExpandableNavKey,
} from "@/lib/nav/preferences";

export async function setNavItemExpandedAction(
  key: ExpandableNavKey,
  expanded: boolean,
): Promise<void> {
  const user = await getSessionUser();
  if (!user?.id) return;
  await setNavItemExpanded(db, user.id, key, expanded);
}
