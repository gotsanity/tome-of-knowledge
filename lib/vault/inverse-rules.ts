export const RELATIONSHIP_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["CONTAINS", "LOCATED_IN"],
  ["BORDERS", "BORDERS"],
  ["MEMBER_OF", "HAS_MEMBER"],
  ["BASED_IN", "HOUSES"],
  ["OPERATES_IN", "HOSTS"],
  ["FEATURES", "FEATURED_IN"],
  ["GOVERNS", "GOVERNED_BY"],
  ["DESCRIBES", "DESCRIBED_BY"],
  ["ASSOCIATED_WITH", "ASSOCIATED_WITH"],
  ["SYNTHESIZES_FROM", "SOURCE_OF"],
  ["CONTROLS", "CONTROLLED_BY"],
  ["CONTRACTS", "CONTRACTED_BY"],
  ["OCCURRED_IN", "HAS_EVENT"],
  ["DEPENDS_ON", "DEPENDENCY_OF"],
  ["ADVANCES", "ADVANCED_BY"],
  ["FEATURES_IN", "FEATURED_BY"],
];

const INVERSE_MAP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [forward, inverse] of RELATIONSHIP_PAIRS) {
    map.set(forward, inverse);
    map.set(inverse, forward);
  }
  return map;
})();

export function inverseOf(relType: string): string | null {
  return INVERSE_MAP.get(relType) ?? null;
}

export function isKnownRelationship(relType: string): boolean {
  return INVERSE_MAP.has(relType);
}
