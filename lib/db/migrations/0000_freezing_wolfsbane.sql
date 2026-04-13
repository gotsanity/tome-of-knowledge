CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`createdBy` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_unique` ON `invites` (`token`);--> statement-breakpoint
CREATE TABLE `lexicon_terms` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`term` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`domain` text NOT NULL,
	`definition` text NOT NULL,
	`usage` text,
	`notes` text,
	`related_terms` text DEFAULT '[]' NOT NULL,
	`tooltip_enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lexicon_terms_slug_idx` ON `lexicon_terms` (`slug`);--> statement-breakpoint
CREATE TABLE `node_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`heading` text NOT NULL,
	`order` integer NOT NULL,
	`body_md` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `node_sections_node_idx` ON `node_sections` (`node_id`);--> statement-breakpoint
CREATE TABLE `node_themes` (
	`node_id` text NOT NULL,
	`theme_id` text NOT NULL,
	PRIMARY KEY(`node_id`, `theme_id`),
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`visibility` text NOT NULL,
	`depth_tier` text,
	`status` text,
	`frontmatter` text DEFAULT '{}' NOT NULL,
	`body_md` text DEFAULT '' NOT NULL,
	`companion_slug` text,
	`source_path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nodes_slug_idx` ON `nodes` (`slug`);--> statement-breakpoint
CREATE INDEX `nodes_type_idx` ON `nodes` (`type`);--> statement-breakpoint
CREATE INDEX `nodes_visibility_idx` ON `nodes` (`visibility`);--> statement-breakpoint
CREATE INDEX `nodes_type_visibility_idx` ON `nodes` (`type`,`visibility`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`from_slug` text NOT NULL,
	`to_slug` text NOT NULL,
	`rel_type` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `relationships_unique_idx` ON `relationships` (`from_slug`,`to_slug`,`rel_type`);--> statement-breakpoint
CREATE INDEX `relationships_from_idx` ON `relationships` (`from_slug`);--> statement-breakpoint
CREATE INDEX `relationships_to_idx` ON `relationships` (`to_slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `themes_slug_idx` ON `themes` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`email` text,
	`emailVerified` integer,
	`displayName` text,
	`name` text,
	`image` text,
	`passwordHash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
