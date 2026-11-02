ALTER TABLE `setlists` ADD `is_public` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `songs` ADD `video_url` text;
