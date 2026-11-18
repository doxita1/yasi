CREATE TABLE `ai_config` (
	`owner` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`secret` text,
	PRIMARY KEY(`owner`, `provider`)
);
--> statement-breakpoint
CREATE TABLE `ai_selection` (
	`owner` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`value` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `draft_conflicts` (
	`owner` text NOT NULL,
	`k` text NOT NULL,
	`id` text NOT NULL,
	`text` text NOT NULL,
	`base_revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `k`, `id`)
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`owner` text NOT NULL,
	`k` text NOT NULL,
	`text` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `k`)
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`owner` text NOT NULL,
	`k` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`owner`, `k`)
);
--> statement-breakpoint
CREATE TABLE `recordings` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	`object_key` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
