import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

export type Role = "user" | "gm";

export const NODE_TYPES = [
  "npc",
  "location",
  "faction",
  "region",
  "species",
  "religion",
  "system",
  "lore",
  "event",
  "plotline",
  "campaign",
  "campaign-frame",
  "handout",
  "bestiary",
  "pc",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_VISIBILITY = ["draft", "published", "gm-only"] as const;
export type NodeVisibility = (typeof NODE_VISIBILITY)[number];

export const RELATIONSHIP_SOURCES = ["explicit", "inverse"] as const;
export type RelationshipSource = (typeof RELATIONSHIP_SOURCES)[number];

export const LEXICON_DOMAINS = ["CWS", "World", "RPG"] as const;
export type LexiconDomain = (typeof LEXICON_DOMAINS)[number];

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").unique(),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  displayName: text("displayName"),
  name: text("name"),
  image: text("image"),
  passwordHash: text("passwordHash"),
  role: text("role", { enum: ["user", "gm"] })
    .notNull()
    .default("user"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const invites = sqliteTable("invites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  role: text("role", { enum: ["user", "gm"] })
    .notNull()
    .default("user"),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("usedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const nodes = sqliteTable(
  "nodes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    type: text("type", { enum: NODE_TYPES }).notNull(),
    name: text("name").notNull(),
    visibility: text("visibility", { enum: NODE_VISIBILITY }).notNull(),
    depthTier: text("depth_tier"),
    status: text("status"),
    frontmatter: text("frontmatter").notNull().default("{}"),
    bodyMd: text("body_md").notNull().default(""),
    companionSlug: text("companion_slug"),
    sourcePath: text("source_path").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    slugIdx: uniqueIndex("nodes_slug_idx").on(table.slug),
    typeIdx: index("nodes_type_idx").on(table.type),
    visibilityIdx: index("nodes_visibility_idx").on(table.visibility),
    typeVisibilityIdx: index("nodes_type_visibility_idx").on(
      table.type,
      table.visibility,
    ),
  }),
);

export const nodeSections = sqliteTable(
  "node_sections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    heading: text("heading").notNull(),
    order: integer("order").notNull(),
    bodyMd: text("body_md").notNull().default(""),
  },
  (table) => ({
    nodeIdx: index("node_sections_node_idx").on(table.nodeId),
  }),
);

export const relationships = sqliteTable(
  "relationships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fromSlug: text("from_slug").notNull(),
    toSlug: text("to_slug").notNull(),
    relType: text("rel_type").notNull(),
    source: text("source", { enum: RELATIONSHIP_SOURCES }).notNull(),
  },
  (table) => ({
    uniq: uniqueIndex("relationships_unique_idx").on(
      table.fromSlug,
      table.toSlug,
      table.relType,
    ),
    fromIdx: index("relationships_from_idx").on(table.fromSlug),
    toIdx: index("relationships_to_idx").on(table.toSlug),
  }),
);

export const lexiconTerms = sqliteTable(
  "lexicon_terms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    term: text("term").notNull(),
    aliases: text("aliases").notNull().default("[]"),
    domain: text("domain", { enum: LEXICON_DOMAINS }).notNull(),
    definition: text("definition").notNull(),
    usage: text("usage"),
    notes: text("notes"),
    relatedTerms: text("related_terms").notNull().default("[]"),
    tooltipEnabled: integer("tooltip_enabled").notNull().default(1),
  },
  (table) => ({
    slugIdx: uniqueIndex("lexicon_terms_slug_idx").on(table.slug),
  }),
);

export const themes = sqliteTable(
  "themes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("themes_slug_idx").on(table.slug),
  }),
);

export const nodeThemes = sqliteTable(
  "node_themes",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    themeId: text("theme_id")
      .notNull()
      .references(() => themes.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.nodeId, table.themeId] }),
  }),
);
