CREATE TABLE `user_nav_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`contents_expanded` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
