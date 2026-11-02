PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`root` text,
	`type` text,
	`guitar_positions` text,
	`piano_positions` text,
	`user_id` integer NOT NULL,
	`is_global` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_chords`("id", "name", "root", "type", "guitar_positions", "piano_positions", "user_id", "is_global", "created_at", "updated_at") SELECT "id", "name", "root", "type", "guitar_positions", "piano_positions", "user_id", "is_global", "created_at", "updated_at" FROM `chords`;--> statement-breakpoint
DROP TABLE `chords`;--> statement-breakpoint
ALTER TABLE `__new_chords` RENAME TO `chords`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `chords_name_unique` ON `chords` (`name`);