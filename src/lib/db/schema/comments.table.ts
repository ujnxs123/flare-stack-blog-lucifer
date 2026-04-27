import type { JSONContent } from "@tiptap/react";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth.table";
import { createdAt, id, updatedAt } from "./helper";
import { PostsTable } from "./posts.table";

export const COMMENT_STATUSES = [
  "pending",
  "published",
  "deleted",
  "verifying",
] as const;

export const COMMENT_REACTIONS = [
  "like",
  "love",
  "laugh",
  "wow",
  "sad",
  "angry",
  "fire",
  "thinking",
] as const;

export const CommentsTable = sqliteTable(
  "comments",
  {
    id,
    content: text({ mode: "json" }).$type<JSONContent>(),
    rootId: integer("root_id").references(
      (): AnySQLiteColumn => CommentsTable.id,
      {
        onDelete: "cascade",
      },
    ),
    replyToCommentId: integer("reply_to_comment_id").references(
      (): AnySQLiteColumn => CommentsTable.id,
      { onDelete: "set null" },
    ),
    status: text("status", { enum: COMMENT_STATUSES })
      .notNull()
      .default("verifying"),
    aiReason: text("ai_reason"),
    isPinned: integer("is_pinned", { mode: "boolean" })
      .notNull()
      .default(false),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),

    postId: integer("post_id")
      .notNull()
      .references(() => PostsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    createdAt,
    updatedAt,
  },
  (table) => [
    index("comments_post_root_created_idx").on(
      table.postId,
      table.rootId,
      table.createdAt,
    ),
    index("comments_user_created_idx").on(table.userId, table.createdAt),
    index("comments_status_created_idx").on(table.status, table.createdAt),
    index("comments_global_created_idx").on(table.createdAt),
  ],
);

export const EMAIL_UNSUBSCRIBE_TYPES = ["reply_notification"] as const;

export const CommentReactionsTable = sqliteTable(
  "comment_reactions",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => CommentsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reaction: text("reaction", { enum: COMMENT_REACTIONS }).notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.commentId, table.userId, table.reaction] }),
    index("comment_reactions_comment_idx").on(table.commentId),
    index("comment_reactions_user_idx").on(table.userId),
  ],
);

export const EmailUnsubscriptionsTable = sqliteTable(
  "email_unsubscriptions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: EMAIL_UNSUBSCRIBE_TYPES }).notNull(),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.userId, table.type] })],
);

// ==================== types ====================
export type Comment = typeof CommentsTable.$inferSelect;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];
export type EmailUnsubscription = typeof EmailUnsubscriptionsTable.$inferSelect;
export type EmailUnsubscribeType = (typeof EMAIL_UNSUBSCRIBE_TYPES)[number];
export type CommentReaction = (typeof COMMENT_REACTIONS)[number];
