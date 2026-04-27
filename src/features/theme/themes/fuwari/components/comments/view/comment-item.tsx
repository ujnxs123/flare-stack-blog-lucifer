import { ClientOnly } from "@tanstack/react-router";
import { memo, useMemo } from "react";
import type {
  CommentReactionName,
  CommentWithUser,
} from "@/features/comments/comments.schema";
import { authClient } from "@/lib/auth/auth.client";
import { isContentAdminRole } from "@/lib/auth/roles";
import { cn, formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { ExpandableContent } from "./expandable-content";

interface CommentItemProps {
  comment: CommentWithUser;
  onReply?: (rootId: number, commentId: number, userName: string) => void;
  onDelete?: (commentId: number) => void;
  onReact?: (commentId: number, reaction: CommentReactionName) => void;
  isReply?: boolean;
  replyToName?: string | null;
  highlightCommentId?: number;
  className?: string;
}

export const FuwariCommentItem = memo(
  ({
    comment,
    onReply,
    onDelete,
    onReact,
    isReply,
    replyToName,
    highlightCommentId,
    className,
  }: CommentItemProps) => {
    const isHighlighted = highlightCommentId === comment.id;

    const { data: session } = authClient.useSession();

    const isAuthor = session?.user.id === comment.userId;
    const isAdmin = isContentAdminRole(session?.user.role);
    const isBlogger = isContentAdminRole(comment.user?.role);

    const renderedContent = useMemo(() => {
      if (comment.status === "deleted") {
        return (
          <p className="text-sm italic fuwari-text-30 py-1">
            {m.comments_item_deleted_content()}
          </p>
        );
      }
      return (
        <ExpandableContent
          content={comment.content}
          className="py-1"
          maxLines={6}
        />
      );
    }, [comment.content, comment.status]);

    return (
      <div
        id={`comment-${comment.id}`}
        className={cn(
          "group flex gap-3 md:gap-4 py-5 md:py-6 scroll-mt-32 transition-colors duration-500",
          isReply
            ? "ml-3 pl-3 border-l-2 border-black/5 dark:border-white/5 md:ml-8 md:pl-6"
            : "border-b border-black/5 dark:border-white/5",
          isHighlighted &&
            "bg-(--fuwari-btn-plain-bg-hover) -mx-4 px-4 rounded-xl",
          className,
        )}
      >
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center transition">
            {comment.status === "deleted" ? (
              <span className="text-xs fuwari-text-30">✕</span>
            ) : comment.user?.image ? (
              <img
                src={comment.user.image}
                alt={comment.user.name ?? m.comments_item_anonymous()}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium fuwari-text-50">
                {comment.user?.name?.slice(0, 1) || "?"}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium fuwari-text-75">
                {comment.status === "deleted"
                  ? m.comments_item_deleted_author()
                  : comment.user?.name || m.comments_item_anonymous()}
              </span>
              {isBlogger && comment.status !== "deleted" && (
                <span className="text-[10px] font-medium text-(--fuwari-primary) border border-(--fuwari-primary)/30 px-1.5 py-0.5 rounded-md leading-none">
                  {m.comments_item_blogger()}
                </span>
              )}
              {comment.isPinned && (
                <span className="text-[10px] font-medium text-(--fuwari-primary) border border-(--fuwari-primary)/30 px-1.5 py-0.5 rounded-md leading-none">
                  {m.comments_badge_pinned()}
                </span>
              )}
              {comment.isFeatured && (
                <span className="text-[10px] font-medium text-(--fuwari-primary) border border-(--fuwari-primary)/30 px-1.5 py-0.5 rounded-md leading-none">
                  {m.comments_badge_featured()}
                </span>
              )}

              {isReply && replyToName && (
                <span className="text-xs fuwari-text-30">
                  {m.comments_item_reply_to({
                    name:
                      comment.status === "deleted"
                        ? m.comments_item_unknown()
                        : replyToName,
                  })}
                </span>
              )}
            </div>
            <span className="text-xs fuwari-text-30">
              <ClientOnly fallback="-">
                {formatDate(comment.createdAt, { includeTime: true })}
              </ClientOnly>
            </span>
          </div>

          {renderedContent}

          {comment.status !== "deleted" && comment.reactions && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {([
                ["like", "👍"],
                ["love", "❤️"],
                ["laugh", "😂"],
                ["wow", "😮"],
                ["sad", "😢"],
                ["angry", "😡"],
                ["fire", "🔥"],
                ["thinking", "🤔"],
              ] as const).map(([reaction, emoji]) => {
                const count = comment.reactions?.[reaction] ?? 0;
                const active = comment.reactions?.myReactions.includes(reaction);
                return (
                  <button
                    key={reaction}
                    type="button"
                    onClick={() => onReact?.(comment.id, reaction)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 text-xs border border-black/10 dark:border-white/20 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:scale-105",
                      active
                        ? "bg-(--fuwari-primary) text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                        : "fuwari-text-50 hover:fuwari-text-90 hover:bg-black/5 dark:hover:bg-white/8",
                    )}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-[11px] font-semibold leading-none">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {comment.status !== "deleted" && (
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={() => {
                  const rootId = comment.rootId ?? comment.id;
                  onReply?.(
                    rootId,
                    comment.id,
                    comment.user?.name || m.comments_item_unknown_user(),
                  );
                }}
                className="text-xs fuwari-text-30 hover:text-(--fuwari-primary) transition-colors font-medium"
              >
                {m.comments_item_reply()}
              </button>

              {(isAuthor || isAdmin) && (
                <button
                  onClick={() => onDelete?.(comment.id)}
                  className="text-xs fuwari-text-30 hover:text-red-500 transition-colors font-medium"
                >
                  {m.comments_item_delete()}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

FuwariCommentItem.displayName = "FuwariCommentItem";
