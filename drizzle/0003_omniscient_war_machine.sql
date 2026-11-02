CREATE TABLE `chords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`root` text,
	`type` text,
	`guitar_positions` text,
	`piano_positions` text,
	`user_id` integer,
	`is_custom` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chords_name_unique` ON `chords` (`name`);