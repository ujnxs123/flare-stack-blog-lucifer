ALTER TABLE `posts` ADD `author_name` text DEFAULT 'Admin' NOT NULL;
ALTER TABLE `posts` ADD `language` text DEFAULT 'zh' NOT NULL;

ALTER TABLE `comments` ADD `is_pinned` integer DEFAULT false NOT NULL;
ALTER TABLE `comments` ADD `is_featured` integer DEFAULT false NOT NULL;

CREATE TABLE `comment_reactions` (
  `comment_id` integer NOT NULL,
  `user_id` text NOT NULL,
  `reaction` text NOT NULL,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
  PRIMARY KEY(`comment_id`, `user_id`, `reaction`),
  FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `comment_reactions_comment_idx` ON `comment_reactions` (`comment_id`);
CREATE INDEX `comment_reactions_user_idx` ON `comment_reactions` (`user_id`);
