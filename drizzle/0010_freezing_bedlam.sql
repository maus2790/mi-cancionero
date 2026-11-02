ALTER TABLE `chords` ADD `piano_image_url` text;--> statement-breakpoint
ALTER TABLE `songs` ADD `audio_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user';