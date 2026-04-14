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

    it("the new v3.0 item type has rules defined", () => {
      expect(TYPE_RULES).toHaveProperty("item");
      const keys = TYPE_RULES.item.map((r) => r.key);
      expect(keys).toEqual(["item_type", "sentient", "attuned_to"]);
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

    it("universal rules use v3.0 'visibility' key (not the legacy 'visibility_state')", () => {
      const keys = UNIVERSAL_RULES.map((r) => r.key);
      expect(keys).toContain("visibility");
      expect(keys).not.toContain("visibility_state");
    });

    it("badge rules only appear in the marginalia slot", () => {
      const all = [...UNIVERSAL_RULES, ...Object.values(TYPE_RULES).flat()];
      for (const rule of all) {
        if (rule.badge) expect(rule.slot).toBe("marginalia");
      }
    });

    it("list flags never appear on badge rules", () => {
      const all = [...UNIVERSAL_RULES, ...Object.values(TYPE_RULES).flat()];
      for (const rule of all) {
        if (rule.list) expect(rule.badge).not.toBe(true);
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

    it("v3.0 npc only has species and faction_affiliation in frontmatter", () => {
      const rules = rulesForType("npc");
      expect(rules[0].key).toBe("type");
      const npcKeys = rules
        .slice(UNIVERSAL_RULES.length)
        .map((r) => r.key);
      expect(npcKeys).toEqual(["species", "faction_affiliation"]);
    });

    it("v3.0 pc includes the new subclass and heritage fields", () => {
      const rules = rulesForType("pc");
      const pcKeys = rules.slice(UNIVERSAL_RULES.length).map((r) => r.key);
      expect(pcKeys).toEqual([
        "player",
        "level",
        "class",
        "subclass",
        "species",
        "heritage",
        "faction_affiliation",
        "pronouns",
      ]);
    });

    it("types that moved all content to body sections have no type-specific rules", () => {
      // v3.0 dropped type-specific frontmatter for these types entirely —
      // their content lives in body sections rendered by NodeBody.
      const noFrontmatterTypes = [
        "location",
        "faction",
        "campaign-frame",
        "world-overview",
      ];
      for (const t of noFrontmatterTypes) {
        expect(TYPE_RULES[t]).toEqual([]);
      }
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
        expect.arrayContaining(["status", "visibility"]),
      );
    });

    it("hides GM-only universal badges entirely from non-GM viewers", () => {
      const pub = partitionRulesForViewer("npc", false);
      expect(pub.marginaliaBadges).toEqual([]);
    });

    it("puts linked-records rules into linkedRecords", () => {
      const p = partitionRulesForViewer("event", false);
      const keys = p.linkedRecords.map((r) => r.key);
      expect(keys).toEqual(["actors"]);
    });

    it("plotline.status survives as a row for non-GM viewers (type override)", () => {
      const p = partitionRulesForViewer("plotline", false);
      const rowKeys = p.marginaliaRows.map((r) => r.key);
      expect(rowKeys).toContain("status");
      expect(p.marginaliaBadges.map((r) => r.key)).not.toContain("status");
    });

    it("item type's sentient field renders as a marginalia badge", () => {
      const p = partitionRulesForViewer("item", false);
      const badgeKeys = p.marginaliaBadges.map((r) => r.key);
      expect(badgeKeys).toContain("sentient");
    });
  });
});
