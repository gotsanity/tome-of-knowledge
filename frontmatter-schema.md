# Frontmatter Schema

Catalogued from the CWS document-types schema (v1.15) and existing app fixtures. Format: `{node_type}.{field} - [tags]`. Tags: `required`, `optional`, `link` (wikilink-resolved), `list`, `gm-only`, `enum(...)`. Universal fields apply to every node type unless the type explicitly omits them (notes inline).

User guidance per field goes under each line — write your notes directly below the field, then save and tell me to re-read.

When I mark something as block, I am suggesting the value be used in a section like the translator's note.

---

## universal

Apply to every node type unless the type explicitly omits them.

universal.cws_version - required - omit
universal.type - required, enum(world-overview|region|geography|faction|npc|pc|location|system|event|campaign-frame|plotline|homebrew|religion|species|bestiary|task|lore|handout|campaign) - keep as link to type in ToC, located in marginalia
universal.name - required - keep as current
universal.depth_tier - required, enum(overview|detail|deep-dive) - omit
universal.status - required, enum(draft|active|retired) - badge in marginalia
universal.visibility_state - required, enum(player-facing|gm-only|graduated) - badge in marginalia
universal.themes - required, list - omit
universal.related - required, list, link - keep, make linked records as discussed
universal.gaps - required, list, link - omit
universal.last_audited - required - omit

---

## bestiary

bestiary.creature_type - required - keep in marginalia
bestiary.danger_level - required - omit
bestiary.habitat - required - omit
bestiary.intelligence - optional - omit
bestiary.mantle_origin - optional, gm-only - omit
bestiary.rarity - optional - omit

---

## campaign

(No CWS schema — type exists in app's NodeType enum / CATEGORY_META only. No type-specific frontmatter defined.)

---

## campaign-frame

campaign-frame.central_conflict - required - omit
campaign-frame.entry_point - required, link - omit
campaign-frame.first_session_situation - optional - omit
campaign-frame.player_roles - required, list - omit
campaign-frame.premise - required - omit
campaign-frame.stakes - required - omit
campaign-frame.tone_notes - optional - omit

---

## event

event.actors - required, list, link - treat as linked records
event.constraints_triggered - optional, list - omit
event.delta - optional, list - omit
event.linked_nodes - optional, list, link - treat as linked records
event.open_questions - optional, list - omit
event.summary - required - use as tag-line/summary
event.timestamp - required - add to marginalia

---

## faction

(No type-specific frontmatter in CWS schema. Faction content lives in body sections: ## Overview, ## Current State, GM Reference Goals/Methods/Weaknesses.)

faction.goal - non-canonical (present in app fixtures and current NodeHeader whitelist; not in CWS schema) - this should only be in gm notes companion as a block

---

## geography

geography.boundaries - required - Linked records
geography.climate - optional - marginalia
geography.geography_type - required, enum(continent|sea|mountain-range|...) - magrinalia
geography.navigation_difficulty - optional - marginalia
geography.resources - optional - omit
geography.scale - required - block

---

## handout

(No CWS schema — type exists in app's NodeType enum / CATEGORY_META only. No type-specific frontmatter defined.)

---

## homebrew

(Omits universal fields: depth_tier, visibility_state, themes, gaps.)

homebrew.homebrew_type - required, enum(class|subclass|rule|item|spell|feat|other) - marginalia
homebrew.inspired_by - optional (subclass only) - marginalia
homebrew.parent_class - optional (subclass only) - marginalia
homebrew.system - required - marginalia

---

## location

location.dominant_influence - required, link - omit
location.function - required - block
location.immediate_tension - block
location.influence - non-canonical (present in app fixtures and current NodeHeader whitelist; CWS uses dominant_influence) - omit
location.physical_description - optional - block
location.regular_occupants - optional - block
location.secrets - optional, gm-only - block only viewable by gm

---

## lore

(No CWS schema — type exists in app's NodeType enum / CATEGORY_META only. No type-specific frontmatter defined.)

---

## npc

npc.faction_affiliation - required, link - add it to marginalia, using links to existing nodes if possible
npc.influence - required - block
npc.motivation - required - gm-only block
npc.private_goal - required, gm-only - gm-only block
npc.public_role - optional - block
npc.relationship_to_players - optional, gm-only - omit
npc.species - required, link - marginalia with link to node
npc.weak_point - required, gm-only - block gm-only

---

## pc

(player-facing portion is user-owned; weak_point and private_goal live in frontmatter for GM reference only and are exempt from player-facing rendering.)

pc.class - required, link (when homebrew) - marginalia
pc.faction_affiliation - optional, link - marginalia
pc.level - required - marginalia
pc.motivation - required - block
pc.player - required - marginalia
pc.private_goal - required, gm-only - block gm only
pc.pronouns - optional - marginalia
pc.public_role - optional - omit
pc.species - required, link - marginalia
pc.weak_point - required, gm-only - block gm-only

---

## plotline

(Default visibility_state: gm-only. Plotline's own status enum overrides the universal status enum.)

plotline.depends_on - optional, list, link - linked records
plotline.faction_affiliation - optional, link (required when plotline_type=faction) - block
plotline.pc_affiliation - optional, link (required when plotline_type=personal) - marginalia
plotline.phase - required, enum(setup|escalation|resting|climax|aftermath) - marginalia
plotline.plotline_type - required, enum(main|side|faction|personal|background) - marginalia
plotline.stakes - required - block
plotline.status - required, enum(dormant|active|resolved|failed|abandoned) - marginalia

---

## region

region.cultural_tendency - required - marginalia
region.dominant_conflict - required - marginalia
region.external_dependencies - optional - marginalia
region.historical_pressure - optional - marginalia
region.identity - required - marginalia
region.key_resource - required - marginalia

---

## religion

religion.denominations - optional - marginalia
religion.doctrine - required - omit
religion.ethics - optional - marginalia
religion.hierarchy - required - omit
religion.history - optional - omit
religion.public_standing - required - marginalia
religion.theology - optional - omit
religion.worship_practice - required - omit

---

## species

(Omits universal fields: depth_tier, visibility_state, themes. All content lives in body sections: ## Appearance, ## Society, ## [Species] Traits.)

(No type-specific frontmatter.)

---

## system

system.actual_mechanics - optional, gm-only - omit
system.failure_modes - optional, gm-only - omit
system.limits - required - omit
system.public_understanding - optional - omit
system.rules - required - omit
system.system_type - required, enum(magic|technology|economy|law|other) - marginalia
system.who_controls - required, link - linked records

---

## task

IMPORTANT - omit this entire type. it is deprecated and won't be used in the future.

(Omits universal fields: related, themes, gaps, depth_tier, visibility_state, status. Has its own status enum.)

task.audit_result - required, enum(~|pass|fail)
task.created - required, date
task.node_type - required, enum
task.priority - required, enum(high|medium|world-level)
task.status - required, enum(open|in-progress|complete)
task.surfaced_by - required
task.world - required

---

## world-overview

world-overview.core_tensions - required, list - block
world-overview.cosmology - optional - block
world-overview.premise - required - block
world-overview.prohibited - required, list - block
world-overview.themes - required, list (declarative statements, not mood words — overrides universal themes guidance) - block
world-overview.tone_profile - optional - block
world-overview.world_rules - required, list - block
