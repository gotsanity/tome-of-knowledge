import type { NodeVisibility, Role } from "@/lib/db/schema";

export type Viewer = { role: Role } | null;

export function canSee(
  viewer: Viewer,
  node: { visibility: NodeVisibility },
): boolean {
  if (node.visibility === "published") return true;
  return viewer?.role === "gm";
}

export function isGm(viewer: Viewer): boolean {
  return viewer?.role === "gm";
}
