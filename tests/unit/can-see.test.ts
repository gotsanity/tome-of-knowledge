import { describe, it, expect } from "vitest";
import { canSee, type Viewer } from "@/lib/vault/can-see";
import type { NodeVisibility } from "@/lib/db/schema";

const anonymous: Viewer = null;
const regularUser: Viewer = { role: "user" };
const gm: Viewer = { role: "gm" };

describe("canSee", () => {
  const matrix: Array<[NodeVisibility, Viewer, boolean, string]> = [
    ["published", anonymous, true, "anonymous sees published"],
    ["published", regularUser, true, "user sees published"],
    ["published", gm, true, "gm sees published"],

    ["draft", anonymous, false, "anonymous hidden from draft"],
    ["draft", regularUser, false, "user hidden from draft"],
    ["draft", gm, true, "gm sees draft"],

    ["gm-only", anonymous, false, "anonymous hidden from gm-only"],
    ["gm-only", regularUser, false, "user hidden from gm-only"],
    ["gm-only", gm, true, "gm sees gm-only"],
  ];

  it.each(matrix)("%s × %o → %s (%s)", (visibility, viewer, expected) => {
    expect(canSee(viewer, { visibility })).toBe(expected);
  });
});
