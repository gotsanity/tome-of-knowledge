import { describe, it, expect } from "vitest";
import {
  UNIVERSAL_RULES,
  TYPE_RULES,
  rulesForType,
  partitionRulesForViewer,
} from "@/lib/vault/node-display-config";
import { NODE_TYPES } from "@/lib/db/schema";

describe("node-display-config", () => {
  describe("well-formedness", () => {
    it("every app NodeType has a rule list (even if empty)", () => {
      for (const type of NODE_TYPES) {
        expect(TYPE_RULES).toHaveProperty(type);
      }
    });

    it("no type has duplicate field keys", () => {
      const dupes: string[] = [];
      for (const [type, rules] of Object.entries(TYPE_RULES)) {
        const keys = rules.map((r) => r.key);
        if (new Set(keys).size !== keys.length) dupes.push(type);
      }
      expect(dupes).toEqual([]);
    });

    it("universal rules have no duplicates", () => {
      const keys = UNIVERSAL_RULES.map((r) => r.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("badge rules only appear in the marginalia slot", () => {
      const all = [
        ...UNIVERSAL_RULES,
        ...Object.values(TYPE_RULES).flat(),
      ];
      for (const rule of all) {
        if (rule.badge) expect(rule.slot).toBe("marginalia");
      }
    });

    it("link / list flags only appear on slots that consume them", () => {
      const all = [
        ...UNIVERSAL_RULES,
        ...Object.values(TYPE_RULES).flat(),
      ];
      for (const rule of all) {
        if (rule.list) {
          // lists make sense in linked-records and in blocks (bulleted) but
          // not as badges (single enum value only)
          expect(rule.badge).not.toBe(true);
        }
      }
    });
  });

  describe("rulesForType", () => {
    it("merges universal rules for unknown types", () => {
      const rules = rulesForType("nonexistent-type");
      expect(rules.map((r) => r.key)).toEqual(
        UNIVERSAL_RULES.map((r) => r.key),
      );
    });

    it("appends type-specific rules after universal rules", () => {
      const rules = rulesForType("npc");
      expect(rules[0].key).toBe("type");
      const npcKeys = rules.slice(UNIVERSAL_RULES.length).map((r) => r.key);
      expect(npcKeys).toEqual([
        "species",
        "faction_affiliation",
        "public_role",
        "influence",
        "motivation",
        "private_goal",
        "weak_point",
      ]);
    });

    it("lets a type rule override a universal rule with the same key", () => {
      // plotline.status is a content row, not a GM-only badge
      const rules = rulesForType("plotline");
      const statusRules = rules.filter((r) => r.key === "status");
      expect(statusRules).toHaveLength(1);
      expect(statusRules[0].badge).toBeUndefined();
      expect(statusRules[0].gmOnly).toBeUndefined();
    });
  });

  describe("partitionRulesForViewer", () => {
    it("places non-badge marginalia rules into marginaliaRows", () => {
      const p = partitionRulesForViewer("region", true);
      const rowKeys = p.marginaliaRows.map((r) => r.key);
      expect(rowKeys).toContain("type");
      expect(rowKeys).toContain("identity");
    });

    it("splits universal badges out into marginaliaBadges for GM viewers", () => {
      const p = partitionRulesForViewer("npc", true);
      const badgeKeys = p.marginaliaBadges.map((r) => r.key);
      expect(badgeKeys).toEqual(
        expect.arrayContaining(["status", "visibility_state"]),
      );
    });

    it("hides GM-only rules entirely from non-GM viewers", () => {
      const gm = partitionRulesForViewer("npc", true);
      const pub = partitionRulesForViewer("npc", false);

      // status + visibility_state badges gone for public viewer
      expect(pub.marginaliaBadges).toEqual([]);
      expect(gm.marginaliaBadges.length).toBeGreaterThan(0);

      // gm-only npc blocks (motivation, private_goal, weak_point) gone
      // for public viewer
      expect(pub.blocksGm).toEqual([]);
      expect(gm.blocksGm.map((r) => r.key)).toEqual([
        "motivation",
        "private_goal",
        "weak_point",
      ]);

      // public-only npc blocks still visible to the public viewer
      expect(pub.blocksPublic.map((r) => r.key)).toEqual([
        "public_role",
        "influence",
      ]);
    });

    it("puts linked-records rules into linkedRecords", () => {
      const p = partitionRulesForViewer("event", false);
      const keys = p.linkedRecords.map((r) => r.key);
      expect(keys).toEqual(["actors", "linked_nodes"]);
    });

    it("plotline.status survives as a row for non-GM viewers (type override)", () => {
      const p = partitionRulesForViewer("plotline", false);
      const rowKeys = p.marginaliaRows.map((r) => r.key);
      expect(rowKeys).toContain("status");
      // and is NOT in the gm badge bucket
      expect(p.marginaliaBadges.map((r) => r.key)).not.toContain("status");
    });
  });
});
